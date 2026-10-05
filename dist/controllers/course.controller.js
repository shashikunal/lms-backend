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
exports.deleteCourseByAdmin = exports.getAllCoursesDashboard = exports.addReplayToReview = exports.addReview = exports.addAnswer = exports.addQuestion = exports.getCourseByUser = exports.getAllCourses = exports.getSingleCourse = exports.editCourse = exports.uploadCourse = void 0;
const catchAsyncErrors_1 = require("../middlewares/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const course_service_1 = require("../services/course.service");
const course_model_1 = __importDefault(require("../models/course.model"));
const redis_1 = require("../utils/redis");
const mongoose_1 = __importDefault(require("mongoose"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
//upload Course
exports.uploadCourse = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        const thumbnail = data === null || data === void 0 ? void 0 : data.thumbnail;
        if (thumbnail) {
            const myCloud = yield cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        (0, course_service_1.createCourse)(data, res, next);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//edit course
exports.editCourse = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        const thumbnail = data === null || data === void 0 ? void 0 : data.thumbnail;
        if (thumbnail) {
            yield cloudinary_1.default.v2.uploader.destroy(thumbnail.public_id);
            const myCloud = yield cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        const courseId = req.params.id;
        const course = yield course_model_1.default.findByIdAndUpdate(courseId, {
            $set: data,
        }, {
            new: true,
        });
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 404));
        }
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//get single course
exports.getSingleCourse = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseId = req.params.id;
        const isCacheExits = yield redis_1.redis.get(courseId);
        if (isCacheExits) {
            const course = JSON.parse(isCacheExits);
            return res.status(200).json({
                success: true,
                course,
            });
        }
        else {
            const course = yield course_model_1.default.findById(courseId).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
            yield redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800); //7days expire
            res.status(200).json({
                success: true,
                course,
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//get all courses --with out purchasing
exports.getAllCourses = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isCacheExits = yield redis_1.redis.get("allCourses");
        if (isCacheExits) {
            const courses = JSON.parse(isCacheExits);
            return res.status(200).json({
                success: true,
                courses,
            });
        }
        else {
            const courses = yield course_model_1.default.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
            yield redis_1.redis.set("allCourses", JSON.stringify(courses));
            res.status(200).json({
                success: true,
                courses,
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//get course content only for valid user (enrollment = access control)
exports.getCourseByUser = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userCourseList = (_a = req.user) === null || _a === void 0 ? void 0 : _a.courses;
        const courseId = req.params.id;
        const legacyEnrolled = (userCourseList || []).some((course) => {
            var _a, _b;
            return ((_a = course === null || course === void 0 ? void 0 : course.courseId) === null || _a === void 0 ? void 0 : _a.toString()) === courseId ||
                ((_b = course === null || course === void 0 ? void 0 : course._id) === null || _b === void 0 ? void 0 : _b.toString()) === courseId ||
                (course === null || course === void 0 ? void 0 : course.toString()) === courseId;
        });
        if (!legacyEnrolled) {
            // Check canonical Enrollment collection (LMS access control)
            const { default: EnrollmentModel } = yield Promise.resolve().then(() => __importStar(require("../models/enrollment.model")));
            const enrollment = yield EnrollmentModel.findOne({
                userId: (_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id) === null || _c === void 0 ? void 0 : _c.toString(),
                courseId,
            });
            if (!enrollment) {
                return next(new ErrorHandler_1.default("You are not allowed to access this course", 403));
            }
        }
        const course = yield course_model_1.default.findById(courseId);
        const content = course === null || course === void 0 ? void 0 : course.courseData;
        res.status(200).json({
            success: true,
            content,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.addQuestion = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e;
    try {
        const { question, courseId, contentId } = req.body;
        const course = yield course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content id ", 400));
        }
        const courseContent = (_d = course === null || course === void 0 ? void 0 : course.courseData) === null || _d === void 0 ? void 0 : _d.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler_1.default("Invalid content id ", 400));
        }
        //create a new question object
        const newQuestion = {
            user: req.user,
            question,
            questionReplies: [],
        };
        //add this question to our course content
        courseContent.questions.push(newQuestion);
        //add notification to the question
        yield notificationModel_1.default.create({
            user: (_e = req === null || req === void 0 ? void 0 : req.user) === null || _e === void 0 ? void 0 : _e._id,
            title: "new question added",
            message: `you have a new question in ${courseContent === null || courseContent === void 0 ? void 0 : courseContent.title}`,
        });
        //save the updated course
        yield (course === null || course === void 0 ? void 0 : course.save());
        res.status(201).json({
            success: true,
            message: "Question added successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.addAnswer = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g, _h, _j, _k, _l, _m;
    try {
        const { answer, courseId, contentId, questionId } = req.body;
        const course = yield course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content id ", 400));
        }
        const courseContent = (_f = course === null || course === void 0 ? void 0 : course.courseData) === null || _f === void 0 ? void 0 : _f.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler_1.default("Invalid content id ", 400));
        }
        const question = (_g = courseContent === null || courseContent === void 0 ? void 0 : courseContent.questions) === null || _g === void 0 ? void 0 : _g.find((item) => item._id.equals(questionId));
        if (!question) {
            return next(new ErrorHandler_1.default("Invalid question id ", 400));
        }
        //create a new answer object
        const newAnswer = {
            user: req.user,
            answer,
        };
        //add this answer to our question
        (_h = question === null || question === void 0 ? void 0 : question.questionReplies) === null || _h === void 0 ? void 0 : _h.push(newAnswer);
        yield (course === null || course === void 0 ? void 0 : course.save());
        if (((_j = req.user) === null || _j === void 0 ? void 0 : _j._id) === ((_k = question.user) === null || _k === void 0 ? void 0 : _k._id)) {
            //create a notification
            yield notificationModel_1.default.create({
                user: (_l = req === null || req === void 0 ? void 0 : req.user) === null || _l === void 0 ? void 0 : _l._id,
                title: "New Question Replay Received",
                message: `You have a new answer in ${courseContent.title}`,
            });
        }
        else {
            const data = {
                name: question.user.name,
                title: courseContent.title,
            };
            // Reply notification email is best-effort: never hang or fail the
            // answer when SMTP is unreachable.
            try {
                yield (0, sendMail_1.default)({
                    email: (_m = question === null || question === void 0 ? void 0 : question.user) === null || _m === void 0 ? void 0 : _m.email,
                    subject: "Question replay",
                    template: "question-replay.ejs",
                    data,
                });
            }
            catch (error) {
                console.warn("Question reply email skipped:", (error === null || error === void 0 ? void 0 : error.message) || error);
            }
        }
        res.status(201).json({
            success: true,
            message: "Answer added successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.addReview = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _o, _p, _q, _r, _s, _t, _u, _v;
    try {
        const userCourseList = (_o = req.user) === null || _o === void 0 ? void 0 : _o.courses;
        const courseId = req.params.id;
        //check if course exits in courseList (supports both legacy shapes)
        const courseExits = (userCourseList === null || userCourseList === void 0 ? void 0 : userCourseList.some((course) => {
            var _a, _b;
            return ((_a = course === null || course === void 0 ? void 0 : course.courseId) === null || _a === void 0 ? void 0 : _a.toString()) === courseId ||
                ((_b = course === null || course === void 0 ? void 0 : course._id) === null || _b === void 0 ? void 0 : _b.toString()) === courseId ||
                (course === null || course === void 0 ? void 0 : course.toString()) === courseId;
        })) || false;
        if (!courseExits) {
            // Fall back to canonical Enrollment (Order -> Enrollment -> access)
            const { default: EnrollmentModel } = yield Promise.resolve().then(() => __importStar(require("../models/enrollment.model")));
            const enrollment = yield EnrollmentModel.findOne({
                userId: (_q = (_p = req.user) === null || _p === void 0 ? void 0 : _p._id) === null || _q === void 0 ? void 0 : _q.toString(),
                courseId,
            });
            if (!enrollment) {
                return next(new ErrorHandler_1.default("You are not allowed to access this course", 403));
            }
        }
        const course = yield course_model_1.default.findById(courseId);
        const { review, rating } = req.body;
        const reviewData = {
            user: req.user,
            comment: review,
            rating,
        };
        (_r = course === null || course === void 0 ? void 0 : course.reviews) === null || _r === void 0 ? void 0 : _r.push(reviewData);
        let avg = 0;
        (_s = course === null || course === void 0 ? void 0 : course.reviews) === null || _s === void 0 ? void 0 : _s.forEach((rev) => {
            avg += rev.rating;
        });
        if (course) {
            course.ratings = avg / ((_t = course === null || course === void 0 ? void 0 : course.reviews) === null || _t === void 0 ? void 0 : _t.length);
        }
        yield (course === null || course === void 0 ? void 0 : course.save());
        yield notificationModel_1.default.create({
            user: (_u = course === null || course === void 0 ? void 0 : course.instructor) === null || _u === void 0 ? void 0 : _u.id,
            title: "new review received",
            message: `${(_v = req.user) === null || _v === void 0 ? void 0 : _v.name} has given a review in ${course === null || course === void 0 ? void 0 : course.name} on your course`,
        });
        res.status(200).json({
            success: true,
            message: "Review added successfully",
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.addReplayToReview = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _w, _x, _y, _z;
    try {
        const { comment, reviewId, courseId } = req.body;
        const course = yield course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 400));
        }
        const review = (_w = course === null || course === void 0 ? void 0 : course.reviews) === null || _w === void 0 ? void 0 : _w.find((rev) => rev._id.toString() === reviewId);
        if (!review) {
            return next(new ErrorHandler_1.default("Review not found", 400));
        }
        const replayData = {
            user: req.user,
            comment,
        };
        if (!review.commentReplies) {
            review.commentReplies = [];
        }
        (_x = review === null || review === void 0 ? void 0 : review.commentReplies) === null || _x === void 0 ? void 0 : _x.push(replayData);
        yield (course === null || course === void 0 ? void 0 : course.save());
        if ((_y = review === null || review === void 0 ? void 0 : review.user) === null || _y === void 0 ? void 0 : _y._id) {
            yield notificationModel_1.default.create({
                user: review.user._id.toString(),
                title: "New reply to your review",
                message: `${((_z = req.user) === null || _z === void 0 ? void 0 : _z.name) || "Admin"} replied to your review on "${course === null || course === void 0 ? void 0 : course.name}".`,
            });
        }
        res.status(200).json({
            success: true,
            message: "Replay added successfully",
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//get All courses
exports.getAllCoursesDashboard = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, course_service_1.getAllCoursesService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//delete course by admin
exports.deleteCourseByAdmin = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const course = yield course_model_1.default.findById(id);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 404));
        }
        yield course_model_1.default.findByIdAndDelete(id);
        yield redis_1.redis.del(id);
        res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//# sourceMappingURL=course.controller.js.map