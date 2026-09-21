import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBrand extends Document {
  name: string;
  slug: string;
  description?: string;
  logo?: {
    public_id: string;
    url: string;
  };
  website?: string;
  isActive: boolean;
}

const brandSchema = new Schema<IBrand>(
  {
    name: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
      unique: true,
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
    logo: {
      public_id: String,
      url: String,
    },
    website: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

brandSchema.index({ slug: 1 });

const BrandModel: Model<IBrand> = mongoose.model<IBrand>(
  "EcommerceBrand",
  brandSchema
);

export default BrandModel;
