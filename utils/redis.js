"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = require("ioredis");
const config_1 = require("../config");
const redisClient = () => {
    if (config_1.CONFIG.REDIS_URL) {
        console.log("redis connected");
        return config_1.CONFIG.REDIS_URL;
    }
    throw new Error("Redis url not found");
};
exports.redis = new ioredis_1.Redis(redisClient());
