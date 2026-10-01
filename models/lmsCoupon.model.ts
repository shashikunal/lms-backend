import mongoose, { Document, Model, Schema } from "mongoose";

export interface ILmsCoupon extends Document {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscount?: number;
  minPurchaseAmount: number;
  courseId?: string;
  usageLimit?: number;
  usedCount: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

const lmsCouponSchema = new Schema<ILmsCoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: { type: Number, required: true },
    maxDiscount: { type: Number },
    minPurchaseAmount: { type: Number, default: 0 },
    courseId: { type: String },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const LmsCouponModel: Model<ILmsCoupon> = mongoose.model<ILmsCoupon>(
  "LmsCoupon",
  lmsCouponSchema
);
export default LmsCouponModel;
