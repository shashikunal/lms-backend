import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICart extends Document {
  userId: string;
  courses: Array<{ courseId: string; addedAt: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

const cartSchema = new Schema<ICart>(
  {
    userId: { type: String, required: true, index: true },
    courses: [
      {
        courseId: { type: String, required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

cartSchema.index({ userId: 1 }, { unique: true });

const CartModel: Model<ICart> = mongoose.model("Cart", cartSchema);
export default CartModel;
