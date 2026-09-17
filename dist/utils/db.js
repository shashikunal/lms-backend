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
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("../config");
const cached = global.mongooseCache || { conn: null, promise: null };
if (!global.mongooseCache) {
    global.mongooseCache = cached;
}
const connectDb = () => __awaiter(void 0, void 0, void 0, function* () {
    if (cached.conn && mongoose_1.default.connection.readyState >= 1) {
        return cached.conn;
    }
    const dbUri = config_1.CONFIG.DB_URI || process.env.DB_URI;
    if (!dbUri) {
        const msg = "DB_URI is not defined in environment variables.";
        console.warn(msg);
        throw new Error(msg);
    }
    if (!cached.promise) {
        const opts = {
            serverSelectionTimeoutMS: 8000,
            connectTimeoutMS: 10000,
        };
        cached.promise = mongoose_1.default.connect(dbUri, opts).then((m) => {
            console.log(`MongoDB Connected: ${m.connection.host}`);
            return m;
        });
    }
    try {
        cached.conn = yield cached.promise;
        return cached.conn;
    }
    catch (error) {
        cached.promise = null; // Reset on failure so subsequent requests can retry
        console.error("MongoDB connection error:", error);
        throw error;
    }
});
exports.default = connectDb;
//# sourceMappingURL=db.js.map