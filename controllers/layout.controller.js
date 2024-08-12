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
exports.getLayoutByType = exports.editLayout = exports.createLayout = void 0;
const catchAsyncErrors_1 = require("../middlewares/catchAsyncErrors");
const layout_model_1 = __importDefault(require("../models/layout.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const cloudinary_1 = __importDefault(require("cloudinary"));
//create Layout
exports.createLayout = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.body;
        const isTypeExist = yield layout_model_1.default.findOne({ type });
        if (isTypeExist) {
            return next(new ErrorHandler_1.default(`${type} already exist`, 400));
        }
        if (type === "banner") {
            const { image, title, subTitle } = req.body;
            const myCloud = yield cloudinary_1.default.v2.uploader.upload(image, {
                folder: "layout",
            });
            const banner = {
                image: {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                },
                title,
                subTitle,
            };
            const layout = yield layout_model_1.default.create({
                banner,
            });
            res.status(201).json({
                success: true,
                layout,
            });
        }
        //FAQ
        if (type === "faq") {
            const { faq } = req.body;
            const faqItems = yield Promise.all(faq.map((item) => __awaiter(void 0, void 0, void 0, function* () {
                return ({
                    question: item.question,
                    answer: item.answer,
                });
            })));
            yield layout_model_1.default.create({
                type: "faq",
                faq: faqItems,
            });
        }
        if (type === "categories") {
            const { categories } = req.body;
            const CategoryItems = yield Promise.all(categories.map((item) => __awaiter(void 0, void 0, void 0, function* () {
                return ({
                    title: item.title,
                });
            })));
            yield layout_model_1.default.create({
                type: "categories",
                categories: CategoryItems,
            });
        }
        res.status(200).json({
            success: true,
            message: "Layout created successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error, 500));
    }
}));
//edit layout
exports.editLayout = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.body;
        const isTypeExist = yield layout_model_1.default.findOne({ type });
        if (!isTypeExist) {
            return next(new ErrorHandler_1.default(`${type} does not exist`, 400));
        }
        if (type === "banner") {
            const bannerData = yield layout_model_1.default.findOne({ type: "banner" });
            const { image, title, subTitle } = req.body;
            if (bannerData) {
                yield cloudinary_1.default.v2.uploader.destroy(bannerData.image.public_id);
            }
            const myCloud = yield cloudinary_1.default.v2.uploader.upload(image, {
                folder: "layout",
            });
            const banner = {
                image: {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                },
                title,
                subTitle,
            };
            const layout = yield layout_model_1.default.findByIdAndUpdate(bannerData === null || bannerData === void 0 ? void 0 : bannerData._id, {
                banner,
            }, { new: true });
            res.status(201).json({
                success: true,
                layout,
            });
        }
        //FAQ
        if (type === "faq") {
            const { faq } = req.body;
            const faqItem = yield layout_model_1.default.findOne({ type: "faq" });
            const faqItems = yield Promise.all(faq.map((item) => __awaiter(void 0, void 0, void 0, function* () {
                return ({
                    question: item.question,
                    answer: item.answer,
                });
            })));
            yield layout_model_1.default.findByIdAndUpdate(faqItem === null || faqItem === void 0 ? void 0 : faqItem._id, { type: "faq", faq: faqItems }, { new: true });
        }
        if (type === "categories") {
            const { categories } = req.body;
            const categoriesItem = yield layout_model_1.default.findOne({
                type: "categories",
            });
            const CategoryItems = yield Promise.all(categories.map((item) => __awaiter(void 0, void 0, void 0, function* () {
                return ({
                    title: item.title,
                });
            })));
            yield layout_model_1.default.findByIdAndUpdate(categoriesItem === null || categoriesItem === void 0 ? void 0 : categoriesItem._id, { type: "categories", categories: CategoryItems }, { new: true });
        }
        res.status(200).json({
            success: true,
            message: "Layout updated successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error, 500));
    }
}));
//get layout by Type
exports.getLayoutByType = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.body;
        const layout = yield layout_model_1.default.findOne({ type });
        if (!layout) {
            return next(new ErrorHandler_1.default(`${type} does not exist`, 400));
        }
        res.status(200).json({
            success: true,
            layout,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error, 500));
    }
}));
