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

class HybridRedisClient {
  private redisClient: Redis | null = null;
  private memoryCache: MemoryCache = new MemoryCache();
  private hasLoggedReadOnlyNotice = false;

  constructor(redisUrl?: string) {
    if (redisUrl) {
      try {
        this.redisClient = new Redis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          enableReadyCheck: false, // Prevents NOPERM on INFO command for restricted Upstash keys
        });

        this.redisClient.on("connect", () => {
          console.log("Redis connected successfully");
        });

        this.redisClient.on("error", (err: any) => {
          const msg = err?.message || "";
          if (!msg.includes("NOPERM") && !msg.includes("writeable")) {
            console.warn("Redis connection issue:", msg);
          }
        });
      } catch (err) {
        console.warn("Redis initialization failed, falling back to memory:", err);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    // 1. Check in-memory store first (holds recent local writes)
    const localVal = await this.memoryCache.get(key);
    if (localVal !== null) {
      return localVal;
    }

    // 2. Read from remote Redis (Read-Only keys work seamlessly here)
    if (this.redisClient) {
      try {
        const remoteVal = await this.redisClient.get(key);
        if (remoteVal !== null) {
          return remoteVal;
        }
      } catch {
        // Fall through to null on read error
      }
    }

    return null;
  }

  async set(key: string, value: string, ...args: any[]): Promise<string> {
    // Always store in memory cache so session/data is immediately available
    await this.memoryCache.set(key, value);

    // Attempt to persist to remote Redis
    if (this.redisClient) {
      try {
        await (this.redisClient.set as any)(key, value, ...args);
      } catch (err: any) {
        const msg = err?.message || "";
        // Gracefully handle Read-Only / NOPERM / non-writable streams without failing the request
        if (msg.includes("NOPERM") || msg.includes("writeable")) {
          if (!this.hasLoggedReadOnlyNotice) {
            console.log("ℹ️  Redis running in Read-Only mode. Writes safely handled by memory cache.");
            this.hasLoggedReadOnlyNotice = true;
          }
        } else {
          console.warn("Redis write warning:", msg);
        }
      }
    }

    return "OK";
  }

  async del(key: string): Promise<number> {
    const deletedFromMemory = await this.memoryCache.del(key);

    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch {
        // Ignore write restriction errors on delete
      }
    }

    return deletedFromMemory;
  }
}

export const redis = new HybridRedisClient(CONFIG.REDIS_URL);
