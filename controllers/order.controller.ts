import { NextFunction, Request, Response } from "express";
import { CatchAsyncErrors } from "../middlewares/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import OrderModel, { IOrder } from "../models/orderModel";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notificationModel";
import { getAllOrderService, newOrder } from "../services/order.service";

//create Order
export const createOrder = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    try {
      const { courseId, payment_info } = req.body as IOrder;
      const user = await userModel.findById(req.user?._id);
      const courseExistsUser = user?.courses?.some(
        (course: any) =>
          course?.courseId?.toString() === courseId ||
          course?._id?.toString() === courseId ||
          course?.toString() === courseId
      );
      if (courseExistsUser) {
        return next(
          new ErrorHandler("You have already purchased this course", 403)
        );
      }
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const data: any = {
        courseId: course._id,
        userId: user?._id,
        userName: user?.name,
        payment_info,
      };

      const mailData = {
        order: {
          _id: course?._id,
          name: course.name,
          price: course.price,
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      };
      // Order confirmation email is best-effort: never block the purchase
      // when SMTP is unreachable. sendMail resolves templates from
      // dist/mails (copied at build) with a cwd fallback.
      try {
        if (user) {
          await sendMail({
            email: user?.email,
            subject: "Order Confirmation",
            template: "order-confirmation.ejs",
            data: mailData,
          });
        }
      } catch (error: any) {
        console.warn("Order confirmation email skipped:", error?.message || error);
      }

      user?.courses.push(course?._id as any);
      await user?.save();
      await NotificationModel.create({
        user: user?._id,
        title: "New Order",
        message: `You have successfully purchased the course ${course?.name}`,
      });
      // Canonical LMS enrollment: Order (verified) -> Enrollment -> Course access
      try {
        const { default: EnrollmentModel } = await import(
          "../models/enrollment.model"
        );
        await EnrollmentModel.findOneAndUpdate(
          { userId: user?._id?.toString(), courseId: course?._id?.toString() },
          {
            $setOnInsert: {
              userId: user?._id?.toString(),
              courseId: course?._id?.toString(),
              progress: 0,
            },
          },
          { upsert: true, new: true }
        );
      } catch {
        // Enrollment sync is best-effort; order itself already succeeded
      }
      if (!course?.purchased) course.purchased = 0;
      // Increment the purchased count for the course
      course.purchased += 1;

      await course.save();

      newOrder(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get All orders only for admin
export const getAllOrderDashboard = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllOrderService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
