import mongoose from "mongoose";
import { CONFIG } from "../config";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

const connectDb = async () => {
  if (cached.conn && mongoose.connection.readyState >= 1) {
    return cached.conn;
  }

  const dbUri = CONFIG.DB_URI || process.env.DB_URI;
  if (!dbUri) {
    const msg = "DB_URI is not defined in environment variables.";
    console.warn(msg);
    throw new Error(msg);
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(dbUri, opts).then((m) => {
      console.log(`MongoDB Connected: ${m.connection.host}`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null; // Reset on failure so subsequent requests can retry
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

export default connectDb;

