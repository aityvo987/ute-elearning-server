import express from "express";
import {
    getNotifications,
    updateNotificationStatus
} from "../controllers/notification.controller";
import { authorizeRoles, isAutheticated } from "../middleware/auth";
import { updateAccessToken } from "../controllers/user.controller";

const notificationRouter = express.Router();

notificationRouter.get(
    "/get-all-notifications",
    isAutheticated,
    authorizeRoles("admin","lecturer"),
    getNotifications
);

notificationRouter.put(
    "/update-notification/:id",
    isAutheticated,
    authorizeRoles("admin","lecturer"),
    updateNotificationStatus
);

export default notificationRouter;