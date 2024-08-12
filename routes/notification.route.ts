import express from "express";

import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import {
  getNotifications,
  updateNotificationStatus,
} from "../controllers/notification.controller";

const notificationRouter = express.Router();

notificationRouter.get(
  "/get-all-notification",
  isAuthenticated,
  authorizeRoles("admin"),
  getNotifications
);
notificationRouter.put(
  "/update-notification-status/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  updateNotificationStatus
);

export default notificationRouter;
