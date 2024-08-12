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
exports.updateNotificationStatus = exports.getNotifications = void 0;
const catchAsyncErrors_1 = require("../middlewares/catchAsyncErrors");
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const node_cron_1 = __importDefault(require("node-cron"));
//get all notification ==? only admin
exports.getNotifications = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notifications = yield notificationModel_1.default.find().sort({
            createdAt: -1,
        });
        res.status(200).json({
            success: true,
            notifications,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error, 500));
    }
}));
//update notification status
exports.updateNotificationStatus = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notification = yield notificationModel_1.default.findById(req.params.id);
        if (!notification) {
            return next(new ErrorHandler_1.default("Notification not found", 404));
        }
        notification.status = "read";
        yield notification.save();
        const notifications = yield notificationModel_1.default.find().sort({
            createdAt: -1,
        });
        res.status(200).json({
            success: true,
            notifications,
            message: "Notification status updated successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error, 500));
    }
}));
//delete notification ==> admin
node_cron_1.default.schedule("0 0 0 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        yield notificationModel_1.default.deleteMany({
            status: "read",
            createdAt: { $lt: thirtyDaysAgo },
        });
        console.log("deleted read notifications");
    }
    catch (error) {
        console.log(error);
    }
}));
//# sourceMappingURL=notification.controller.js.map