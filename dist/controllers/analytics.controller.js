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
exports.getOrderAnalytics = exports.getCourseAnalytics = exports.getUserAnalytics = void 0;
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = require("../middlewares/catchAsyncErrors");
const user_model_1 = __importDefault(require("../models/user.model"));
const analyticts_generator_1 = require("../utils/analyticts.generator");
const course_model_1 = __importDefault(require("../models/course.model"));
const orderModel_1 = __importDefault(require("../models/orderModel"));
//GET USER ANALYTICS ==ONLY FOR ADMIN
exports.getUserAnalytics = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield (0, analyticts_generator_1.generateLast12MonthsData)(user_model_1.default);
        res.status(200).json({ success: true, users });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error, 500));
    }
}));
//GET COURSE ANALYTICS ==ONLY FOR ADMIN
exports.getCourseAnalytics = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courses = yield (0, analyticts_generator_1.generateLast12MonthsData)(course_model_1.default);
        res.status(200).json({ success: true, courses });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error, 500));
    }
}));
//GET ORDER ANALYTICS ==ONLY FOR ADMIN
exports.getOrderAnalytics = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const Orders = yield (0, analyticts_generator_1.generateLast12MonthsData)(orderModel_1.default);
        res.status(200).json({ success: true, Orders });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error, 500));
    }
}));
//# sourceMappingURL=analytics.controller.js.map