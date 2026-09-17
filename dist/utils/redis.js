"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = require("ioredis");
const config_1 = require("../config");
class MemoryCache {
    constructor() {
        this.store = new Map();
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.store.get(key) || null;
        });
    }
    set(key, value, ..._args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.store.set(key, value);
            return "OK";
        });
    }
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.store.delete(key) ? 1 : 0;
        });
    }
}
const createRedisClient = () => {
    if (config_1.CONFIG.REDIS_URL) {
        try {
            const client = new ioredis_1.Redis(config_1.CONFIG.REDIS_URL, {
                lazyConnect: true,
                maxRetriesPerRequest: 1,
                enableOfflineQueue: false,
            });
            client.on("connect", () => {
                console.log("Redis connected successfully");
            });
            client.on("error", (err) => {
                console.warn("Redis connection issue (falling back to memory):", (err === null || err === void 0 ? void 0 : err.message) || err);
            });
            return client;
        }
        catch (err) {
            console.warn("Could not initialize Redis client, using in-memory fallback:", err);
            return new MemoryCache();
        }
    }
    console.log("REDIS_URL not configured. Using in-memory cache fallback.");
    return new MemoryCache();
};
exports.redis = createRedisClient();
//# sourceMappingURL=redis.js.map