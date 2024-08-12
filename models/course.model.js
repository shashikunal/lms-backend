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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const reviewSchema = new mongoose_1.Schema({
    user: { type: Object },
    rating: { type: Number, default: 0 },
    comment: { type: String },
    commentReplies: [Object],
});
const commentSchema = new mongoose_1.Schema({
    user: { type: Object },
    question: { type: String },
    questionReplies: { type: [Object] },
});
const linkSchema = new mongoose_1.Schema({
    title: { type: String },
    url: { type: String },
});
const courseDataSchema = new mongoose_1.Schema({
    title: { type: String },
    description: { type: String },
    videoUrl: { type: String },
    videoSection: { type: String },
    videoLength: { type: Number },
    videoPlayer: { type: String },
    links: { type: [linkSchema] },
    suggestion: { type: String },
    questions: { type: [commentSchema] },
});
const courseSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    estimatedPrice: { type: Number },
    thumbnail: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        },
    },
    tags: { type: String, required: true },
    level: { type: String, required: true },
    demoUrl: { type: String, required: true },
    benefits: { type: [{ title: String }] },
    prerequisites: { type: [{ title: String }] },
    reviews: { type: [reviewSchema] },
    courseData: { type: [courseDataSchema] },
    ratings: { type: Number, default: 0 },
    purchased: { type: Number, default: 0 },
}, { timestamps: true });
const CourseModel = mongoose_1.default.model("Course", courseSchema);
exports.default = CourseModel;
