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
let isConnected = false;
const connectDb = () => __awaiter(void 0, void 0, void 0, function* () {
    if (isConnected || mongoose_1.default.connection.readyState >= 1) {
        return;
    }
    if (!config_1.CONFIG.DB_URI) {
        console.warn("DB_URI is not defined in environment variables. MongoDB connection skipped.");
        return;
    }
    try {
        const conn = yield mongoose_1.default.connect(config_1.CONFIG.DB_URI);
        isConnected = true;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.error("MongoDB connection error:", error);
    }
});
exports.default = connectDb;
//# sourceMappingURL=db.js.map