import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import OrderModel, { IOrder } from "../models/order.model";
import userModel, { CartItem } from "../models/user.model";
import CourseModel, { ICourse } from "../models/course.model";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import { getAllOrdersService, newOrder } from "../services/order.service";
import { redis } from "../utils/redis";
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


//create Order

export const createOrder = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId, payment_info } = req.body as {courseId:string,payment_info:any};

        if (payment_info) {
            if ("id" in payment_info) {
                const paymentIntentId = payment_info.id;
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

                //validate data from dummny data
                if (paymentIntent.status !== "succeeded") {
                    return next(new ErrorHandler("Payment not authorized!", 400));
                }
            }
        }

        const user = await userModel.findById(req.user?._id);

        //check user already purchase this course
        const courseExistInUser = user?.courses.some((course: any) => course._id.toString() === courseId);
        if (courseExistInUser) {
            return next(new ErrorHandler("You have already purchased this course", 400));
        }

        //check course exist
        const course: ICourse | null = await CourseModel.findById(courseId);
        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }

        const data: any = {
            courseIds: [course._id],
            userId: user?.id,
            payment_info,
        };

        //create mailData to fetch data to the email user after success purchasing
        const mailData = {
            order: {
                _id: course._id.toString().slice(0, 6), //error   _id: course._id.slice(0, 6),
                name: course.name,
                price: course.price,
                //order Date: type===> 2014 September 29
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            },
        };

        const html = await ejs.renderFile(
            path.join(__dirname, '../mails/order-confirmmation.ejs'),
            { order: mailData }
        );


        try {
            //if user still exists
            if (user) {
                await sendMail({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "order-confirmmation.ejs",
                    data: mailData,
                })
            }

        } catch (err: any) {
            return next(new ErrorHandler(err.message, 500));
        }

        //push new course element into user.course array
        user?.courses.push(course?._id); // fixing it document.d.ts ==> check it if bug

        //update redis
        await redis.set(req.user?._id, JSON.stringify(user));

        //update user table 
        await user?.save();

        //create notification to notify user
        await NotificationModel.create({
            userId: user?._id,
            title: "New Order",
            message: `You have new order: ${course?.name}`,
        });

        //update user.purchase
        course.purchased = (course.purchased ?? 0) + 1;

        await course.save();

        //create new order
        newOrder(data, res, next);



    } catch (err: any) {
        return next(new ErrorHandler(err.message, 500));
    }
});
export const createCartOrder = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseIds, payment_info } = req.body as { courseIds: string[], payment_info: any };
        console.log("Paying",courseIds);
        if (payment_info) {
            if ("id" in payment_info) {
                const paymentIntentId = payment_info.id;
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

                if (paymentIntent.status !== "succeeded") {
                    return next(new ErrorHandler("Payment not authorized!", 400));
                }
            }
        }

        const user = await userModel.findById(req.user?._id);
        const mailData = {
            orders: [] as { _id: string; name: string; price: number; date: string }[]
        };
        for (const courseId of courseIds) {
            const courseExistInUser = user?.courses.some((course: any) => course._id.toString() === courseId);
            if (courseExistInUser) {
                return next(new ErrorHandler("You have already purchased one or more of the selected courses", 400));
            }

            const course: ICourse | null = await CourseModel.findById(courseId);
            if (!course) {
                return next(new ErrorHandler(`Course with ID ${courseId} not found`, 404));
            }

            mailData.orders.push({
                _id: course._id.toString().slice(0, 6),
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            });

            user?.courses.push(course?._id);

            try{
                console.log("Creating notification 1");
                await NotificationModel.create({
                    userId: course.lecturer?._id,
                    title: "New Order",
                    message: `You have new order: ${course?.name}`,
                });
            }catch (err:any) {
                return next(new ErrorHandler(err.message, 500));
            }
            course.purchased = (course.purchased ?? 0) + 1;
            await course.save();
        }
        
        try{
            const html = await ejs.renderFile(
                path.join(__dirname, '../mails/order-confirmmation.ejs'),
                { order: mailData }
            );
        }catch (err:any) {
            console.log("Error Email Creating:",err);
            return next(new ErrorHandler(err.message, 500));
        }
        
        
        try {
            if (user) {
                let data={ order: mailData }
                await sendMail({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "order-confirmmation.ejs",
                    data,
                });
                console.log("MailData 2",data);
            }
        } catch (err:any) {
            console.log("Error Email:",err);
            return next(new ErrorHandler(err.message, 500));
        }



        const data: any = {
            courseIds: courseIds,
            userId: user?.id,
            payment_info,
        };

        await redis.set(req.user?._id, JSON.stringify(user));
        await user?.save();

        newOrder(data, res, next);

    } catch (err: any) {
        return next(new ErrorHandler(err.message, 500));
    }
});
//get all Orders
export const getAllOrders = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            getAllOrdersService(res);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);


