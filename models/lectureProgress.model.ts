import mongoose, { Document, Model, Schema } from "mongoose";

export interface ILectureProgress extends Document {
  userId: string;
  courseId: string;
  lectureId: string;
  watchedSeconds: number;
  completed: boolean;
  lastAccessedAt: Date;
}

const lectureProgressSchema = new Schema<ILectureProgress>(
  {
    userId: { type: String, required: true, index: true },
    courseId: { type: String, required: true, index: true },
    lectureId: { type: String, required: true },
    watchedSeconds: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    lastAccessedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

lectureProgressSchema.index(
  { userId: 1, courseId: 1, lectureId: 1 },
  { unique: true }
);

const LectureProgressModel: Model<ILectureProgress> =
  mongoose.model<ILectureProgress>(
    "LectureProgress",
    lectureProgressSchema
  );
export default LectureProgressModel;
