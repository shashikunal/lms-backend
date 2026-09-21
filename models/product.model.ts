import mongoose, { Document, Model, Schema } from "mongoose";

export interface IVariant {
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Map<string, string>;
}

export interface IProductImage {
  public_id: string;
  url: string;
}

export interface ISpecification {
  key: string;
  value: string;
}

export interface IProduct extends Document {
  title: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription?: string;
  category: mongoose.Types.ObjectId;
  subCategory?: mongoose.Types.ObjectId;
  brand?: mongoose.Types.ObjectId;
  price: number;
  discountPrice?: number;
  images: IProductImage[];
  variants: IVariant[];
  stockQuantity: number;
  lowStockThreshold: number;
  inStock: boolean;
  ratings: number;
  numOfReviews: number;
  isFeatured: boolean;
  isPublished: boolean;
  tags: string[];
  specifications: ISpecification[];
}

const variantSchema = new Schema<IVariant>({
  name: { type: String, required: true },
  sku: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  attributes: { type: Map, of: String },
});

const specificationSchema = new Schema<ISpecification>({
  key: { type: String, required: true },
  value: { type: String, required: true },
});

const productSchema = new Schema<IProduct>(
  {
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
      type: Schema.Types.ObjectId,
      ref: "EcommerceCategory",
      required: [true, "Product category is required"],
    },
    subCategory: {
      type: Schema.Types.ObjectId,
      ref: "EcommerceCategory",
    },
    brand: {
      type: Schema.Types.ObjectId,
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
  },
  { timestamps: true }
);

// Indexes for fast searching, filtering and sorting
productSchema.index({ title: "text", description: "text", tags: "text" });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ isPublished: 1, isFeatured: 1 });
productSchema.index({ createdAt: -1 });

// Automatic inStock sync before save
productSchema.pre<IProduct>("save", function (next) {
  this.inStock = this.stockQuantity > 0;
  next();
});

const ProductModel: Model<IProduct> = mongoose.model<IProduct>(
  "EcommerceProduct",
  productSchema
);

export default ProductModel;