// send stripe publishable key

export const sendStripePublishableKey = CatchAsyncError(async (req: Request, res: Response) => {
    res.status(200).json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    })
});

// new payment

export const newPayment = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const myPayment = await stripe.paymentIntents.create({
            amount: req.body.amount,
            currency: "GBP",
            metadata: {
                company: "ELearning_CuongDat"
            },
            automatic_payment_methods: {
                enabled: true,
            }
        });

        res.status(201).json({
            success: true,
            client_secret: myPayment.client_secret,
        });

    } catch (err: any) {
        return next(new ErrorHandler(err.message, 500));
    }
});


export const addToCartUser = async (req: Request, res: Response) => {
    try {
        const { courseId, name, thumbnail, price, estimatedPrice } = req.body;
        const user = await userModel.findById(req.user._id);

        if (user) {
            const existingCartItem = user.cart.find((item) => item.courseId === courseId);

            if (existingCartItem) {
                return res.status(400).json({ message: 'The course was already in the cart' });
            }

            const newCartItem: any = {
                courseId: courseId,
                name: name,
                thumbnail: thumbnail,
                price: price,
                estimatedPrice: estimatedPrice
            };

            user.cart.push(newCartItem);

            await user.save();
            await redis.set(req.user._id, JSON.stringify(user));

            return res.status(200).json({ message: 'Cart item added successfully to user cart', cartItems: user.cart });
        } else {
            return res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};


export const fetchCartUser = async (req: Request, res: Response) => {
    try {
        const user = await userModel.findById(req.user._id);

        if (user) {
            return res.status(200).json({ cartItems: user.cart });
        } else {
            return res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteCartItemUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await userModel.findById(req.user._id);
        if (!id){
            return res.status(404).json({ message: 'Course not found' });
        }
        if (user) {
            user.cart = user.cart.filter((item: CartItem) => item.courseId.toString() !== id);
            await user.save();
            await redis.set(req.user._id, JSON.stringify(user));

            return res.status(200).json({ message: 'Cart item deleted successfully', cartItems: user.cart });
        } else {
            return res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const clearCartItemsUser = async (req: Request, res: Response) => {
    try {
        const user = await userModel.findById(req.user._id);
        
        if (user) {
            // Clear all items in the user's cart
            user.cart = [];
            
            await user.save();
            await redis.set(req.user._id, JSON.stringify(user));
            console.log("1");
            return res.status(200).json({ message: 'Cart items cleared successfully', cartItems: user.cart });
        } else {
            console.log("2");
            return res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.log("3");
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const addToCartGuest = async (req: Request, res: Response) => {
    try {
        const { courseId, name, thumbnail, price, estimatedPrice } = req.body;
        let cartItems: CartItem[] = [];

        // Retrieve existing cart items from the cookie
        if (req.cookies.cart_items) {
            cartItems = JSON.parse(req.cookies.cart_items);
        }
        const existingCartItem = cartItems.find((item) => item.courseId === courseId);

        if (existingCartItem) {
            return res.status(400).json({ message: 'The course was already in the cart' });
        }

        const newCartItem: any = {
            courseId: courseId,
            name: name,
            thumbnail: thumbnail,
            price: price,
            estimatedPrice: estimatedPrice
        };

        cartItems.push(newCartItem);

        // Save the updated cart items into the cookie
        res.cookie("cart_items", JSON.stringify(cartItems), { /* Add your cookie options here */ });

        return res.status(200).json({ message: 'Cart item added successfully to cookie', cartItems: cartItems });
    
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const fetchCartGuest = async (req: Request, res: Response) => {
    try {
        let cartItems = [];
        if (req.cookies.cart_items) {
            cartItems = JSON.parse(req.cookies.cart_items);
        }
        return res.status(200).json({ cartItems: cartItems });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteCartItemGuest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        let cartItems: CartItem[] = [];

        // Retrieve cart items from the cookie
        if (req.cookies.cart_items) {
            cartItems = JSON.parse(req.cookies.cart_items);

            // Filter out the item to be deleted from the cart
            console.log("DataCart",id);
            cartItems = cartItems.filter((item: CartItem) => item.courseId.toString() !== id);

            // Update the cookie with the modified cart items
            res.cookie("cart_items", JSON.stringify(cartItems), { /* Add your cookie options here */ });

            return res.status(200).json({ message: 'Cart item deleted successfully', cartItems: cartItems });
        } else {
            return res.status(404).json({ error: 'Cart is empty' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};
