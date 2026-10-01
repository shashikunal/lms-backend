import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICertificate extends Document {
  userId: string;
  courseId: string;
  enrollmentId: string;
  certificateId: string;
  userName: string;
  courseName: string;
  issuedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    userId: { type: String, required: true, index: true },
    courseId: { type: String, required: true },
    enrollmentId: { type: String, required: true },
    certificateId: { type: String, required: true, unique: true },
    userName: { type: String, required: true },
    courseName: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const CertificateModel: Model<ICertificate> =
  mongoose.model<ICertificate>("Certificate", certificateSchema);
export default CertificateModel;
