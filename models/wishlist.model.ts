import mongoose, { Document, Model, Schema } from "mongoose";

export interface IWishlistItem {
  product: mongoose.Types.ObjectId;
  addedAt: Date;
}

export interface IWishlist extends Document {
  userId: mongoose.Types.ObjectId;
  products: IWishlistItem[];
}

const wishlistItemSchema = new Schema<IWishlistItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: "EcommerceProduct",
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    products: [wishlistItemSchema],
  },
  { timestamps: true }
);

const WishlistModel: Model<IWishlist> = mongoose.model<IWishlist>(
  "EcommerceWishlist",
  wishlistSchema
);

export default WishlistModel;
