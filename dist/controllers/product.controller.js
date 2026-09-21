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
exports.getRelatedProducts = exports.getFeaturedProducts = exports.deleteProduct = exports.updateProduct = exports.getSingleProduct = exports.getAllProducts = exports.createProduct = void 0;
const catchAsyncErrors_1 = require("../middlewares/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const product_model_1 = __importDefault(require("../models/product.model"));
const cloudinary_1 = __importDefault(require("cloudinary"));
// Slug generator helper
const slugify = (text) => text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
// Create Product (Admin only)
exports.createProduct = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, sku, description, shortDescription, category, subCategory, brand, price, discountPrice, images, variants, stockQuantity, stock, lowStockThreshold, tags, specifications, isFeatured, isPublished, } = req.body;
        const effectiveStock = stockQuantity !== undefined ? stockQuantity : stock;
        if (!title || !price || !category) {
            return next(new ErrorHandler_1.default("Title, price, and category are required", 400));
        }
        // Generate unique slug
        let slug = slugify(title);
        const existingSlug = yield product_model_1.default.findOne({ slug });
        if (existingSlug) {
            slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }
        // Generate or validate SKU
        const productSku = sku ? sku.toUpperCase().trim() : `SKU-${Date.now()}`;
        const existingSku = yield product_model_1.default.findOne({ sku: productSku });
        if (existingSku) {
            return next(new ErrorHandler_1.default("Product SKU already exists", 400));
        }
        // Upload product gallery images
        const uploadedImages = [];
        if (images && Array.isArray(images)) {
            for (const img of images) {
                if (typeof img === "string") {
                    const myCloud = yield cloudinary_1.default.v2.uploader.upload(img, {
                        folder: "ecommerce/products",
                    });
                    uploadedImages.push({
                        public_id: myCloud.public_id,
                        url: myCloud.secure_url,
                    });
                }
                else if (img.public_id && img.url) {
                    uploadedImages.push(img);
                }
            }
        }
        const product = yield product_model_1.default.create({
            title,
            slug,
            sku: productSku,
            description,
            shortDescription,
            category,
            subCategory: subCategory || null,
            brand: brand || null,
            price: Number(price),
            discountPrice: discountPrice ? Number(discountPrice) : undefined,
            images: uploadedImages,
            variants: variants || [],
            stockQuantity: Number(effectiveStock) || 0,
            lowStockThreshold: lowStockThreshold ? Number(lowStockThreshold) : 5,
            inStock: (Number(effectiveStock) || 0) > 0,
            tags: tags || [],
            specifications: specifications || [],
            isFeatured: isFeatured || false,
            isPublished: isPublished !== undefined ? isPublished : true,
        });
        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Get All Products with Search, Multi-Filter, Sorting & Pagination (Public)
exports.getAllProducts = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, category, brand, minPrice, maxPrice, inStock, rating, sort, page = 1, limit = 12, } = req.query;
        const query = { isPublished: true };
        // Keyword search
        if (search) {
            query.$or = [
                { title: { $regex: String(search), $options: "i" } },
                { description: { $regex: String(search), $options: "i" } },
                { tags: { $in: [new RegExp(String(search), "i")] } },
            ];
        }
        // Filter by Category
        if (category) {
            query.category = category;
        }
        // Filter by Brand
        if (brand) {
            query.brand = brand;
        }
        // Filter by Stock
        if (inStock !== undefined) {
            query.inStock = inStock === "true";
        }
        // Filter by Minimum Rating
        if (rating) {
            query.ratings = { $gte: Number(rating) };
        }
        // Filter by Price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice)
                query.price.$gte = Number(minPrice);
            if (maxPrice)
                query.price.$lte = Number(maxPrice);
        }
        // Sorting
        let sortCriteria = { createdAt: -1 };
        if (sort === "price-asc")
            sortCriteria = { price: 1 };
        else if (sort === "price-desc")
            sortCriteria = { price: -1 };
        else if (sort === "rating")
            sortCriteria = { ratings: -1 };
        else if (sort === "oldest")
            sortCriteria = { createdAt: 1 };
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * limitNum;
        const totalProducts = yield product_model_1.default.countDocuments(query);
        const products = yield product_model_1.default.find(query)
            .populate("category", "name slug")
            .populate("brand", "name slug")
            .sort(sortCriteria)
            .skip(skip)
            .limit(limitNum);
        res.status(200).json({
            success: true,
            totalProducts,
            totalPages: Math.ceil(totalProducts / limitNum),
            currentPage: pageNum,
            count: products.length,
            products,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Get Single Product by ID or Slug (Public)
exports.getSingleProduct = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { idOrSlug } = req.params;
        const isObjectId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);
        const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };
        const product = yield product_model_1.default.findOne(query)
            .populate("category", "name slug")
            .populate("subCategory", "name slug")
            .populate("brand", "name slug");
        if (!product) {
            return next(new ErrorHandler_1.default("Product not found", 404));
        }
        res.status(200).json({
            success: true,
            product,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Update Product (Admin only)
exports.updateProduct = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const product = yield product_model_1.default.findById(id);
        if (!product) {
            return next(new ErrorHandler_1.default("Product not found", 404));
        }
        const updates = req.body;
        if (updates.title && updates.title !== product.title) {
            updates.slug = slugify(updates.title);
        }
        if (updates.stock !== undefined && updates.stockQuantity === undefined) {
            updates.stockQuantity = Number(updates.stock);
        }
        if (updates.stockQuantity !== undefined) {
            updates.inStock = Number(updates.stockQuantity) > 0;
        }
        // Handle new images if passed as base64
        if (updates.newImages && Array.isArray(updates.newImages)) {
            for (const img of updates.newImages) {
                if (typeof img === "string") {
                    const myCloud = yield cloudinary_1.default.v2.uploader.upload(img, {
                        folder: "ecommerce/products",
                    });
                    product.images.push({
                        public_id: myCloud.public_id,
                        url: myCloud.secure_url,
                    });
                }
            }
        }
        const updatedProduct = yield product_model_1.default.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });
        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: updatedProduct,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Delete Product (Admin only)
exports.deleteProduct = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const product = yield product_model_1.default.findById(id);
        if (!product) {
            return next(new ErrorHandler_1.default("Product not found", 404));
        }
        // Delete images from Cloudinary
        if (product.images && product.images.length > 0) {
            for (const img of product.images) {
                if (img.public_id) {
                    yield cloudinary_1.default.v2.uploader.destroy(img.public_id);
                }
            }
        }
        yield product.deleteOne();
        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Get Featured Products
exports.getFeaturedProducts = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield product_model_1.default.find({ isFeatured: true, isPublished: true })
            .populate("category", "name slug")
            .limit(8);
        res.status(200).json({
            success: true,
            products,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Get Related Products
exports.getRelatedProducts = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const product = yield product_model_1.default.findById(id);
        if (!product) {
            return next(new ErrorHandler_1.default("Product not found", 404));
        }
        const related = yield product_model_1.default.find({
            _id: { $ne: product._id },
            category: product.category,
            isPublished: true,
        }).limit(6);
        res.status(200).json({
            success: true,
            products: related,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//# sourceMappingURL=product.controller.js.map