import { CatchAsyncErrors } from "../middlewares/catchAsyncErrors";
import LayoutModel from "../models/layout.model";
import ErrorHandler from "../utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import cloudinary from "cloudinary";
import { title } from "process";

//create Layout
export const createLayout = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      const isTypeExist = await LayoutModel.findOne({ type });
      if (isTypeExist) {
        return next(new ErrorHandler(`${type} already exist`, 400));
      }
      if (type === "banner") {
        const { image, title, subTitle } = req.body;
        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: "layout",
        });
        const banner = {
          image: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          },
          title,
          subTitle,
        };

        const layout = await LayoutModel.create({
          banner,
        });
        res.status(201).json({
          success: true,
          layout,
        });
      }
      //FAQ
      if (type === "faq") {
        const { faq } = req.body;
        const faqItems = await Promise.all(
          faq.map(async (item: any) => ({
            question: item.question,
            answer: item.answer,
          }))
        );
        await LayoutModel.create({
          type: "faq",
          faq: faqItems,
        });
      }

      if (type === "categories") {
        const { categories } = req.body;
        const CategoryItems = await Promise.all(
          categories.map(async (item: any) => ({
            title: item.title,
          }))
        );
        await LayoutModel.create({
          type: "categories",
          categories: CategoryItems,
        });
      }
      res.status(200).json({
        success: true,
        message: "Layout created successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error, 500));
    }
  }
);

//edit layout
export const editLayout = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      const isTypeExist = await LayoutModel.findOne({ type });
      if (!isTypeExist) {
        return next(new ErrorHandler(`${type} does not exist`, 400));
      }
      if (type === "banner") {
        const bannerData: any = await LayoutModel.findOne({ type: "banner" });
        const { image, title, subTitle } = req.body;
        if (bannerData) {
          await cloudinary.v2.uploader.destroy(bannerData.image.public_id);
        }
        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: "layout",
        });
        const banner = {
          image: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          },
          title,
          subTitle,
        };

        const layout = await LayoutModel.findByIdAndUpdate(
          bannerData?._id,
          {
            banner,
          },
          { new: true }
        );
        res.status(201).json({
          success: true,
          layout,
        });
      }
      //FAQ
      if (type === "faq") {
        const { faq } = req.body;
        const faqItem = await LayoutModel.findOne({ type: "faq" });
        const faqItems = await Promise.all(
          faq.map(async (item: any) => ({
            question: item.question,
            answer: item.answer,
          }))
        );
        await LayoutModel.findByIdAndUpdate(
          faqItem?._id,
          { type: "faq", faq: faqItems },
          { new: true }
        );
      }

      if (type === "categories") {
        const { categories } = req.body;
        const categoriesItem = await LayoutModel.findOne({
          type: "categories",
        });
        const CategoryItems = await Promise.all(
          categories.map(async (item: any) => ({
            title: item.title,
          }))
        );
        await LayoutModel.findByIdAndUpdate(
          categoriesItem?._id,
          { type: "categories", categories: CategoryItems },

          { new: true }
        );
      }
      res.status(200).json({
        success: true,
        message: "Layout updated successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error, 500));
    }
  }
);

//get layout by Type
export const getLayoutByType = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      const layout = await LayoutModel.findOne({ type });

      if (!layout) {
        return next(new ErrorHandler(`${type} does not exist`, 400));
      }
      res.status(200).json({
        success: true,
        layout,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error, 500));
    }
  }
);
