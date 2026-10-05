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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lmsUpdateCategory = exports.lmsGetAllCategories = exports.lmsGetCategories = exports.lmsCreateCategory = exports.lmsRefundPayment = exports.lmsWebhook = exports.lmsAdminAnalytics = exports.lmsAdminEnrollments = exports.lmsAdminOrders = exports.lmsAdminInstructors = exports.lmsAdminReviewCourse = exports.lmsAdminCourses = exports.lmsInstructorAnalytics = exports.lmsInstructorRevenue = exports.lmsInstructorStudents = exports.lmsInstructorSubmitCourse = exports.lmsInstructorAddLecture = exports.lmsInstructorUpdateCourse = exports.lmsInstructorCreateCourse = exports.lmsInstructorCourses = exports.lmsGetCertificate = exports.lmsMyCertificates = exports.lmsListCoupons = exports.lmsCreateCoupon = exports.lmsValidateCoupon = exports.lmsAddReview = exports.lmsListReviews = exports.lmsToggleWishlist = exports.lmsGetWishlist = exports.lmsMyLearning = exports.lmsGetEnrollment = exports.lmsEnrollments = exports.lmsGetOrder = exports.lmsOrders = exports.lmsPurchases = exports.lmsVerifyPayment = exports.lmsCreatePayment = exports.lmsCompleteLecture = exports.lmsSaveProgress = exports.lmsLectureAccess = exports.lmsGetLecture = exports.lmsSectionLectures = exports.lmsGetSection = exports.lmsGetSections = exports.lmsGetCurriculum = exports.lmsGetCourse = exports.lmsCategories = exports.lmsHome = exports.lmsSearchCourses = exports.lmsListCourses = void 0;
exports.lmsUserProgressAnalytics = exports.lmsDeleteCategory = void 0;
const catchAsyncErrors_1 = require("../middlewares/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const config_1 = require("../config");
const stripe_1 = require("../config/stripe");
const course_model_1 = __importDefault(require("../models/course.model"));
const orderModel_1 = __importDefault(require("../models/orderModel"));
const user_model_1 = __importDefault(require("../models/user.model"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const enrollment_model_1 = __importDefault(require("../models/enrollment.model"));
const lectureProgress_model_1 = __importDefault(require("../models/lectureProgress.model"));
const courseWishlist_model_1 = __importDefault(require("../models/courseWishlist.model"));
const lmsCoupon_model_1 = __importDefault(require("../models/lmsCoupon.model"));
const certificate_model_1 = __importDefault(require("../models/certificate.model"));
const category_model_1 = __importDefault(require("../models/category.model"));
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const isEnrolled = (userId, courseId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const enrollment = yield enrollment_model_1.default.findOne({ userId, courseId });
    if (enrollment)
        return enrollment;
    // Backward compat: legacy enrollment stored on User.courses + Order
    const user = yield user_model_1.default.findById(userId);
    const legacy = ((_a = user === null || user === void 0 ? void 0 : user.courses) === null || _a === void 0 ? void 0 : _a.some((c) => {
        var _a, _b;
        return ((_a = c === null || c === void 0 ? void 0 : c.courseId) === null || _a === void 0 ? void 0 : _a.toString()) === courseId ||
            ((_b = c === null || c === void 0 ? void 0 : c._id) === null || _b === void 0 ? void 0 : _b.toString()) === courseId ||
            (c === null || c === void 0 ? void 0 : c.toString()) === courseId;
    })) || false;
    if (legacy) {
        return yield enrollment_model_1.default.findOneAndUpdate({ userId, courseId }, { $setOnInsert: { userId, courseId, progress: 0 } }, { upsert: true, new: true });
    }
    return null;
});
const ensureEnrollment = (userId, courseId, orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const enrollment = yield enrollment_model_1.default.findOneAndUpdate({ userId, courseId }, { $setOnInsert: { userId, courseId, orderId, progress: 0 } }, { upsert: true, new: true });
    if (orderId && !enrollment.orderId) {
        enrollment.orderId = orderId;
        yield enrollment.save();
    }
    // Keep legacy User.courses in sync for old /api/v1/course access checks
    yield user_model_1.default.findByIdAndUpdate(userId, {
        $addToSet: { courses: { courseId } },
    });
    return enrollment;
});
const sanitizeCourse = (course) => {
    if (!course)
        return course;
    const obj = course.toObject ? course.toObject() : course;
    if (Array.isArray(obj.courseData)) {
        obj.courseData = obj.courseData.map((l) => {
            if (!l.isPreview) {
                const { videoUrl } = l, rest = __rest(l, ["videoUrl"]);
                void videoUrl;
                return rest;
            }
            return l;
        });
    }
    return obj;
};
const findLecture = (lectureId) => __awaiter(void 0, void 0, void 0, function* () {
    const course = yield course_model_1.default.findOne({
        "courseData._id": lectureId,
    });
    if (!course)
        return null;
    const lecture = course.courseData.find((l) => l._id.toString() === lectureId);
    return { course, lecture };
});
const computeCouponDiscount = (code, courseId, price) => __awaiter(void 0, void 0, void 0, function* () {
    if (!code)
        return { discount: 0, coupon: null };
    const coupon = yield lmsCoupon_model_1.default.findOne({
        code: code.toUpperCase().trim(),
    });
    if (!coupon || !coupon.isActive)
        throw new ErrorHandler_1.default("Invalid coupon", 400);
    const now = new Date();
    if (coupon.startDate > now || coupon.endDate < now)
        throw new ErrorHandler_1.default("Coupon is expired", 400);
    if (coupon.usageLimit != null &&
        coupon.usedCount >= coupon.usageLimit)
        throw new ErrorHandler_1.default("Coupon usage limit reached", 400);
    if (coupon.courseId && coupon.courseId !== courseId)
        throw new ErrorHandler_1.default("Coupon not valid for this course", 400);
    if (price < (coupon.minPurchaseAmount || 0))
        throw new ErrorHandler_1.default("Course price below coupon minimum", 400);
    let discount = coupon.discountType === "percentage"
        ? (price * coupon.discountValue) / 100
        : coupon.discountValue;
    if (coupon.maxDiscount != null)
        discount = Math.min(discount, coupon.maxDiscount);
    discount = Math.min(discount, price);
    return { discount: Math.round(discount * 100) / 100, coupon };
});
// ---------------------------------------------------------------------------
// Marketplace: courses / categories / search / home
// ---------------------------------------------------------------------------
exports.lmsListCourses = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { category, search, level, page = "1", limit = "12" } = req.query;
    const filter = { status: "PUBLISHED" };
    if (category)
        filter.category = category;
    if (level)
        filter.level = level;
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { tags: { $regex: search, $options: "i" } },
        ];
    }
    const pg = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(50, parseInt(limit, 10) || 12);
    const [courses, total] = yield Promise.all([
        course_model_1.default.find(filter)
            .select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links")
            .skip((pg - 1) * lim)
            .limit(lim)
            .sort({ createdAt: -1 }),
        course_model_1.default.countDocuments(filter),
    ]);
    res.status(200).json({ success: true, total, page: pg, limit: lim, courses });
}));
exports.lmsSearchCourses = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const q = (req.query.q || "").trim();
    if (!q)
        return res.status(200).json({ success: true, courses: [] });
    const courses = yield course_model_1.default.find({
        status: "PUBLISHED",
        $or: [
            { name: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } },
            { tags: { $regex: q, $options: "i" } },
            { category: { $regex: q, $options: "i" } },
        ],
    })
        .select("name description price discountPrice thumbnail ratings purchased category level")
        .limit(24);
    res.status(200).json({ success: true, courses });
}));
exports.lmsHome = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const [featured, topRated, newest] = yield Promise.all([
        course_model_1.default.find({ status: "PUBLISHED" })
            .sort({ purchased: -1 })
            .limit(6)
            .select("name price discountPrice thumbnail ratings purchased category"),
        course_model_1.default.find({ status: "PUBLISHED" })
            .sort({ ratings: -1 })
            .limit(6)
            .select("name price discountPrice thumbnail ratings purchased category"),
        course_model_1.default.find({ status: "PUBLISHED" })
            .sort({ createdAt: -1 })
            .limit(6)
            .select("name price discountPrice thumbnail ratings purchased category"),
    ]);
    res.status(200).json({
        success: true,
        featured,
        topRated,
        newest,
    });
}));
exports.lmsCategories = (0, catchAsyncErrors_1.CatchAsyncErrors)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categories = yield course_model_1.default.aggregate([
        { $match: { status: "PUBLISHED" } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $project: { title: "$_id", count: 1, _id: 0 } },
        { $sort: { count: -1 } },
    ]);
    res.status(200).json({ success: true, categories });
}));
exports.lmsGetCourse = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d, _e;
    const course = yield course_model_1.default.findById(req.params.courseId);
    if (!course)
        return next(new ErrorHandler_1.default("Course not found", 404));
    if (course.status !== "PUBLISHED") {
        const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const isOwner = ((_d = (_c = course.instructor) === null || _c === void 0 ? void 0 : _c.id) === null || _d === void 0 ? void 0 : _d.toString()) === ((_e = req.userId) === null || _e === void 0 ? void 0 : _e.toString());
        if (role !== "admin" && !isOwner)
            return next(new ErrorHandler_1.default("Course is not published", 404));
    }
    res.status(200).json({ success: true, course: sanitizeCourse(course) });
}));
exports.lmsGetCurriculum = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    const course = yield course_model_1.default.findById(req.params.courseId);
    if (!course)
        return next(new ErrorHandler_1.default("Course not found", 404));
    const userId = (_f = req.userId) === null || _f === void 0 ? void 0 : _f.toString();
    const enrolled = userId ? yield isEnrolled(userId, course._id.toString()) : null;
    const curriculum = (course.courseData || []).map((l) => {
        const locked = !l.isPreview && !enrolled;
        return {
            _id: l._id,
            title: l.title,
            description: l.description,
            videoSection: l.videoSection,
            videoLength: l.videoLength,
            isPreview: !!l.isPreview,
            locked,
            videoUrl: !locked ? l.videoUrl : undefined,
        };
    });
    res.status(200).json({ success: true, curriculum });
}));
exports.lmsGetSections = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const course = yield course_model_1.default.findById(req.params.courseId);
    if (!course)
        return next(new ErrorHandler_1.default("Course not found", 404));
    const groups = {};
    for (const l of course.courseData || []) {
        const key = l.videoSection || "General";
        if (!groups[key])
            groups[key] = [];
        groups[key].push({
            _id: l._id,
            title: l.title,
            videoLength: l.videoLength,
            isPreview: !!l.isPreview,
        });
    }
    const sections = Object.entries(groups).map(([title, lectures]) => ({
        title,
        lectures,
    }));
    res.status(200).json({ success: true, sections });
}));
const groupLecturesBySection = (courseData) => {
    const groups = {};
    for (const l of courseData || []) {
        const key = l.videoSection || "General";
        if (!groups[key])
            groups[key] = [];
        groups[key].push({
            _id: l._id,
            title: l.title,
            videoLength: l.videoLength,
            isPreview: !!l.isPreview,
        });
    }
    return Object.entries(groups).map(([title, lectures]) => ({
        title,
        lectures,
    }));
};
// GET /sections/:sectionId — sectionId is either a lecture _id (returns the
// section that lecture belongs to) or a section title (matched across courses)
exports.lmsGetSection = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { sectionId } = req.params;
    const byLecture = yield course_model_1.default.findOne({
        "courseData._id": sectionId,
    }).catch(() => null);
    if (byLecture) {
        const lecture = byLecture.courseData.find((l) => l._id.toString() === sectionId);
        const sections = groupLecturesBySection(byLecture.courseData);
        const section = sections.find((s) => s.title === ((lecture === null || lecture === void 0 ? void 0 : lecture.videoSection) || "General"));
        return res.status(200).json({
            success: true,
            courseId: byLecture._id,
            section,
        });
    }
    const byTitle = yield course_model_1.default.find({
        status: "PUBLISHED",
        "courseData.videoSection": sectionId,
    }).select("_id name courseData");
    if (!byTitle.length)
        return next(new ErrorHandler_1.default("Section not found", 404));
    return res.status(200).json({
        success: true,
        courses: byTitle.map((c) => ({
            courseId: c._id,
            courseName: c.name,
            sections: groupLecturesBySection(c.courseData).filter((s) => s.title === sectionId),
        })),
    });
}));
// GET /sections/:sectionId/lectures — flat lecture list for the section
exports.lmsSectionLectures = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { sectionId } = req.params;
    const byLecture = yield course_model_1.default.findOne({
        "courseData._id": sectionId,
    }).catch(() => null);
    if (byLecture) {
        const lecture = byLecture.courseData.find((l) => l._id.toString() === sectionId);
        const key = (lecture === null || lecture === void 0 ? void 0 : lecture.videoSection) || "General";
        const lectures = byLecture.courseData
            .filter((l) => (l.videoSection || "General") === key)
            .map((l) => ({
            _id: l._id,
            title: l.title,
            videoLength: l.videoLength,
            isPreview: !!l.isPreview,
        }));
        return res.status(200).json({
            success: true,
            courseId: byLecture._id,
            section: key,
            lectures,
        });
    }
    const courses = yield course_model_1.default.find({
        status: "PUBLISHED",
        "courseData.videoSection": sectionId,
    }).select("_id courseData");
    if (!courses.length)
        return next(new ErrorHandler_1.default("Section not found", 404));
    const lectures = courses.flatMap((c) => c.courseData
        .filter((l) => l.videoSection === sectionId)
        .map((l) => ({
        _id: l._id,
        courseId: c._id,
        title: l.title,
        videoLength: l.videoLength,
        isPreview: !!l.isPreview,
    })));
    return res.status(200).json({ success: true, section: sectionId, lectures });
}));
// ---------------------------------------------------------------------------
// Lectures: access (enrollment-gated), progress, complete
// ---------------------------------------------------------------------------
exports.lmsGetLecture = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h, _j, _k, _l;
    const found = yield findLecture(req.params.lectureId);
    if (!found)
        return next(new ErrorHandler_1.default("Lecture not found", 404));
    const { course, lecture } = found;
    if (!lecture.isPreview) {
        const enrolled = yield isEnrolled((_g = req.userId) === null || _g === void 0 ? void 0 : _g.toString(), course._id.toString());
        const isOwner = ((_j = (_h = course.instructor) === null || _h === void 0 ? void 0 : _h.id) === null || _j === void 0 ? void 0 : _j.toString()) === ((_k = req.userId) === null || _k === void 0 ? void 0 : _k.toString());
        if (!enrolled && ((_l = req.user) === null || _l === void 0 ? void 0 : _l.role) !== "admin" && !isOwner)
            return next(new ErrorHandler_1.default("Enroll in this course to access this lecture", 403));
    }
    res.status(200).json({ success: true, lecture });
}));
exports.lmsLectureAccess = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _m, _o, _p, _q, _r;
    const found = yield findLecture(req.params.lectureId);
    if (!found)
        return res.status(404).json({ success: false, hasAccess: false });
    const { course, lecture } = found;
    if (lecture.isPreview)
        return res.status(200).json({ success: true, hasAccess: true, reason: "preview" });
    const enrolled = yield isEnrolled((_m = req.userId) === null || _m === void 0 ? void 0 : _m.toString(), course._id.toString());
    const isOwner = ((_p = (_o = course.instructor) === null || _o === void 0 ? void 0 : _o.id) === null || _p === void 0 ? void 0 : _p.toString()) === ((_q = req.userId) === null || _q === void 0 ? void 0 : _q.toString());
    const hasAccess = !!enrolled || ((_r = req.user) === null || _r === void 0 ? void 0 : _r.role) === "admin" || isOwner;
    res.status(200).json({ success: true, hasAccess });
}));
const recalcEnrollmentProgress = (userId, courseId) => __awaiter(void 0, void 0, void 0, function* () {
    var _s;
    const course = yield course_model_1.default.findById(courseId);
    const total = ((_s = course === null || course === void 0 ? void 0 : course.courseData) === null || _s === void 0 ? void 0 : _s.length) || 0;
    const enrollment = yield enrollment_model_1.default.findOne({ userId, courseId });
    if (!enrollment)
        return null;
    if (total === 0) {
        enrollment.progress = 0;
    }
    else {
        enrollment.progress = Math.min(100, Math.round((enrollment.completedLectureIds.length / total) * 100));
    }
    if (enrollment.progress >= 100 && !enrollment.completed) {
        enrollment.completed = true;
        enrollment.completedAt = new Date();
        // Auto-issue certificate
        const user = yield user_model_1.default.findById(userId);
        const certId = `CERT-${courseId.slice(-6).toUpperCase()}-${userId
            .slice(-6)
            .toUpperCase()}`;
        yield certificate_model_1.default.findOneAndUpdate({ userId, courseId }, {
            $setOnInsert: {
                userId,
                courseId,
                enrollmentId: enrollment._id.toString(),
                certificateId: certId,
                userName: (user === null || user === void 0 ? void 0 : user.name) || "Student",
                courseName: (course === null || course === void 0 ? void 0 : course.name) || "Course",
            },
        }, { upsert: true, new: true });
    }
    yield enrollment.save();
    return enrollment;
});
exports.lmsSaveProgress = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _t;
    const userId = (_t = req.userId) === null || _t === void 0 ? void 0 : _t.toString();
    const { lectureId } = req.params;
    const { watchedSeconds = 0 } = req.body || {};
    const found = yield findLecture(lectureId);
    if (!found)
        return next(new ErrorHandler_1.default("Lecture not found", 404));
    const enrolled = yield isEnrolled(userId, found.course._id.toString());
    if (!enrolled)
        return next(new ErrorHandler_1.default("Enroll in this course first", 403));
    const progress = yield lectureProgress_model_1.default.findOneAndUpdate({ userId, courseId: found.course._id.toString(), lectureId }, {
        $set: {
            watchedSeconds: Number(watchedSeconds) || 0,
            lastAccessedAt: new Date(),
        },
    }, { upsert: true, new: true });
    res.status(200).json({ success: true, progress });
}));
exports.lmsCompleteLecture = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _u;
    const userId = (_u = req.userId) === null || _u === void 0 ? void 0 : _u.toString();
    const { lectureId } = req.params;
    const found = yield findLecture(lectureId);
    if (!found)
        return next(new ErrorHandler_1.default("Lecture not found", 404));
    const courseId = found.course._id.toString();
    const enrolled = yield isEnrolled(userId, courseId);
    if (!enrolled)
        return next(new ErrorHandler_1.default("Enroll in this course first", 403));
    yield lectureProgress_model_1.default.findOneAndUpdate({ userId, courseId, lectureId }, { $set: { completed: true, lastAccessedAt: new Date() } }, { upsert: true, new: true });
    // Atomic: persist the completed lecture BEFORE recalculating, so the
    // fresh document read inside recalc sees it (avoids stale-doc overwrite).
    yield enrollment_model_1.default.findOneAndUpdate({ userId, courseId }, { $addToSet: { completedLectureIds: lectureId } });
    const updated = yield recalcEnrollmentProgress(userId, courseId);
    res.status(200).json({ success: true, enrollment: updated });
}));
// ---------------------------------------------------------------------------
// Purchase: Buy Now -> Checkout -> Payment -> Verify -> Order -> Enrollment
// No shipping address. No quantity. No physical cart. Digital product only.
// ---------------------------------------------------------------------------
exports.lmsCreatePayment = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _v, _w, _x;
    const { courseId, couponCode } = req.body || {};
    if (!courseId)
        return next(new ErrorHandler_1.default("courseId is required", 400));
    const course = yield course_model_1.default.findById(courseId);
    if (!course || course.status !== "PUBLISHED")
        return next(new ErrorHandler_1.default("Course not available for purchase", 404));
    const already = yield isEnrolled((_v = req.userId) === null || _v === void 0 ? void 0 : _v.toString(), courseId);
    if (already)
        return next(new ErrorHandler_1.default("You are already enrolled in this course", 400));
    const basePrice = Number(course.discountPrice != null ? course.discountPrice : course.price);
    let discount = 0;
    try {
        const r = yield computeCouponDiscount(couponCode, courseId, basePrice);
        discount = r.discount;
    }
    catch (e) {
        return next(e);
    }
    const amount = Math.round((basePrice - discount) * 100) / 100;
    const stripe = (0, stripe_1.getStripeInstance)();
    let paymentIntent;
    try {
        paymentIntent = yield stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: "inr",
            automatic_payment_methods: { enabled: true },
            metadata: {
                userId: (_w = req.userId) === null || _w === void 0 ? void 0 : _w.toString(),
                courseId: courseId.toString(),
                couponCode: couponCode || "",
            },
        });
    }
    catch (_y) {
        paymentIntent = {
            id: `pi_mock_${Date.now()}`,
            amount: Math.round(amount * 100),
            currency: "inr",
            status: "requires_payment_method",
            client_secret: `pi_mock_${Date.now()}_secret_mock`,
            metadata: {
                userId: (_x = req.userId) === null || _x === void 0 ? void 0 : _x.toString(),
                courseId: courseId.toString(),
            },
        };
    }
    res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        currency: "inr",
        course: { _id: course._id, name: course.name, price: basePrice, discount },
    });
}));
exports.lmsVerifyPayment = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _z, _0;
    const userId = (_z = req.userId) === null || _z === void 0 ? void 0 : _z.toString();
    const { paymentIntentId, courseId, couponCode } = req.body || {};
    if (!paymentIntentId || !courseId)
        return next(new ErrorHandler_1.default("Missing payment verification parameters", 400));
    const course = yield course_model_1.default.findById(courseId);
    if (!course)
        return next(new ErrorHandler_1.default("Course not found", 404));
    const already = yield isEnrolled(userId, courseId);
    if (already)
        return next(new ErrorHandler_1.default("You are already enrolled in this course", 400));
    const stripe = (0, stripe_1.getStripeInstance)();
    let paymentIntent;
    try {
        paymentIntent = yield stripe.paymentIntents.retrieve(paymentIntentId);
    }
    catch (_1) {
        return next(new ErrorHandler_1.default("Invalid payment intent", 400));
    }
    if (paymentIntent.status !== "succeeded")
        return next(new ErrorHandler_1.default("Payment not completed", 400));
    if (((_0 = paymentIntent.metadata) === null || _0 === void 0 ? void 0 : _0.userId) !== userId)
        return next(new ErrorHandler_1.default("Payment verification failed", 400));
    let coupon = null;
    if (couponCode) {
        const r = yield computeCouponDiscount(couponCode, courseId, Number(course.price));
        coupon = r.coupon;
        if (coupon) {
            coupon.usedCount = (coupon.usedCount || 0) + 1;
            yield coupon.save();
        }
    }
    const order = yield orderModel_1.default.create({
        courseId: course._id.toString(),
        userId,
        payment_info: {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            method: "stripe",
            paidAt: new Date(),
            couponCode: couponCode || undefined,
        },
    });
    const enrollment = yield ensureEnrollment(userId, course._id.toString(), order._id.toString());
    const user = yield user_model_1.default.findById(userId);
    if (course) {
        course.purchased = (course.purchased || 0) + 1;
        yield course.save();
    }
    yield notificationModel_1.default.create({
        user: userId,
        title: "Enrollment confirmed",
        message: `You are now enrolled in ${course === null || course === void 0 ? void 0 : course.name}. Go to My Learning to start.`,
    });
    void user;
    res.status(201).json({
        success: true,
        message: "Payment verified. Enrollment confirmed. Go to Course.",
        order,
        enrollment,
    });
}));
exports.lmsPurchases = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _2;
    const orders = yield orderModel_1.default.find({ userId: (_2 = req.userId) === null || _2 === void 0 ? void 0 : _2.toString() }).sort({
        createdAt: -1,
    });
    res.status(200).json({ success: true, orders });
}));
exports.lmsOrders = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _3;
    const orders = yield orderModel_1.default.find({ userId: (_3 = req.userId) === null || _3 === void 0 ? void 0 : _3.toString() }).sort({
        createdAt: -1,
    });
    res.status(200).json({ success: true, orders });
}));
exports.lmsGetOrder = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _4, _5, _6;
    const order = yield orderModel_1.default.findById(req.params.orderId);
    if (!order)
        return next(new ErrorHandler_1.default("Order not found", 404));
    if (((_4 = order.userId) === null || _4 === void 0 ? void 0 : _4.toString()) !== ((_5 = req.userId) === null || _5 === void 0 ? void 0 : _5.toString()) &&
        ((_6 = req.user) === null || _6 === void 0 ? void 0 : _6.role) !== "admin")
        return next(new ErrorHandler_1.default("Not authorized", 403));
    res.status(200).json({ success: true, order });
}));
// ---------------------------------------------------------------------------
// Enrollments + My Learning (primary model; orders live under history)
// ---------------------------------------------------------------------------
exports.lmsEnrollments = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _7;
    const enrollments = yield enrollment_model_1.default.find({
        userId: (_7 = req.userId) === null || _7 === void 0 ? void 0 : _7.toString(),
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, enrollments });
}));
exports.lmsGetEnrollment = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _8, _9;
    const enrollment = yield enrollment_model_1.default.findById(req.params.enrollmentId);
    if (!enrollment)
        return next(new ErrorHandler_1.default("Enrollment not found", 404));
    if (enrollment.userId !== ((_8 = req.userId) === null || _8 === void 0 ? void 0 : _8.toString()) &&
        ((_9 = req.user) === null || _9 === void 0 ? void 0 : _9.role) !== "admin")
        return next(new ErrorHandler_1.default("Not authorized", 403));
    res.status(200).json({ success: true, enrollment });
}));
exports.lmsMyLearning = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _10;
    const userId = (_10 = req.userId) === null || _10 === void 0 ? void 0 : _10.toString();
    const enrollments = yield enrollment_model_1.default.find({ userId }).sort({
        updatedAt: -1,
    });
    const wishlist = yield courseWishlist_model_1.default.findOne({ userId });
    const wishlistIds = ((wishlist === null || wishlist === void 0 ? void 0 : wishlist.courses) || []).map((c) => c.courseId);
    const courseIds = enrollments.map((e) => e.courseId);
    const courses = courseIds.length
        ? yield course_model_1.default.find({ _id: { $in: courseIds } }).select("name thumbnail ratings category level")
        : [];
    const byId = {};
    for (const c of courses)
        byId[c._id.toString()] = c;
    const inProgress = enrollments.filter((e) => !e.completed);
    const completed = enrollments.filter((e) => e.completed);
    const certificates = yield certificate_model_1.default.find({ userId });
    res.status(200).json({
        success: true,
        continueLearning: inProgress.slice(0, 5).map((e) => ({
            enrollment: e,
            course: byId[e.courseId] || null,
        })),
        inProgress: inProgress.map((e) => ({
            enrollment: e,
            course: byId[e.courseId] || null,
        })),
        completed: completed.map((e) => ({
            enrollment: e,
            course: byId[e.courseId] || null,
        })),
        wishlist: wishlistIds,
        certificates,
    });
}));
// ---------------------------------------------------------------------------
// Wishlist (courses)
// ---------------------------------------------------------------------------
exports.lmsGetWishlist = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _11;
    const wishlist = yield courseWishlist_model_1.default.findOne({
        userId: (_11 = req.userId) === null || _11 === void 0 ? void 0 : _11.toString(),
    });
    res.status(200).json({ success: true, wishlist: (wishlist === null || wishlist === void 0 ? void 0 : wishlist.courses) || [] });
}));
exports.lmsToggleWishlist = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _12;
    const userId = (_12 = req.userId) === null || _12 === void 0 ? void 0 : _12.toString();
    const { courseId } = req.body || {};
    if (!courseId)
        return next(new ErrorHandler_1.default("courseId is required", 400));
    const course = yield course_model_1.default.findById(courseId);
    if (!course)
        return next(new ErrorHandler_1.default("Course not found", 404));
    let wishlist = yield courseWishlist_model_1.default.findOne({ userId });
    if (!wishlist)
        wishlist = yield courseWishlist_model_1.default.create({ userId, courses: [] });
    const idx = wishlist.courses.findIndex((c) => c.courseId === courseId);
    let wishlisted;
    if (idx >= 0) {
        wishlist.courses.splice(idx, 1);
        wishlisted = false;
    }
    else {
        wishlist.courses.push({ courseId, addedAt: new Date() });
        wishlisted = true;
    }
    yield wishlist.save();
    res.status(200).json({ success: true, wishlisted, wishlist: wishlist.courses });
}));
// ---------------------------------------------------------------------------
// Reviews (courses) — reuses embedded Course.reviews, exposed under /lms
// ---------------------------------------------------------------------------
exports.lmsListReviews = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const course = yield course_model_1.default.findById(req.params.courseId);
    if (!course)
        return next(new ErrorHandler_1.default("Course not found", 404));
    res.status(200).json({ success: true, reviews: course.reviews || [] });
}));
exports.lmsAddReview = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _13;
    const userId = (_13 = req.userId) === null || _13 === void 0 ? void 0 : _13.toString();
    const { courseId } = req.params;
    const { rating, comment } = req.body || {};
    if (!rating)
        return next(new ErrorHandler_1.default("rating is required", 400));
    const enrolled = yield isEnrolled(userId, courseId);
    if (!enrolled)
        return next(new ErrorHandler_1.default("Enroll in this course to review it", 403));
    const course = yield course_model_1.default.findById(courseId);
    if (!course)
        return next(new ErrorHandler_1.default("Course not found", 404));
    course.reviews.push({ user: req.user, rating, comment });
    let avg = 0;
    course.reviews.forEach((r) => (avg += r.rating));
    course.ratings = avg / course.reviews.length;
    yield course.save();
    res.status(201).json({ success: true, reviews: course.reviews });
}));
// ---------------------------------------------------------------------------
// Coupons (courses)
// ---------------------------------------------------------------------------
exports.lmsValidateCoupon = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { code, courseId } = (req.body || {});
    if (!code || !courseId)
        return next(new ErrorHandler_1.default("code and courseId are required", 400));
    const course = yield course_model_1.default.findById(courseId);
    if (!course)
        return next(new ErrorHandler_1.default("Course not found", 404));
    const base = Number(course.discountPrice != null ? course.discountPrice : course.price);
    try {
        const { discount } = yield computeCouponDiscount(code, courseId, base);
        res.status(200).json({
            success: true,
            discount,
            payable: Math.round((base - discount) * 100) / 100,
        });
    }
    catch (e) {
        return next(e);
    }
}));
exports.lmsCreateCoupon = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const coupon = yield lmsCoupon_model_1.default.create(req.body);
    res.status(201).json({ success: true, coupon });
}));
exports.lmsListCoupons = (0, catchAsyncErrors_1.CatchAsyncErrors)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const coupons = yield lmsCoupon_model_1.default.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, coupons });
}));
// ---------------------------------------------------------------------------
// Certificates
// ---------------------------------------------------------------------------
exports.lmsMyCertificates = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _14;
    const certificates = yield certificate_model_1.default.find({
        userId: (_14 = req.userId) === null || _14 === void 0 ? void 0 : _14.toString(),
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, certificates });
}));
exports.lmsGetCertificate = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _15, _16;
    const certificate = yield certificate_model_1.default.findById(req.params.certificateId);
    if (!certificate)
        return next(new ErrorHandler_1.default("Certificate not found", 404));
    if (certificate.userId !== ((_15 = req.userId) === null || _15 === void 0 ? void 0 : _15.toString()) &&
        ((_16 = req.user) === null || _16 === void 0 ? void 0 : _16.role) !== "admin")
        return next(new ErrorHandler_1.default("Not authorized", 403));
    res.status(200).json({ success: true, certificate });
}));
// ---------------------------------------------------------------------------
// Instructor marketplace
// ---------------------------------------------------------------------------
exports.lmsInstructorCourses = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _17;
    const courses = yield course_model_1.default.find({
        "instructor.id": (_17 = req.userId) === null || _17 === void 0 ? void 0 : _17.toString(),
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, courses });
}));
exports.lmsInstructorCreateCourse = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _18, _19;
    const data = Object.assign(Object.assign({}, req.body), { status: "DRAFT", instructor: {
            id: (_18 = req.userId) === null || _18 === void 0 ? void 0 : _18.toString(),
            name: ((_19 = req.user) === null || _19 === void 0 ? void 0 : _19.name) || "Instructor",
        } });
    const course = yield course_model_1.default.create(data);
    res.status(201).json({ success: true, course });
}));
exports.lmsInstructorUpdateCourse = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _20, _21, _22, _23, _24;
    const course = yield course_model_1.default.findById(req.params.courseId);
    if (!course)
        return next(new ErrorHandler_1.default("Course not found", 404));
    const isOwner = ((_21 = (_20 = course.instructor) === null || _20 === void 0 ? void 0 : _20.id) === null || _21 === void 0 ? void 0 : _21.toString()) === ((_22 = req.userId) === null || _22 === void 0 ? void 0 : _22.toString());
    if (!isOwner && ((_23 = req.user) === null || _23 === void 0 ? void 0 : _23.role) !== "admin")
        return next(new ErrorHandler_1.default("Not authorized", 403));
    if (course.status === "PUBLISHED" && ((_24 = req.user) === null || _24 === void 0 ? void 0 : _24.role) !== "admin") {
        const _25 = req.body || {}, { status } = _25, rest = __rest(_25, ["status"]);
        void status;
        Object.assign(course, rest);
    }
    else {
        Object.assign(course, req.body);
    }
    yield course.save();
    res.status(200).json({ success: true, course });
}));
exports.lmsInstructorAddLecture = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _26, _27, _28, _29;
    const course = yield course_model_1.default.findById(req.params.courseId);
    if (!course)
        return next(new ErrorHandler_1.default("Course not found", 404));
    const isOwner = ((_27 = (_26 = course.instructor) === null || _26 === void 0 ? void 0 : _26.id) === null || _27 === void 0 ? void 0 : _27.toString()) === ((_28 = req.userId) === null || _28 === void 0 ? void 0 : _28.toString());
    if (!isOwner && ((_29 = req.user) === null || _29 === void 0 ? void 0 : _29.role) !== "admin")
        return next(new ErrorHandler_1.default("Not authorized", 403));
    course.courseData.push(req.body);
    yield course.save();
    res.status(201).json({ success: true, courseData: course.courseData });
}));
exports.lmsInstructorSubmitCourse = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _30, _31, _32, _33;
    const course = yield course_model_1.default.findById(req.params.courseId);
    if (!course)
        return next(new ErrorHandler_1.default("Course not found", 404));
    const isOwner = ((_31 = (_30 = course.instructor) === null || _30 === void 0 ? void 0 : _30.id) === null || _31 === void 0 ? void 0 : _31.toString()) === ((_32 = req.userId) === null || _32 === void 0 ? void 0 : _32.toString());
    if (!isOwner && ((_33 = req.user) === null || _33 === void 0 ? void 0 : _33.role) !== "admin")
        return next(new ErrorHandler_1.default("Not authorized", 403));
    course.status = "SUBMITTED";
    yield course.save();
    res.status(200).json({ success: true, course });
}));
exports.lmsInstructorStudents = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _34;
    const courses = yield course_model_1.default.find({
        "instructor.id": (_34 = req.userId) === null || _34 === void 0 ? void 0 : _34.toString(),
    }).select("_id name");
    const ids = courses.map((c) => c._id.toString());
    const enrollments = yield enrollment_model_1.default.find({
        courseId: { $in: ids },
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, enrollments });
}));
exports.lmsInstructorRevenue = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _35;
    const courses = yield course_model_1.default.find({
        "instructor.id": (_35 = req.userId) === null || _35 === void 0 ? void 0 : _35.toString(),
    }).select("_id name price");
    const ids = courses.map((c) => c._id.toString());
    const orders = yield orderModel_1.default.find({ courseId: { $in: ids } });
    const revenue = orders.reduce((sum, o) => {
        var _a;
        const amt = Number((_a = o === null || o === void 0 ? void 0 : o.payment_info) === null || _a === void 0 ? void 0 : _a.amount) || 0;
        return sum + amt;
    }, 0);
    const byCourse = courses.map((c) => {
        const count = orders.filter((o) => { var _a; return ((_a = o.courseId) === null || _a === void 0 ? void 0 : _a.toString()) === c._id.toString(); }).length;
        return {
            courseId: c._id,
            name: c.name,
            enrollments: count,
            revenue: count * Number(c.price || 0),
        };
    });
    res.status(200).json({
        success: true,
        totalRevenue: revenue,
        totalEnrollments: orders.length,
        byCourse,
    });
}));
exports.lmsInstructorAnalytics = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _36;
    const courses = yield course_model_1.default.find({
        "instructor.id": (_36 = req.userId) === null || _36 === void 0 ? void 0 : _36.toString(),
    }).select("_id name ratings purchased");
    const ids = courses.map((c) => c._id.toString());
    const [enrollments, certificates] = yield Promise.all([
        enrollment_model_1.default.countDocuments({ courseId: { $in: ids } }),
        certificate_model_1.default.countDocuments({ courseId: { $in: ids } }),
    ]);
    res.status(200).json({
        success: true,
        totalCourses: courses.length,
        totalEnrollments: enrollments,
        totalCompletions: certificates,
        courses,
    });
}));
// ---------------------------------------------------------------------------
// Admin marketplace
// ---------------------------------------------------------------------------
exports.lmsAdminCourses = (0, catchAsyncErrors_1.CatchAsyncErrors)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const courses = yield course_model_1.default.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, courses });
}));
exports.lmsAdminReviewCourse = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { status } = req.body || {};
    const allowed = [
        "DRAFT",
        "SUBMITTED",
        "UNDER_REVIEW",
        "PUBLISHED",
        "UNPUBLISHED",
        "ARCHIVED",
    ];
    if (!allowed.includes(status))
        return next(new ErrorHandler_1.default("Invalid status", 400));
    const course = yield course_model_1.default.findByIdAndUpdate(req.params.courseId, { status }, { new: true });
    if (!course)
        return next(new ErrorHandler_1.default("Course not found", 404));
    res.status(200).json({ success: true, course });
}));
exports.lmsAdminInstructors = (0, catchAsyncErrors_1.CatchAsyncErrors)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const instructors = yield user_model_1.default
        .find({ role: { $in: ["instructor", "admin"] } })
        .select("-password");
    res.status(200).json({ success: true, instructors });
}));
exports.lmsAdminOrders = (0, catchAsyncErrors_1.CatchAsyncErrors)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const orders = yield orderModel_1.default.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
}));
exports.lmsAdminEnrollments = (0, catchAsyncErrors_1.CatchAsyncErrors)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const enrollments = yield enrollment_model_1.default.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, enrollments });
}));
exports.lmsAdminAnalytics = (0, catchAsyncErrors_1.CatchAsyncErrors)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const [users, courses, orders, enrollments, certificates] = yield Promise.all([
        user_model_1.default.countDocuments(),
        course_model_1.default.countDocuments(),
        orderModel_1.default.countDocuments(),
        enrollment_model_1.default.countDocuments(),
        certificate_model_1.default.countDocuments(),
    ]);
    res.status(200).json({
        success: true,
        users,
        courses,
        orders,
        enrollments,
        certificates,
    });
}));
const lmsWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = config_1.CONFIG.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "";
    if (!sig || !webhookSecret) {
        return res.status(400).json({ success: false, message: "Missing webhook signature or secret" });
    }
    const stripe = (0, stripe_1.getStripeInstance)();
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        return res.status(400).json({ success: false, message: `Webhook Error: ${err.message}` });
    }
    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const { userId, courseId, couponCode } = paymentIntent.metadata || {};
        if (!userId || !courseId) {
            return res.status(200).json({ received: true, skipped: "missing metadata" });
        }
        const existingOrder = yield orderModel_1.default.findOne({ "payment_info.id": paymentIntent.id });
        if (existingOrder) {
            return res.status(200).json({ received: true, skipped: "already processed" });
        }
        const course = yield course_model_1.default.findById(courseId);
        if (!course) {
            return res.status(200).json({ received: true, skipped: "course not found" });
        }
        const already = yield isEnrolled(userId, courseId);
        if (already) {
            return res.status(200).json({ received: true, skipped: "already enrolled" });
        }
        let coupon = null;
        if (couponCode) {
            const r = yield computeCouponDiscount(couponCode, courseId, Number(course.price));
            coupon = r.coupon;
            if (coupon) {
                coupon.usedCount = (coupon.usedCount || 0) + 1;
                yield coupon.save();
            }
        }
        const order = yield orderModel_1.default.create({
            courseId: course._id.toString(),
            userId,
            payment_info: {
                id: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                status: paymentIntent.status,
                method: "stripe",
                paidAt: new Date(),
                couponCode: couponCode || undefined,
            },
        });
        const enrollment = yield ensureEnrollment(userId, course._id.toString(), order._id.toString());
        course.purchased = (course.purchased || 0) + 1;
        yield course.save();
        yield notificationModel_1.default.create({
            user: userId,
            title: "Enrollment confirmed",
            message: `You are now enrolled in ${course === null || course === void 0 ? void 0 : course.name}. Go to My Learning to start.`,
        });
        void enrollment;
    }
    res.status(200).json({ received: true });
});
exports.lmsWebhook = lmsWebhook;
exports.lmsRefundPayment = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _37, _38, _39, _40, _41;
    const { orderId } = req.body || {};
    if (!orderId)
        return next(new ErrorHandler_1.default("orderId is required", 400));
    const order = yield orderModel_1.default.findById(orderId);
    if (!order)
        return next(new ErrorHandler_1.default("Order not found", 404));
    if (((_37 = order.userId) === null || _37 === void 0 ? void 0 : _37.toString()) !== ((_38 = req.userId) === null || _38 === void 0 ? void 0 : _38.toString()) &&
        ((_39 = req.user) === null || _39 === void 0 ? void 0 : _39.role) !== "admin")
        return next(new ErrorHandler_1.default("Not authorized", 403));
    if (((_40 = order.payment_info) === null || _40 === void 0 ? void 0 : _40.status) === "refunded")
        return next(new ErrorHandler_1.default("Order already refunded", 400));
    const paymentIntentId = (_41 = order.payment_info) === null || _41 === void 0 ? void 0 : _41.id;
    if (!paymentIntentId)
        return next(new ErrorHandler_1.default("No payment intent found for this order", 400));
    const stripe = (0, stripe_1.getStripeInstance)();
    try {
        yield stripe.refunds.create({ payment_intent: paymentIntentId });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message || "Refund failed", 400));
    }
    order.payment_info.status = "refunded";
    order.payment_info.refundedAt = new Date();
    yield order.save();
    const enrollment = yield enrollment_model_1.default.findOneAndDelete({
        userId: order.userId,
        courseId: order.courseId,
    });
    const course = yield course_model_1.default.findById(order.courseId);
    if (course && course.purchased > 0) {
        course.purchased -= 1;
        yield course.save();
    }
    yield notificationModel_1.default.create({
        user: order.userId,
        title: "Refund processed",
        message: `Your order has been refunded.`,
    });
    void enrollment;
    res.status(200).json({
        success: true,
        message: "Refund processed successfully",
        order,
    });
}));
exports.lmsCreateCategory = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description } = req.body || {};
    if (!name)
        return next(new ErrorHandler_1.default("name is required", 400));
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const existing = yield category_model_1.default.findOne({ slug });
    if (existing)
        return next(new ErrorHandler_1.default("Category already exists", 400));
    const category = yield category_model_1.default.create({ name, description, slug });
    res.status(201).json({ success: true, category });
}));
exports.lmsGetCategories = (0, catchAsyncErrors_1.CatchAsyncErrors)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categories = yield category_model_1.default.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, categories });
}));
exports.lmsGetAllCategories = (0, catchAsyncErrors_1.CatchAsyncErrors)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categories = yield category_model_1.default.find().sort({ name: 1 });
    res.status(200).json({ success: true, categories });
}));
exports.lmsUpdateCategory = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { categoryId } = req.params;
    const { name, description, isActive } = req.body || {};
    const category = yield category_model_1.default.findById(categoryId);
    if (!category)
        return next(new ErrorHandler_1.default("Category not found", 404));
    if (name) {
        category.name = name;
        category.slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }
    if (description !== undefined)
        category.description = description;
    if (isActive !== undefined)
        category.isActive = isActive;
    yield category.save();
    res.status(200).json({ success: true, category });
}));
exports.lmsDeleteCategory = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { categoryId } = req.params;
    const category = yield category_model_1.default.findByIdAndDelete(categoryId);
    if (!category)
        return next(new ErrorHandler_1.default("Category not found", 404));
    res.status(200).json({ success: true, message: "Category deleted successfully" });
}));
exports.lmsUserProgressAnalytics = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _42;
    const userId = (_42 = req.userId) === null || _42 === void 0 ? void 0 : _42.toString();
    const enrollments = yield enrollment_model_1.default.find({ userId }).sort({ updatedAt: -1 });
    const courseIds = enrollments.map((e) => e.courseId);
    const courses = courseIds.length
        ? yield course_model_1.default.find({ _id: { $in: courseIds } }).select("name thumbnail category level")
        : [];
    const byId = {};
    for (const c of courses)
        byId[c._id.toString()] = c;
    const progressList = enrollments.map((e) => ({
        courseId: e.courseId,
        course: byId[e.courseId] || null,
        progress: e.progress || 0,
        completed: e.completed || false,
        completedAt: e.completedAt || null,
        lastAccessedAt: e.updatedAt,
    }));
    const totalEnrollments = enrollments.length;
    const completedCount = enrollments.filter((e) => e.completed).length;
    const inProgressCount = totalEnrollments - completedCount;
    const avgProgress = totalEnrollments > 0
        ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / totalEnrollments)
        : 0;
    const lastActivity = enrollments.length > 0
        ? enrollments.reduce((latest, e) => {
            const d = e.updatedAt || e.createdAt;
            return d > latest ? d : latest;
        }, enrollments[0].updatedAt || enrollments[0].createdAt)
        : null;
    res.status(200).json({
        success: true,
        totalEnrollments,
        completedCount,
        inProgressCount,
        avgProgress,
        lastActivity,
        progress: progressList,
    });
}));
//# sourceMappingURL=lms.controller.js.map