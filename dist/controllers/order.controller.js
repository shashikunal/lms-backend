"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.getAllOrderDashboard = exports.createOrder = void 0;
const catchAsyncErrors_1 = require("../middlewares/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const user_model_1 = __importDefault(require("../models/user.model"));
const course_model_1 = __importDefault(require("../models/course.model"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const order_service_1 = require("../services/order.service");
//create Order
exports.createOrder = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const { courseId, payment_info } = req.body;
        const user = yield user_model_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        const courseExistsUser = (_b = user === null || user === void 0 ? void 0 : user.courses) === null || _b === void 0 ? void 0 : _b.some((course) => {
            var _a, _b;
            return ((_a = course === null || course === void 0 ? void 0 : course.courseId) === null || _a === void 0 ? void 0 : _a.toString()) === courseId ||
                ((_b = course === null || course === void 0 ? void 0 : course._id) === null || _b === void 0 ? void 0 : _b.toString()) === courseId ||
                (course === null || course === void 0 ? void 0 : course.toString()) === courseId;
        });
        if (courseExistsUser) {
            return next(new ErrorHandler_1.default("You have already purchased this course", 403));
        }
        const course = yield course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 404));
        }
        const data = {
            courseId: course._id,
            userId: user === null || user === void 0 ? void 0 : user._id,
            userName: user === null || user === void 0 ? void 0 : user.name,
            payment_info,
        };
        const mailData = {
            order: {
                _id: course === null || course === void 0 ? void 0 : course._id,
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
            },
        };
        // Order confirmation email is best-effort: never block the purchase
        // when SMTP is unreachable. sendMail resolves templates from
        // dist/mails (copied at build) with a cwd fallback.
        try {
            if (user) {
                yield (0, sendMail_1.default)({
                    email: user === null || user === void 0 ? void 0 : user.email,
                    subject: "Order Confirmation",
                    template: "order-confirmation.ejs",
                    data: mailData,
                });
            }
        }
        catch (error) {
            console.warn("Order confirmation email skipped:", (error === null || error === void 0 ? void 0 : error.message) || error);
        }
        user === null || user === void 0 ? void 0 : user.courses.push(course === null || course === void 0 ? void 0 : course._id);
        yield (user === null || user === void 0 ? void 0 : user.save());
        yield notificationModel_1.default.create({
            user: user === null || user === void 0 ? void 0 : user._id,
            title: "New Order",
            message: `You have successfully purchased the course ${course === null || course === void 0 ? void 0 : course.name}`,
        });
        // Canonical LMS enrollment: Order (verified) -> Enrollment -> Course access
        try {
            const { default: EnrollmentModel } = yield Promise.resolve().then(() => __importStar(require("../models/enrollment.model")));
            yield EnrollmentModel.findOneAndUpdate({ userId: (_c = user === null || user === void 0 ? void 0 : user._id) === null || _c === void 0 ? void 0 : _c.toString(), courseId: (_d = course === null || course === void 0 ? void 0 : course._id) === null || _d === void 0 ? void 0 : _d.toString() }, {
                $setOnInsert: {
                    userId: (_e = user === null || user === void 0 ? void 0 : user._id) === null || _e === void 0 ? void 0 : _e.toString(),
                    courseId: (_f = course === null || course === void 0 ? void 0 : course._id) === null || _f === void 0 ? void 0 : _f.toString(),
                    progress: 0,
                },
            }, { upsert: true, new: true });
        }
        catch (_g) {
            // Enrollment sync is best-effort; order itself already succeeded
        }
        if (!(course === null || course === void 0 ? void 0 : course.purchased))
            course.purchased = 0;
        // Increment the purchased count for the course
        course.purchased += 1;
        yield course.save();
        (0, order_service_1.newOrder)(data, res, next);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//get All orders only for admin
exports.getAllOrderDashboard = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, order_service_1.getAllOrderService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//# sourceMappingURL=order.controller.js.map