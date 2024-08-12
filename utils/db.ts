import mongoose from "mongoose";
import { CONFIG } from "../config";

const connectDb = async () => {
  try {
    const conn = await mongoose.connect(CONFIG.DB_URI as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
export default connectDb;
