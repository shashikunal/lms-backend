import mongoose, { Document, Model, Schema } from "mongoose";

export interface IEnrollment extends Document {
  userId: string;
  courseId: string;
  orderId?: string;
  progress: number;
  completedLectureIds: string[];
  completed: boolean;
  completedAt?: Date;
  enrolledAt: Date;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    userId: { type: String, required: true, index: true },
    courseId: { type: String, required: true, index: true },
    orderId: { type: String },
    progress: { type: Number, default: 0 },
    completedLectureIds: { type: [String], default: [] },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    enrolledAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const EnrollmentModel: Model<IEnrollment> = mongoose.model<IEnrollment>(
  "Enrollment",
  enrollmentSchema
);
export default EnrollmentModel;
