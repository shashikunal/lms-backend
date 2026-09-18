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
class HybridRedisClient {
    constructor(redisUrl) {
        this.redisClient = null;
        this.memoryCache = new MemoryCache();
        this.hasLoggedReadOnlyNotice = false;
        if (redisUrl) {
            try {
                this.redisClient = new ioredis_1.Redis(redisUrl, {
                    lazyConnect: true,
                    maxRetriesPerRequest: 1,
                    enableOfflineQueue: false,
                    enableReadyCheck: false, // Prevents NOPERM on INFO command for restricted Upstash keys
                });
                this.redisClient.on("connect", () => {
                    console.log("Redis connected successfully");
                });
                this.redisClient.on("error", (err) => {
                    const msg = (err === null || err === void 0 ? void 0 : err.message) || "";
                    if (!msg.includes("NOPERM") && !msg.includes("writeable")) {
                        console.warn("Redis connection issue:", msg);
                    }
                });
            }
            catch (err) {
                console.warn("Redis initialization failed, falling back to memory:", err);
            }
        }
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Check in-memory store first (holds recent local writes)
            const localVal = yield this.memoryCache.get(key);
            if (localVal !== null) {
                return localVal;
            }
            // 2. Read from remote Redis (Read-Only keys work seamlessly here)
            if (this.redisClient) {
                try {
                    const remoteVal = yield this.redisClient.get(key);
                    if (remoteVal !== null) {
                        return remoteVal;
                    }
                }
                catch (_a) {
                    // Fall through to null on read error
                }
            }
            return null;
        });
    }
    set(key, value, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            // Always store in memory cache so session/data is immediately available
            yield this.memoryCache.set(key, value);
            // Attempt to persist to remote Redis
            if (this.redisClient) {
                try {
                    yield this.redisClient.set(key, value, ...args);
                }
                catch (err) {
                    const msg = (err === null || err === void 0 ? void 0 : err.message) || "";
                    // Gracefully handle Read-Only / NOPERM / non-writable streams without failing the request
                    if (msg.includes("NOPERM") || msg.includes("writeable")) {
                        if (!this.hasLoggedReadOnlyNotice) {
                            console.log("ℹ️  Redis running in Read-Only mode. Writes safely handled by memory cache.");
                            this.hasLoggedReadOnlyNotice = true;
                        }
                    }
                    else {
                        console.warn("Redis write warning:", msg);
                    }
                }
            }
            return "OK";
        });
    }
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const deletedFromMemory = yield this.memoryCache.del(key);
            if (this.redisClient) {
                try {
                    yield this.redisClient.del(key);
                }
                catch (_a) {
                    // Ignore write restriction errors on delete
                }
            }
            return deletedFromMemory;
        });
    }
}
exports.redis = new HybridRedisClient(config_1.CONFIG.REDIS_URL);
//# sourceMappingURL=redis.js.map