import { CatchAsyncErrors } from "../middlewares/catchAsyncErrors";
import NotificationModel from "../models/notificationModel";
import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import cron from "node-cron";
//get all notification ==? only admin
export const getNotifications = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    try {
      const notifications = await NotificationModel.find().sort({
        createdAt: -1,
      });
      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error, 500));
    }
  }
);

//update notification status
export const updateNotificationStatus = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    try {
      const notification = await NotificationModel.findById(req.params.id);
      if (!notification) {
        return next(new ErrorHandler("Notification not found", 404));
      }
      notification.status = "read";
      await notification.save();
      const notifications = await NotificationModel.find().sort({
        createdAt: -1,
      });
      res.status(200).json({
        success: true,
        notifications,
        message: "Notification status updated successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error, 500));
    }
  }
);

//delete notification ==> admin
cron.schedule("0 0 0 * * *", async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await NotificationModel.deleteMany({
      status: "read",
      createdAt: { $lt: thirtyDaysAgo },
    });
    console.log("deleted read notifications");
  } catch (error: any) {
    console.log(error);
  }
});
