import { app } from "../app";
import connectDb from "../utils/db";
import { CONFIG } from "../config";
import { v2 as cloudinary } from "cloudinary";

if (CONFIG.CLOUD_NAME && CONFIG.CLOUDINARY_API && CONFIG.CLOUDINARY_SECRET) {
  cloudinary.config({
    cloud_name: CONFIG.CLOUD_NAME,
    api_key: CONFIG.CLOUDINARY_API,
    api_secret: CONFIG.CLOUDINARY_SECRET,
  });
}

// Warm up database connection on serverless cold starts
connectDb().catch((err) => {
  console.warn("MongoDB connection warning in serverless environment:", err?.message || err);
});

export default app;
