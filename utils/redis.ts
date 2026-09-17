import { Redis } from "ioredis";
import { CONFIG } from "../config";

class MemoryCache {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: string, ..._args: any[]): Promise<string> {
    this.store.set(key, value);
    return "OK";
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }
}

const createRedisClient = (): any => {
  if (CONFIG.REDIS_URL) {
    try {
      const client = new Redis(CONFIG.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });

      client.on("connect", () => {
        console.log("Redis connected successfully");
      });

      client.on("error", (err: any) => {
        console.warn("Redis connection issue (falling back to memory):", err?.message || err);
      });

      return client;
    } catch (err) {
      console.warn("Could not initialize Redis client, using in-memory fallback:", err);
      return new MemoryCache();
    }
  }

  console.log("REDIS_URL not configured. Using in-memory cache fallback.");
  return new MemoryCache();
};

export const redis = createRedisClient();

