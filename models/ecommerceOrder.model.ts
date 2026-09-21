import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  variantSku?: string;
}

export interface IShippingDetails {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IEcommercePaymentInfo {
  id?: string;
  orderId?: string;
  signature?: string;
  method: "razorpay" | "cod" | "wallet";
  status: "pending" | "paid" | "failed" | "refunded";
  paidAt?: Date;
}

export interface IEcommerceOrder extends Document {
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingDetails;
  paymentInfo: IEcommercePaymentInfo;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  discountPrice: number;
  totalPrice: number;
  orderStatus:
    | "Processing"
    | "Confirmed"
    | "Shipped"
    | "OutForDelivery"
    | "Delivered"
    | "Cancelled"
    | "Returned";
  trackingNumber?: string;
  courierPartner?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

const orderItemSchema = new Schema<IOrderItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: "EcommerceProduct",
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  variantSku: { type: String },
});

const shippingDetailsSchema = new Schema<IShippingDetails>({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  landmark: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: "India" },
});

const ecommerceOrderSchema = new Schema<IEcommerceOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: shippingDetailsSchema,
    paymentInfo: {
      id: String,
      orderId: String,
      signature: String,
      method: {
        type: String,
        enum: ["razorpay", "cod", "wallet"],
        default: "razorpay",
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      paidAt: Date,
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    discountPrice: {
      type: Number,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    orderStatus: {
      type: String,
      enum: [
        "Processing",
        "Confirmed",
        "Shipped",
        "OutForDelivery",
        "Delivered",
        "Cancelled",
        "Returned",
      ],
      default: "Processing",
    },
    trackingNumber: String,
    courierPartner: String,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
  },
  { timestamps: true }
);

ecommerceOrderSchema.index({ userId: 1, createdAt: -1 });
ecommerceOrderSchema.index({ orderNumber: 1 });
ecommerceOrderSchema.index({ orderStatus: 1 });

const EcommerceOrderModel: Model<IEcommerceOrder> = mongoose.model<IEcommerceOrder>(
  "EcommerceOrder",
  ecommerceOrderSchema
);

export default EcommerceOrderModel;
