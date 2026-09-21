import { Request, Response, NextFunction } from "express";
import { CatchAsyncErrors } from "../middlewares/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import CategoryModel from "../models/category.model";
import BrandModel from "../models/brand.model";
import cloudinary from "cloudinary";

// Helper to slugify names
const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");

// Create Category (Admin only)
export const createCategory = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description, image, parentCategory, displayOrder } = req.body;

      if (!name) {
        return next(new ErrorHandler("Category name is required", 400));
      }

      const slug = slugify(name);
      const existing = await CategoryModel.findOne({ slug });
      if (existing) {
        return next(new ErrorHandler("Category with this name already exists", 400));
      }

      let uploadedImage = undefined;
      if (image && typeof image === "string") {
        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: "ecommerce/categories",
        });
        uploadedImage = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      const category = await CategoryModel.create({
        name,
        slug,
        description,
        image: uploadedImage,
        parentCategory: parentCategory || null,
        displayOrder: displayOrder || 0,
      });

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        category,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get All Categories (Public)
export const getAllCategories = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await CategoryModel.find({ isActive: true })
        .populate("parentCategory", "name slug")
        .sort({ displayOrder: 1, createdAt: -1 });

      res.status(200).json({
        success: true,
        count: categories.length,
        categories,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get Single Category by ID or Slug
export const getSingleCategory = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idOrSlug } = req.params;
      const isObjectId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);
      const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };

      const category = await CategoryModel.findOne(query).populate(
        "parentCategory",
        "name slug"
      );
      if (!category) {
        return next(new ErrorHandler("Category not found", 404));
      }

      res.status(200).json({
        success: true,
        category,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Update Category (Admin only)
export const updateCategory = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const category = await CategoryModel.findById(id);
      if (!category) {
        return next(new ErrorHandler("Category not found", 404));
      }

      const { name, description, image, parentCategory, isActive, displayOrder } =
        req.body;

      if (name && name !== category.name) {
        category.name = name;
        category.slug = slugify(name);
      }
      if (description !== undefined) category.description = description;
      if (parentCategory !== undefined) category.parentCategory = parentCategory;
      if (isActive !== undefined) category.isActive = isActive;
      if (displayOrder !== undefined) category.displayOrder = displayOrder;

      if (image && typeof image === "string") {
        if (category.image?.public_id) {
          await cloudinary.v2.uploader.destroy(category.image.public_id);
        }
        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: "ecommerce/categories",
        });
        category.image = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      await category.save();

      res.status(200).json({
        success: true,
        message: "Category updated successfully",
        category,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Delete Category (Admin only)
export const deleteCategory = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const category = await CategoryModel.findById(id);
      if (!category) {
        return next(new ErrorHandler("Category not found", 404));
      }

      if (category.image?.public_id) {
        await cloudinary.v2.uploader.destroy(category.image.public_id);
      }

      await category.deleteOne();

      res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Brand Management
export const createBrand = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description, logo, website } = req.body;
      if (!name) {
        return next(new ErrorHandler("Brand name is required", 400));
      }

      const slug = slugify(name);
      const existing = await BrandModel.findOne({ slug });
      if (existing) {
        return next(new ErrorHandler("Brand already exists", 400));
      }

      let brandLogo = undefined;
      if (logo && typeof logo === "string") {
        const myCloud = await cloudinary.v2.uploader.upload(logo, {
          folder: "ecommerce/brands",
        });
        brandLogo = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      const brand = await BrandModel.create({
        name,
        slug,
        description,
        logo: brandLogo,
        website,
      });

      res.status(201).json({
        success: true,
        message: "Brand created successfully",
        brand,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAllBrands = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brands = await BrandModel.find({ isActive: true }).sort({ name: 1 });
      res.status(200).json({
        success: true,
        count: brands.length,
        brands,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
