"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationStatus = exports.getNotifications = void 0;
const notification_model_1 = __importDefault(require("../models/notification.model"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const node_cron_1 = __importDefault(require("node-cron"));
// Admin role
//get all notifications
exports.getNotifications = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const user = req.user;
        const notifications = await notification_model_1.default.find({ userId: user._id }).sort({ createdAt: -1 });
        res.status(201).json({
            success: true,
            notifications,
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
//update notification status
exports.updateNotificationStatus = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const notification = await notification_model_1.default.findById(req.params.id);
        if (!notification) {
            return next(new ErrorHandler_1.default("Notification not found", 404));
        }
        else {
            notification.status ? (notification.status = "read") : notification?.status;
        }
        await notification.save();
        //fetch updated notification status
        const notifications = await notification_model_1.default.find().sort({ createdAt: -1 });
        res.status(201).json({
            success: true,
            notifications,
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
//delete notifications automatically - 30 days after read status's notifications
//Test cron
// cron.schedule("*/5 * * * * *", function () {
//     console.log("----------");
//     console.log('running cron...');
// })
node_cron_1.default.schedule("0 0 0 * * *", //0 0 0 * * * ==> midnight every days
async () => {
    //set 1days variable
    const thirtyDaysAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    //automatically delete notifications
    await notification_model_1.default.deleteMany({
        createdAt: { $lt: thirtyDaysAgo }, // less than 30 days
        status: "read"
    });
});
