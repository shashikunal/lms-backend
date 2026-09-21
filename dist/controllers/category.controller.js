"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBrands = exports.createBrand = exports.deleteCategory = exports.updateCategory = exports.getSingleCategory = exports.getAllCategories = exports.createCategory = void 0;
const catchAsyncErrors_1 = require("../middlewares/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const category_model_1 = __importDefault(require("../models/category.model"));
const brand_model_1 = __importDefault(require("../models/brand.model"));
const cloudinary_1 = __importDefault(require("cloudinary"));
// Helper to slugify names
const slugify = (text) => text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
// Create Category (Admin only)
exports.createCategory = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, image, parentCategory, displayOrder } = req.body;
        if (!name) {
            return next(new ErrorHandler_1.default("Category name is required", 400));
        }
        const slug = slugify(name);
        const existing = yield category_model_1.default.findOne({ slug });
        if (existing) {
            return next(new ErrorHandler_1.default("Category with this name already exists", 400));
        }
        let uploadedImage = undefined;
        if (image && typeof image === "string") {
            const myCloud = yield cloudinary_1.default.v2.uploader.upload(image, {
                folder: "ecommerce/categories",
            });
            uploadedImage = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        const category = yield category_model_1.default.create({
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
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Get All Categories (Public)
exports.getAllCategories = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield category_model_1.default.find({ isActive: true })
            .populate("parentCategory", "name slug")
            .sort({ displayOrder: 1, createdAt: -1 });
        res.status(200).json({
            success: true,
            count: categories.length,
            categories,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Get Single Category by ID or Slug
exports.getSingleCategory = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { idOrSlug } = req.params;
        const isObjectId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);
        const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };
        const category = yield category_model_1.default.findOne(query).populate("parentCategory", "name slug");
        if (!category) {
            return next(new ErrorHandler_1.default("Category not found", 404));
        }
        res.status(200).json({
            success: true,
            category,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Update Category (Admin only)
exports.updateCategory = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const category = yield category_model_1.default.findById(id);
        if (!category) {
            return next(new ErrorHandler_1.default("Category not found", 404));
        }
        const { name, description, image, parentCategory, isActive, displayOrder } = req.body;
        if (name && name !== category.name) {
            category.name = name;
            category.slug = slugify(name);
        }
        if (description !== undefined)
            category.description = description;
        if (parentCategory !== undefined)
            category.parentCategory = parentCategory;
        if (isActive !== undefined)
            category.isActive = isActive;
        if (displayOrder !== undefined)
            category.displayOrder = displayOrder;
        if (image && typeof image === "string") {
            if ((_a = category.image) === null || _a === void 0 ? void 0 : _a.public_id) {
                yield cloudinary_1.default.v2.uploader.destroy(category.image.public_id);
            }
            const myCloud = yield cloudinary_1.default.v2.uploader.upload(image, {
                folder: "ecommerce/categories",
            });
            category.image = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        yield category.save();
        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Delete Category (Admin only)
exports.deleteCategory = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { id } = req.params;
        const category = yield category_model_1.default.findById(id);
        if (!category) {
            return next(new ErrorHandler_1.default("Category not found", 404));
        }
        if ((_b = category.image) === null || _b === void 0 ? void 0 : _b.public_id) {
            yield cloudinary_1.default.v2.uploader.destroy(category.image.public_id);
        }
        yield category.deleteOne();
        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Brand Management
exports.createBrand = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, logo, website } = req.body;
        if (!name) {
            return next(new ErrorHandler_1.default("Brand name is required", 400));
        }
        const slug = slugify(name);
        const existing = yield brand_model_1.default.findOne({ slug });
        if (existing) {
            return next(new ErrorHandler_1.default("Brand already exists", 400));
        }
        let brandLogo = undefined;
        if (logo && typeof logo === "string") {
            const myCloud = yield cloudinary_1.default.v2.uploader.upload(logo, {
                folder: "ecommerce/brands",
            });
            brandLogo = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        const brand = yield brand_model_1.default.create({
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
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.getAllBrands = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const brands = yield brand_model_1.default.find({ isActive: true }).sort({ name: 1 });
        res.status(200).json({
            success: true,
            count: brands.length,
            brands,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//# sourceMappingURL=category.controller.js.map