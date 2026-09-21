import mongoose, { Document, Model, Schema } from "mongoose";

export interface IProductReview extends Document {
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  images: Array<{ public_id: string; url: string }>;
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
}

const productReviewSchema = new Schema<IProductReview>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "EcommerceProduct",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userAvatar: {
      type: String,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    title: {
      type: String,
      trim: true,
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
    },
    images: [
      {
        public_id: String,
        url: String,
      },
    ],
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// One review per user per product
productReviewSchema.index({ product: 1, user: 1 }, { unique: true });
productReviewSchema.index({ product: 1, createdAt: -1 });

const ProductReviewModel: Model<IProductReview> = mongoose.model<IProductReview>(
  "EcommerceProductReview",
  productReviewSchema
);

export default ProductReviewModel;
