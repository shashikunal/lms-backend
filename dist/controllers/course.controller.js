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
exports.deleteCourseByAdmin = exports.getAllCoursesDashboard = exports.addReplayToReview = exports.addReview = exports.addAnswer = exports.addQuestion = exports.getCourseByUser = exports.getAllCourses = exports.getSingleCourse = exports.editCourse = exports.uploadCourse = void 0;
const catchAsyncErrors_1 = require("../middlewares/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const course_service_1 = require("../services/course.service");
const course_model_1 = __importDefault(require("../models/course.model"));
const redis_1 = require("../utils/redis");
const mongoose_1 = __importDefault(require("mongoose"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
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
        res.status(201).json({
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
            res.status(201).json({
                success: true,
                courses,
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//get course content only for valid user
exports.getCourseByUser = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userCourseList = (_a = req.user) === null || _a === void 0 ? void 0 : _a.courses;
        const courseId = req.params.id;
        const courseExits = userCourseList.find((course) => course._id === courseId);
        if (!courseExits) {
            return next(new ErrorHandler_1.default("You are not allowed to access this course", 403));
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
    var _a, _b;
    try {
        const { question, courseId, contentId } = req.body;
        const course = yield course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content id ", 400));
        }
        const courseContent = (_a = course === null || course === void 0 ? void 0 : course.courseData) === null || _a === void 0 ? void 0 : _a.find((item) => item._id.equals(contentId));
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
            user: (_b = req === null || req === void 0 ? void 0 : req.user) === null || _b === void 0 ? void 0 : _b._id,
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
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const { answer, courseId, contentId, questionId } = req.body;
        const course = yield course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content id ", 400));
        }
        const courseContent = (_a = course === null || course === void 0 ? void 0 : course.courseData) === null || _a === void 0 ? void 0 : _a.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler_1.default("Invalid content id ", 400));
        }
        const question = (_b = courseContent === null || courseContent === void 0 ? void 0 : courseContent.questions) === null || _b === void 0 ? void 0 : _b.find((item) => item._id.equals(questionId));
        if (!question) {
            return next(new ErrorHandler_1.default("Invalid question id ", 400));
        }
        //create a new answer object
        const newAnswer = {
            user: req.user,
            answer,
        };
        //add this answer to our question
        (_c = question === null || question === void 0 ? void 0 : question.questionReplies) === null || _c === void 0 ? void 0 : _c.push(newAnswer);
        yield (course === null || course === void 0 ? void 0 : course.save());
        if (((_d = req.user) === null || _d === void 0 ? void 0 : _d._id) === ((_e = question.user) === null || _e === void 0 ? void 0 : _e._id)) {
            //create a notification
            yield notificationModel_1.default.create({
                user: (_f = req === null || req === void 0 ? void 0 : req.user) === null || _f === void 0 ? void 0 : _f._id,
                title: "New Question Replay Received",
                message: `You have a new answer in ${courseContent.title}`,
            });
        }
        else {
            const data = {
                name: question.user.name,
                title: courseContent.title,
            };
            const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/question-replay.ejs"), data);
            try {
                yield (0, sendMail_1.default)({
                    email: (_g = question === null || question === void 0 ? void 0 : question.user) === null || _g === void 0 ? void 0 : _g.email,
                    subject: "Question replay",
                    template: "question-replay.ejs",
                    data,
                });
            }
            catch (error) {
                return new ErrorHandler_1.default(error.message, 500);
            }
        }
        res.status(201).json({
            success: true,
            message: "Answer added successfully",
        });
    }
    catch (error) {
        return new ErrorHandler_1.default(error.message, 500);
    }
}));
exports.addReview = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const userCourseList = (_a = req.user) === null || _a === void 0 ? void 0 : _a.courses;
        const courseId = req.params.id;
        //check if course exits in courseList
        const courseExits = userCourseList === null || userCourseList === void 0 ? void 0 : userCourseList.some((course) => course._id.toString() === courseId);
        if (!courseExits) {
            return next(new ErrorHandler_1.default("You are not allowed to access this course", 403));
        }
        const course = yield course_model_1.default.findById(courseId);
        const { review, rating } = req.body;
        const reviewData = {
            user: req.user,
            comment: review,
            rating,
        };
        (_b = course === null || course === void 0 ? void 0 : course.reviews) === null || _b === void 0 ? void 0 : _b.push(reviewData);
        let avg = 0;
        (_c = course === null || course === void 0 ? void 0 : course.reviews) === null || _c === void 0 ? void 0 : _c.forEach((rev) => {
            avg += rev.rating;
        });
        if (course) {
            course.ratings = avg / ((_d = course === null || course === void 0 ? void 0 : course.reviews) === null || _d === void 0 ? void 0 : _d.length);
        }
        yield (course === null || course === void 0 ? void 0 : course.save());
        const notification = {
            title: "new review received",
            message: `${(_e = req.user) === null || _e === void 0 ? void 0 : _e.name} has given a review in ${course === null || course === void 0 ? void 0 : course.name} on your course`,
        };
        //create notification
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
    var _a, _b;
    try {
        const { comment, reviewId, courseId } = req.body;
        const course = yield course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 400));
        }
        const review = (_a = course === null || course === void 0 ? void 0 : course.reviews) === null || _a === void 0 ? void 0 : _a.find((rev) => rev._id.toString() === reviewId);
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
        (_b = review === null || review === void 0 ? void 0 : review.commentReplies) === null || _b === void 0 ? void 0 : _b.push(replayData);
        yield (course === null || course === void 0 ? void 0 : course.save());
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
        yield course.deleteOne({ id });
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