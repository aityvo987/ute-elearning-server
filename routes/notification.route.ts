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
    authorizeRoles("admin"),
    getNotifications
);

notificationRouter.put(
    "/update-notifications/:id", // with id is notification id
    
    isAutheticated,
    authorizeRoles("admin"),
    updateNotificationStatus
);

export default notificationRouter;