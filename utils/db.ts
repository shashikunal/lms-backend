import mongoose from "mongoose";
import { CONFIG } from "../config";

let isConnected = false;

const connectDb = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }
  if (!CONFIG.DB_URI) {
    console.warn("DB_URI is not defined in environment variables. MongoDB connection skipped.");
    return;
  }
  try {
    const conn = await mongoose.connect(CONFIG.DB_URI as string);
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

export default connectDb;
