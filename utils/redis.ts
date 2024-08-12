import { Redis } from "ioredis";
import { CONFIG } from "../config";

const redisClient = () => {
  if (CONFIG.REDIS_URL) {
    console.log("redis connected");
    return CONFIG.REDIS_URL;
  }
  throw new Error("Redis url not found");
};

export const redis = new Redis(redisClient());

