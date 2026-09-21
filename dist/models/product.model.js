"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const variantSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    attributes: { type: Map, of: String },
});
const specificationSchema = new mongoose_1.Schema({
    key: { type: String, required: true },
    value: { type: String, required: true },
});
const productSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, "Product title is required"],
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    sku: {
        type: String,
        required: [true, "SKU is required"],
        unique: true,
        uppercase: true,
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Product description is required"],
    },
    shortDescription: {
        type: String,
    },
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "EcommerceCategory",
        required: [true, "Product category is required"],
    },
    subCategory: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "EcommerceCategory",
    },
    brand: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "EcommerceBrand",
    },
    price: {
        type: Number,
        required: [true, "Product price is required"],
        min: [0, "Price cannot be negative"],
    },
    discountPrice: {
        type: Number,
        min: [0, "Discount price cannot be negative"],
    },
    images: [
        {
            public_id: { type: String, required: true },
            url: { type: String, required: true },
        },
    ],
    variants: [variantSchema],
    stockQuantity: {
        type: Number,
        required: [true, "Stock quantity is required"],
        default: 0,
        min: [0, "Stock cannot be negative"],
    },
    lowStockThreshold: {
        type: Number,
        default: 5,
    },
    inStock: {
        type: Boolean,
        default: true,
    },
    ratings: {
        type: Number,
        default: 0,
    },
    numOfReviews: {
        type: Number,
        default: 0,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    isPublished: {
        type: Boolean,
        default: true,
    },
    tags: [
        {
            type: String,
        },
    ],
    specifications: [specificationSchema],
}, { timestamps: true });
// Indexes for fast searching, filtering and sorting
productSchema.index({ title: "text", description: "text", tags: "text" });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ isPublished: 1, isFeatured: 1 });
productSchema.index({ createdAt: -1 });
// Automatic inStock sync before save
productSchema.pre("save", function (next) {
    this.inStock = this.stockQuantity > 0;
    next();
});
const ProductModel = mongoose_1.default.model("EcommerceProduct", productSchema);
exports.default = ProductModel;
//# sourceMappingURL=product.model.js.map