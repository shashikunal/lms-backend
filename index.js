"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const config_1 = require("./config");
const db_1 = __importDefault(require("./utils/db"));
const cloudinary_1 = require("cloudinary");
// Cloudinary config
if (config_1.CONFIG.CLOUD_NAME && config_1.CONFIG.CLOUDINARY_API && config_1.CONFIG.CLOUDINARY_SECRET) {
    cloudinary_1.v2.config({
        cloud_name: config_1.CONFIG.CLOUD_NAME,
        api_key: config_1.CONFIG.CLOUDINARY_API,
        api_secret: config_1.CONFIG.CLOUDINARY_SECRET,
    });
}
const PORT = config_1.CONFIG.PORT || 8000;
app_1.app.listen(PORT, () => {
    console.log(`Server is running on port number ${PORT}`);
    console.log(`Swagger UI Documentation available at: http://localhost:${PORT}/api-docs`);
    (0, db_1.default)();
});
exports.default = app_1.app;
//# sourceMappingURL=index.js.map