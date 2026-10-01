import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICourseWishlist extends Document {
  userId: string;
  courses: { courseId: string; addedAt: Date }[];
}

const courseWishlistSchema = new Schema<ICourseWishlist>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    courses: {
      type: [{ courseId: String, addedAt: { type: Date, default: Date.now } }],
      default: [],
    },
  },
  { timestamps: true }
);

const CourseWishlistModel: Model<ICourseWishlist> =
  mongoose.model<ICourseWishlist>("CourseWishlist", courseWishlistSchema);
export default CourseWishlistModel;
