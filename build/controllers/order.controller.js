"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCartItemGuest = exports.fetchCartGuest = exports.addToCartGuest = exports.clearCartItemsUser = exports.deleteCartItemUser = exports.fetchCartUser = exports.addToCartUser = exports.newPayment = exports.sendStripePublishableKey = exports.getAllOrders = exports.createCartOrder = exports.createOrder = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const user_model_1 = __importDefault(require("../models/user.model"));
const course_model_1 = __importDefault(require("../models/course.model"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const order_service_1 = require("../services/order.service");
const redis_1 = require("../utils/redis");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
//create Order
exports.createOrder = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { courseId, payment_info } = req.body;
        if (payment_info) {
            if ("id" in payment_info) {
                const paymentIntentId = payment_info.id;
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                //validate data from dummny data
                if (paymentIntent.status !== "succeeded") {
                    return next(new ErrorHandler_1.default("Payment not authorized!", 400));
                }
            }
        }
        const user = await user_model_1.default.findById(req.user?._id);
        //check user already purchase this course
        const courseExistInUser = user?.courses.some((course) => course._id.toString() === courseId);
        if (courseExistInUser) {
            return next(new ErrorHandler_1.default("You have already purchased this course", 400));
        }
        //check course exist
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 404));
        }
        const data = {
            courseIds: [course._id],
            userId: user?.id,
            payment_info,
        };
        //create mailData to fetch data to the email user after success purchasing
        const mailData = {
            // user: {
            //     name: user?.name,
            // },
            //order object 
            order: {
                _id: course._id.toString().slice(0, 6), //error   _id: course._id.slice(0, 6),
                name: course.name,
                price: course.price,
                //order Date: type===> 2014 September 29
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            },
            // ORIGIN: process.env.ORIGIN,
        };
        //fetch emailData to user mail
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, '../mails/order-confirmmation.ejs'), { order: mailData });
        try {
            //if user still exists
            if (user) {
                await (0, sendMail_1.default)({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "order-confirmmation.ejs",
                    data: mailData,
                });
            }
        }
        catch (err) {
            return next(new ErrorHandler_1.default(err.message, 500));
        }
        //push new course element into user.course array
        user?.courses.push(course?._id); // fixing it document.d.ts ==> check it if bug
        //update redis
        await redis_1.redis.set(req.user?._id, JSON.stringify(user));
        //update user table 
        await user?.save();
        //create notification to notify user
        await notification_model_1.default.create({
            userId: user?._id,
            title: "New Order",
            message: `You have new order: ${course?.name}`,
        });
        //update user.purchase
        course.purchased = (course.purchased ?? 0) + 1;
        await course.save();
        //create new order
        (0, order_service_1.newOrder)(data, res, next);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
exports.createCartOrder = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { courseIds, payment_info } = req.body;
        console.log("Paying", courseIds);
        if (payment_info) {
            if ("id" in payment_info) {
                const paymentIntentId = payment_info.id;
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                if (paymentIntent.status !== "succeeded") {
                    return next(new ErrorHandler_1.default("Payment not authorized!", 400));
                }
            }
        }
        const user = await user_model_1.default.findById(req.user?._id);
        for (const courseId of courseIds) {
            const courseExistInUser = user?.courses.some((course) => course._id.toString() === courseId);
            if (courseExistInUser) {
                return next(new ErrorHandler_1.default("You have already purchased one or more of the selected courses", 400));
            }
            const course = await course_model_1.default.findById(courseId);
            if (!course) {
                return next(new ErrorHandler_1.default(`Course with ID ${courseId} not found`, 404));
            }
            user?.courses.push(course?._id);
            await notification_model_1.default.create({
                userId: user?._id,
                title: "New Order",
                message: `You have new order: ${course?.name}`,
            });
            course.purchased = (course.purchased ?? 0) + 1;
            await course.save();
        }
        const data = {
            courseIds: courseIds,
            userId: user?.id,
            payment_info,
        };
        await redis_1.redis.set(req.user?._id, JSON.stringify(user));
        await user?.save();
        (0, order_service_1.newOrder)(data, res, next);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
