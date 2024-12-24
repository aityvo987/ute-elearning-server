import { Request, Response, NextFunction } from "express";
import NotificationModel from "../models/notification.model";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cron from "node-cron"

// Admin role

//get all notifications
export const getNotifications = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("Checking notification");
        const user = req.user;
        const notifications = await NotificationModel.find({ userId: user._id }).sort({ createdAt: -1 });
        console.log("Checking notification",notifications);
        res.status(201).json({
            success: true,
            notifications,
        });


    } catch (err: any) {
        console.log("Notification error");
        return next(new ErrorHandler(err.message, 500));
    }
});

//update notification status
export const updateNotificationStatus = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("Updating notification")
        const notification = await NotificationModel.findById(req.params.id);

        if (!notification) {
            return next(new ErrorHandler("Notification not found", 404));
        } else {
            notification.status ? (notification.status = "read") : notification?.status;
        }

        await notification.save();

        //fetch updated notification status
        const notifications = await NotificationModel.find().sort({ createdAt: -1 });

        res.status(201).json({
            success: true,
            notifications,
        });

    } catch (err: any) {
        console.log("Error notification",err.message)
        return next(new ErrorHandler(err.message, 500));
    }
});

//delete notifications automatically - 30 days after read status's notifications

//Test cron
// cron.schedule("*/5 * * * * *", function () {
//     console.log("----------");
//     console.log('running cron...');
// })

cron.schedule("0 0 0 * * *", //0 0 0 * * * ==> midnight every days
    async () => {

        //set 1days variable
        const thirtyDaysAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        //automatically delete notifications

        await NotificationModel.deleteMany({
            createdAt: { $lt: thirtyDaysAgo }, // less than 30 days
            status: "read"
        });

    });