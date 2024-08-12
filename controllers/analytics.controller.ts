import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncErrors } from "../middlewares/catchAsyncErrors";
import userModel from "../models/user.model";
import { generateLast12MonthsData } from "../utils/analyticts.generator";
import CourseModel from "../models/course.model";
import OrderModel from "../models/orderModel";

//GET USER ANALYTICS ==ONLY FOR ADMIN
export const getUserAnalytics = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await generateLast12MonthsData(userModel);
      res.status(200).json({ success: true, users });
    } catch (error: any) {
      return next(new ErrorHandler(error, 500));
    }
  }
);

//GET COURSE ANALYTICS ==ONLY FOR ADMIN
export const getCourseAnalytics = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await generateLast12MonthsData(CourseModel);
      res.status(200).json({ success: true, courses });
    } catch (error: any) {
      return next(new ErrorHandler(error, 500));
    }
  }
);

//GET ORDER ANALYTICS ==ONLY FOR ADMIN
export const getOrderAnalytics = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const Orders = await generateLast12MonthsData(OrderModel);
      res.status(200).json({ success: true, Orders });
    } catch (error: any) {
      return next(new ErrorHandler(error, 500));
    }
  }
);
