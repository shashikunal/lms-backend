"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const config_1 = require("./config");
const db_1 = __importDefault(require("./utils/db"));
const cloudinary_1 = require("cloudinary");
//cloudinary config
cloudinary_1.v2.config({
    cloud_name: config_1.CONFIG.CLOUD_NAME,
    api_key: config_1.CONFIG.CLOUDINARY_API,
    api_secret: config_1.CONFIG.CLOUDINARY_SECRET,
});
app_1.app.listen(config_1.CONFIG.PORT || 8000, () => {
    console.log(`server is running on port number ${config_1.CONFIG.PORT}`);
    (0, db_1.default)();
});
//# sourceMappingURL=index.js.map