//get all Orders
exports.getAllOrders = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        (0, order_service_1.getAllOrdersService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// send stripe publishable key
exports.sendStripePublishableKey = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res) => {
    res.status(200).json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
});
// new payment
exports.newPayment = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
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
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
const addToCartUser = async (req, res) => {
    try {
        const { courseId, name, thumbnail, price, estimatedPrice } = req.body;
        const user = await user_model_1.default.findById(req.user._id);
        if (user) {
            const existingCartItem = user.cart.find((item) => item.courseId === courseId);
            if (existingCartItem) {
                return res.status(400).json({ message: 'The course was already in the cart' });
            }
            const newCartItem = {
                courseId: courseId,
                name: name,
                thumbnail: thumbnail,
                price: price,
                estimatedPrice: estimatedPrice
            };
            user.cart.push(newCartItem);
            await user.save();
            await redis_1.redis.set(req.user._id, JSON.stringify(user));
            return res.status(200).json({ message: 'Cart item added successfully to user cart', cartItems: user.cart });
        }
        else {
            return res.status(404).json({ error: 'User not found' });
        }
    }
    catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.addToCartUser = addToCartUser;
const fetchCartUser = async (req, res) => {
    try {
        const user = await user_model_1.default.findById(req.user._id);
        if (user) {
            return res.status(200).json({ cartItems: user.cart });
        }
        else {
            return res.status(404).json({ error: 'User not found' });
        }
    }
    catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.fetchCartUser = fetchCartUser;
const deleteCartItemUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await user_model_1.default.findById(req.user._id);
        if (!id) {
            return res.status(404).json({ message: 'Course not found' });
        }
        if (user) {
            user.cart = user.cart.filter((item) => item.courseId.toString() !== id);
            await user.save();
            await redis_1.redis.set(req.user._id, JSON.stringify(user));
            return res.status(200).json({ message: 'Cart item deleted successfully', cartItems: user.cart });
        }
        else {
            return res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteCartItemUser = deleteCartItemUser;
const clearCartItemsUser = async (req, res) => {
    try {
        const user = await user_model_1.default.findById(req.user._id);
        if (user) {
            // Clear all items in the user's cart
            user.cart = [];
            await user.save();
            await redis_1.redis.set(req.user._id, JSON.stringify(user));
            console.log("1");
            return res.status(200).json({ message: 'Cart items cleared successfully', cartItems: user.cart });
        }
        else {
            console.log("2");
            return res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        console.log("3");
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.clearCartItemsUser = clearCartItemsUser;
const addToCartGuest = async (req, res) => {
    try {
        const { courseId, name, thumbnail, price, estimatedPrice } = req.body;
        let cartItems = [];
        // Retrieve existing cart items from the cookie
        if (req.cookies.cart_items) {
            cartItems = JSON.parse(req.cookies.cart_items);
        }
        const existingCartItem = cartItems.find((item) => item.courseId === courseId);
        if (existingCartItem) {
            return res.status(400).json({ message: 'The course was already in the cart' });
        }
        const newCartItem = {
            courseId: courseId,
            name: name,
            thumbnail: thumbnail,
            price: price,
            estimatedPrice: estimatedPrice
        };
        cartItems.push(newCartItem);
        // Save the updated cart items into the cookie
        res.cookie("cart_items", JSON.stringify(cartItems), { /* Add your cookie options here */});
        return res.status(200).json({ message: 'Cart item added successfully to cookie', cartItems: cartItems });
    }
    catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.addToCartGuest = addToCartGuest;
const fetchCartGuest = async (req, res) => {
    try {
        let cartItems = [];
        if (req.cookies.cart_items) {
            cartItems = JSON.parse(req.cookies.cart_items);
        }
        return res.status(200).json({ cartItems: cartItems });
    }
    catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.fetchCartGuest = fetchCartGuest;
const deleteCartItemGuest = async (req, res) => {
    try {
        const { id } = req.params;
        let cartItems = [];
        // Retrieve cart items from the cookie
        if (req.cookies.cart_items) {
            cartItems = JSON.parse(req.cookies.cart_items);
            // Filter out the item to be deleted from the cart
            console.log("DataCart", id);
            cartItems = cartItems.filter((item) => item.courseId.toString() !== id);
            // Update the cookie with the modified cart items
            res.cookie("cart_items", JSON.stringify(cartItems), { /* Add your cookie options here */});
            return res.status(200).json({ message: 'Cart item deleted successfully', cartItems: cartItems });
        }
        else {
            return res.status(404).json({ error: 'Cart is empty' });
        }
    }
    catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteCartItemGuest = deleteCartItemGuest;
