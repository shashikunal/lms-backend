import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: {
    public_id: string;
    url: string;
  };
  parentCategory?: mongoose.Types.ObjectId;
  isActive: boolean;
  displayOrder: number;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
    },
    image: {
      public_id: String,
      url: String,
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "EcommerceCategory",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

categorySchema.index({ slug: 1 });
categorySchema.index({ parentCategory: 1 });

const CategoryModel: Model<ICategory> = mongoose.model<ICategory>(
  "EcommerceCategory",
  categorySchema
);

export default CategoryModel;
