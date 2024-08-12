import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./user.model";

interface IComment extends Document {
  user: IUser;
  question: string;
  questionReplies?: IComment[];
}

interface IReview extends Document {
  user: IUser;
  rating: number;
  comment: string;
  commentReplies?: IComment[];
}

interface ILink extends Document {
  title: string;
  url: string;
}

interface ICourseData extends Document {
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: object;
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  links: ILink[];
  suggestion: string;
  questions: IComment[];
}

interface ICourse extends Document {
  name: string;
  description: string;
  price: number;
  estimatedPrice?: number;
  thumbnail: object;
  tags: string;
  level: string;
  demoUrl: string;
  benefits: { title: string }[];
  prerequisites: { title: string }[];
  reviews: IReview[];
  courseData: ICourseData[];
  ratings?: number;
  purchased?: number;
}

const reviewSchema = new Schema<IReview>({
  user: { type: Object },
  rating: { type: Number, default: 0 },
  comment: { type: String },
  commentReplies: [Object],
});
const commentSchema = new Schema<IComment>({
  user: { type: Object },
  question: { type: String },
  questionReplies: { type: [Object] },
});
const linkSchema = new Schema<ILink>({
  title: { type: String },
  url: { type: String },
});
const courseDataSchema = new Schema<ICourseData>({
  title: { type: String },
  description: { type: String },
  videoUrl: { type: String },
  videoSection: { type: String },
  videoLength: { type: Number },
  videoPlayer: { type: String },
  links: { type: [linkSchema] },
  suggestion: { type: String },
  questions: { type: [commentSchema] },
});

const courseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    estimatedPrice: { type: Number },
    thumbnail: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    tags: { type: String, required: true },
    level: { type: String, required: true },
    demoUrl: { type: String, required: true },
    benefits: { type: [{ title: String }] },
    prerequisites: { type: [{ title: String }] },
    reviews: { type: [reviewSchema] },
    courseData: { type: [courseDataSchema] },
    ratings: { type: Number, default: 0 },
    purchased: { type: Number, default: 0 },
  },
  { timestamps: true }
);
const CourseModel: Model<ICourse> = mongoose.model<ICourse>(
  "Course",
  courseSchema
);
export default CourseModel;
