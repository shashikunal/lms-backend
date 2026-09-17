"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("../app");
const db_1 = __importDefault(require("../utils/db"));
const config_1 = require("../config");
const cloudinary_1 = require("cloudinary");
if (config_1.CONFIG.CLOUD_NAME && config_1.CONFIG.CLOUDINARY_API && config_1.CONFIG.CLOUDINARY_SECRET) {
    cloudinary_1.v2.config({
        cloud_name: config_1.CONFIG.CLOUD_NAME,
        api_key: config_1.CONFIG.CLOUDINARY_API,
        api_secret: config_1.CONFIG.CLOUDINARY_SECRET,
    });
}
// Warm up database connection on serverless cold starts
(0, db_1.default)().catch((err) => {
    console.warn("MongoDB connection warning in serverless environment:", (err === null || err === void 0 ? void 0 : err.message) || err);
});
exports.default = app_1.app;
//# sourceMappingURL=index.js.map