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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.isAuthenticated = void 0;
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const config_1 = require("../config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const catchAsyncErrors_1 = require("./catchAsyncErrors");
const redis_1 = require("../utils/redis");
const user_model_1 = __importDefault(require("../models/user.model"));
//authenticated user
exports.isAuthenticated = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let access_token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.access_token;
    const authHeader = (_b = req.headers) === null || _b === void 0 ? void 0 : _b.authorization;
    // Check Bearer token in Authorization header first
    if (authHeader && authHeader.startsWith("Bearer ")) {
        access_token = authHeader.split(" ")[1];
    }
    if (!access_token) {
        console.log("Authentication failed: Missing Authorization header and access_token cookie");
        return next(new ErrorHandler_1.default("Login first to access this resource.", 401));
    }
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(access_token, config_1.CONFIG.ACCESS_TOKEN);
    }
    catch (err) {
        console.log("Authentication failed: Invalid or expired JWT -", err.message);
        return next(new ErrorHandler_1.default("access token is not valid.", 401));
    }
    if (!decoded || !decoded.id) {
        console.log("Authentication failed: Decoded JWT missing user id", decoded);
        return next(new ErrorHandler_1.default("access token is not valid.", 401));
    }
    req.userId = decoded.id;
    console.log("Decoded JWT:", decoded);
    console.log("User ID:", req.userId);
    // Check Redis session cache first
    let user = null;
    try {
        const cachedUser = yield redis_1.redis.get(decoded.id);
        if (cachedUser) {
            user = JSON.parse(cachedUser);
        }
    }
    catch (redisErr) {
        console.warn("Redis read warning in auth middleware:", (redisErr === null || redisErr === void 0 ? void 0 : redisErr.message) || redisErr);
    }
    // Fall back to MongoDB if Redis misses or is read-only / stateless
    if (!user) {
        user = yield user_model_1.default.findById(decoded.id).select("-password");
        if (user) {
            try {
                yield redis_1.redis.set(decoded.id, JSON.stringify(user), "EX", 604800);
            }
            catch (_c) {
                // Ignore cache write errors (e.g. read-only redis)
            }
        }
    }
    if (!user) {
        console.log(`Authentication failed: User with ID ${decoded.id} not found in database`);
        return next(new ErrorHandler_1.default("Unauthorized || user not found", 401));
    }
    if (user.password) {
        delete user.password;
    }
    req.user = user;
    console.log("Authenticated user:", user.email || user._id);
    next();
}));
//validate use role
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        var _a, _b;
        if (!roles.includes(((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) || "")) {
            return next(new ErrorHandler_1.default(`Role: ${(_b = req.user) === null || _b === void 0 ? void 0 : _b.role} is not allowed to access this resource.`, 403));
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
//# sourceMappingURL=auth.js.map