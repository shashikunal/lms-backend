import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  variantSku?: string;
  quantity: number;
  price: number;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  appliedCoupon?: string;
  couponDiscount: number;
}

const cartItemSchema = new Schema<ICartItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: "EcommerceProduct",
    required: true,
  },
  variantSku: {
    type: String,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity cannot be less than 1"],
    default: 1,
  },
  price: {
    type: Number,
    required: true,
    min: [0, "Price cannot be negative"],
  },
});

const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    appliedCoupon: {
      type: String,
    },
    couponDiscount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const CartModel: Model<ICart> = mongoose.model<ICart>("EcommerceCart", cartSchema);

export default CartModel;
