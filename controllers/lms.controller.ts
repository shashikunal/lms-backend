import { NextFunction, Request, Response } from "express";
import { CatchAsyncErrors } from "../middlewares/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import { CONFIG } from "../config";
import { getStripeInstance } from "../config/stripe";
import CourseModel from "../models/course.model";
import OrderModel from "../models/orderModel";
import userModel from "../models/user.model";
import NotificationModel from "../models/notificationModel";
import EnrollmentModel from "../models/enrollment.model";
import LectureProgressModel from "../models/lectureProgress.model";
import CourseWishlistModel from "../models/courseWishlist.model";
import LmsCouponModel from "../models/lmsCoupon.model";
import CertificateModel from "../models/certificate.model";
import CategoryModel from "../models/category.model";
import PDFDocument from "pdfkit";
import { redis } from "../utils/redis";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isEnrolled = async (userId: string, courseId: string) => {
  const enrollment = await EnrollmentModel.findOne({ userId, courseId });
  if (enrollment) return enrollment;
  // Backward compat: legacy enrollment stored on User.courses + Order
  const user: any = await userModel.findById(userId);
  const legacy =
    user?.courses?.some(
      (c: any) =>
        c?.courseId?.toString() === courseId ||
        c?._id?.toString() === courseId ||
        c?.toString() === courseId
    ) || false;
  if (legacy) {
    return await EnrollmentModel.findOneAndUpdate(
      { userId, courseId },
      { $setOnInsert: { userId, courseId, progress: 0 } },
      { upsert: true, new: true }
    );
  }
  return null;
};

const ensureEnrollment = async (
  userId: string,
  courseId: string,
  orderId?: string
) => {
  const enrollment = await EnrollmentModel.findOneAndUpdate(
    { userId, courseId },
    { $setOnInsert: { userId, courseId, orderId, progress: 0 } },
    { upsert: true, new: true }
  );
  if (orderId && !enrollment.orderId) {
    enrollment.orderId = orderId;
    await enrollment.save();
  }
  // Keep legacy User.courses in sync for old /api/v1/course access checks
  await userModel.findByIdAndUpdate(userId, {
    $addToSet: { courses: { courseId } },
  });
  return enrollment;
};

const sanitizeCourse = (course: any) => {
  if (!course) return course;
  const obj = course.toObject ? course.toObject() : course;
  if (Array.isArray(obj.courseData)) {
    obj.courseData = obj.courseData.map((l: any) => {
      if (!l.isPreview) {
        const { videoUrl, ...rest } = l;
        void videoUrl;
        return rest;
      }
      return l;
    });
  }
  return obj;
};

const findLecture = async (lectureId: string) => {
  const course: any = await CourseModel.findOne({
    "courseData._id": lectureId,
  });
  if (!course) return null;
  const lecture = course.courseData.find(
    (l: any) => l._id.toString() === lectureId
  );
  return { course, lecture };
};

const computeCouponDiscount = async (
  code: string | undefined,
  courseId: string,
  price: number
) => {
  if (!code) return { discount: 0, coupon: null as any };
  const coupon = await LmsCouponModel.findOne({
    code: code.toUpperCase().trim(),
  });
  if (!coupon || !coupon.isActive) throw new ErrorHandler("Invalid coupon", 400);
  const now = new Date();
  if (coupon.startDate > now || coupon.endDate < now)
    throw new ErrorHandler("Coupon is expired", 400);
  if (
    coupon.usageLimit != null &&
    coupon.usedCount >= coupon.usageLimit
  )
    throw new ErrorHandler("Coupon usage limit reached", 400);
  if (coupon.courseId && coupon.courseId !== courseId)
    throw new ErrorHandler("Coupon not valid for this course", 400);
  if (price < (coupon.minPurchaseAmount || 0))
    throw new ErrorHandler("Course price below coupon minimum", 400);
  let discount =
    coupon.discountType === "percentage"
      ? (price * coupon.discountValue) / 100
      : coupon.discountValue;
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, price);
  return { discount: Math.round(discount * 100) / 100, coupon };
};

// ---------------------------------------------------------------------------
// Marketplace: courses / categories / search / home
// ---------------------------------------------------------------------------

export const lmsListCourses = CatchAsyncErrors(
  async (req: Request, res: Response) => {
    const { category, search, level, page = "1", limit = "12" } = req.query as any;
    const filter: any = { status: "PUBLISHED" };
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }
    const pg = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(50, parseInt(limit, 10) || 12);
    const [courses, total] = await Promise.all([
      CourseModel.find(filter)
        .select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        )
        .skip((pg - 1) * lim)
        .limit(lim)
        .sort({ createdAt: -1 }),
      CourseModel.countDocuments(filter),
    ]);
    res.status(200).json({ success: true, total, page: pg, limit: lim, courses });
  }
);

export const lmsSearchCourses = CatchAsyncErrors(
  async (req: Request, res: Response) => {
    const q = ((req.query.q as string) || "").trim();
    if (!q) return res.status(200).json({ success: true, courses: [] });
    const courses = await CourseModel.find({
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
  }
);

export const lmsHome = CatchAsyncErrors(
  async (req: Request, res: Response) => {
    const [featured, topRated, newest] = await Promise.all([
      CourseModel.find({ status: "PUBLISHED" })
        .sort({ purchased: -1 })
        .limit(6)
        .select("name price discountPrice thumbnail ratings purchased category"),
      CourseModel.find({ status: "PUBLISHED" })
        .sort({ ratings: -1 })
        .limit(6)
        .select("name price discountPrice thumbnail ratings purchased category"),
      CourseModel.find({ status: "PUBLISHED" })
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
  }
);

export const lmsCategories = CatchAsyncErrors(
  async (_req: Request, res: Response) => {
    const categories = await CourseModel.aggregate([
      { $match: { status: "PUBLISHED" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { title: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);
    res.status(200).json({ success: true, categories });
  }
);

export const lmsGetCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const course: any = await CourseModel.findById(req.params.courseId);
    if (!course) return next(new ErrorHandler("Course not found", 404));
    if (course.status !== "PUBLISHED") {
      const role = (req as any).user?.role;
      const isOwner =
        course.instructor?.id?.toString() === (req as any).userId?.toString();
      if (role !== "admin" && !isOwner)
        return next(new ErrorHandler("Course is not published", 404));
    }
    res.status(200).json({ success: true, course: sanitizeCourse(course) });
  }
);

export const lmsGetCurriculum = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const course: any = await CourseModel.findById(req.params.courseId);
    if (!course) return next(new ErrorHandler("Course not found", 404));
    const userId = (req as any).userId?.toString();
    const enrolled = userId ? await isEnrolled(userId, course._id.toString()) : null;
    const curriculum = (course.courseData || []).map((l: any) => {
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
  }
);

export const lmsGetSections = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const course: any = await CourseModel.findById(req.params.courseId);
    if (!course) return next(new ErrorHandler("Course not found", 404));
    const groups: Record<string, any[]> = {};
    for (const l of course.courseData || []) {
      const key = l.videoSection || "General";
      if (!groups[key]) groups[key] = [];
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
  }
);

const groupLecturesBySection = (courseData: any[]) => {
  const groups: Record<string, any[]> = {};
  for (const l of courseData || []) {
    const key = l.videoSection || "General";
    if (!groups[key]) groups[key] = [];
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
export const lmsGetSection = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sectionId } = req.params;
    const byLecture: any = await CourseModel.findOne({
      "courseData._id": sectionId,
    }).catch(() => null);
    if (byLecture) {
      const lecture = byLecture.courseData.find(
        (l: any) => l._id.toString() === sectionId
      );
      const sections = groupLecturesBySection(byLecture.courseData);
      const section = sections.find(
        (s) => s.title === (lecture?.videoSection || "General")
      );
      return res.status(200).json({
        success: true,
        courseId: byLecture._id,
        section,
      });
    }
    const byTitle: any[] = await CourseModel.find({
      status: "PUBLISHED",
      "courseData.videoSection": sectionId,
    }).select("_id name courseData");
    if (!byTitle.length)
      return next(new ErrorHandler("Section not found", 404));
    return res.status(200).json({
      success: true,
      courses: byTitle.map((c) => ({
        courseId: c._id,
        courseName: c.name,
        sections: groupLecturesBySection(c.courseData).filter(
          (s) => s.title === sectionId
        ),
      })),
    });
  }
);

// GET /sections/:sectionId/lectures — flat lecture list for the section
export const lmsSectionLectures = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sectionId } = req.params;
    const byLecture: any = await CourseModel.findOne({
      "courseData._id": sectionId,
    }).catch(() => null);
    if (byLecture) {
      const lecture = byLecture.courseData.find(
        (l: any) => l._id.toString() === sectionId
      );
      const key = lecture?.videoSection || "General";
      const lectures = byLecture.courseData
        .filter((l: any) => (l.videoSection || "General") === key)
        .map((l: any) => ({
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
    const courses: any[] = await CourseModel.find({
      status: "PUBLISHED",
      "courseData.videoSection": sectionId,
    }).select("_id courseData");
    if (!courses.length)
      return next(new ErrorHandler("Section not found", 404));
    const lectures = courses.flatMap((c) =>
      c.courseData
        .filter((l: any) => l.videoSection === sectionId)
        .map((l: any) => ({
          _id: l._id,
          courseId: c._id,
          title: l.title,
          videoLength: l.videoLength,
          isPreview: !!l.isPreview,
        }))
    );
    return res.status(200).json({ success: true, section: sectionId, lectures });
  }
);

// ---------------------------------------------------------------------------
// Lectures: access (enrollment-gated), progress, complete
// ---------------------------------------------------------------------------

export const lmsGetLecture = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const found = await findLecture(req.params.lectureId);
    if (!found) return next(new ErrorHandler("Lecture not found", 404));
    const { course, lecture } = found;
    if (!lecture.isPreview) {
      const enrolled = await isEnrolled(
        req.userId?.toString(),
        course._id.toString()
      );
      const isOwner =
        course.instructor?.id?.toString() === req.userId?.toString();
      if (!enrolled && req.user?.role !== "admin" && !isOwner)
        return next(
          new ErrorHandler("Enroll in this course to access this lecture", 403)
        );
    }
    res.status(200).json({ success: true, lecture });
  }
);

export const lmsLectureAccess = CatchAsyncErrors(
  async (req: Request | any, res: Response) => {
    const found = await findLecture(req.params.lectureId);
    if (!found)
      return res.status(404).json({ success: false, hasAccess: false });
    const { course, lecture } = found;
    if (lecture.isPreview)
      return res.status(200).json({ success: true, hasAccess: true, reason: "preview" });
    const enrolled = await isEnrolled(
      req.userId?.toString(),
      course._id.toString()
    );
    const isOwner =
      course.instructor?.id?.toString() === req.userId?.toString();
    const hasAccess =
      !!enrolled || req.user?.role === "admin" || isOwner;
    res.status(200).json({ success: true, hasAccess });
  }
);

const recalcEnrollmentProgress = async (userId: string, courseId: string) => {
  const course: any = await CourseModel.findById(courseId);
  const total = course?.courseData?.length || 0;
  const enrollment = await EnrollmentModel.findOne({ userId, courseId });
  if (!enrollment) return null;
  if (total === 0) {
    enrollment.progress = 0;
  } else {
    enrollment.progress = Math.min(
      100,
      Math.round((enrollment.completedLectureIds.length / total) * 100)
    );
  }
  if (enrollment.progress >= 100 && !enrollment.completed) {
    enrollment.completed = true;
    enrollment.completedAt = new Date();
    // Auto-issue certificate
    const user = await userModel.findById(userId);
    const certId = `CERT-${courseId.slice(-6).toUpperCase()}-${userId
      .slice(-6)
      .toUpperCase()}`;
    await CertificateModel.findOneAndUpdate(
      { userId, courseId },
      {
        $setOnInsert: {
          userId,
          courseId,
          enrollmentId: enrollment._id.toString(),
          certificateId: certId,
          userName: (user as any)?.name || "Student",
          courseName: course?.name || "Course",
        },
      },
      { upsert: true, new: true }
    );
  }
  await enrollment.save();
  return enrollment;
};

export const lmsSaveProgress = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const userId = req.userId?.toString();
    const { lectureId } = req.params;
    const { watchedSeconds = 0 } = req.body || {};
    const found = await findLecture(lectureId);
    if (!found) return next(new ErrorHandler("Lecture not found", 404));
    const enrolled = await isEnrolled(userId, found.course._id.toString());
    if (!enrolled)
      return next(new ErrorHandler("Enroll in this course first", 403));
    const progress = await LectureProgressModel.findOneAndUpdate(
      { userId, courseId: found.course._id.toString(), lectureId },
      {
        $set: {
          watchedSeconds: Number(watchedSeconds) || 0,
          lastAccessedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, progress });
  }
);

export const lmsCompleteLecture = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const userId = req.userId?.toString();
    const { lectureId } = req.params;
    const found = await findLecture(lectureId);
    if (!found) return next(new ErrorHandler("Lecture not found", 404));
    const courseId = found.course._id.toString();
    const enrolled = await isEnrolled(userId, courseId);
    if (!enrolled)
      return next(new ErrorHandler("Enroll in this course first", 403));
    await LectureProgressModel.findOneAndUpdate(
      { userId, courseId, lectureId },
      { $set: { completed: true, lastAccessedAt: new Date() } },
      { upsert: true, new: true }
    );
    // Atomic: persist the completed lecture BEFORE recalculating, so the
    // fresh document read inside recalc sees it (avoids stale-doc overwrite).
    await EnrollmentModel.findOneAndUpdate(
      { userId, courseId },
      { $addToSet: { completedLectureIds: lectureId } }
    );
    const updated = await recalcEnrollmentProgress(userId, courseId);
    res.status(200).json({ success: true, enrollment: updated });
  }
);

// ---------------------------------------------------------------------------
// Purchase: Buy Now -> Checkout -> Payment -> Verify -> Order -> Enrollment
// No shipping address. No quantity. No physical cart. Digital product only.
// ---------------------------------------------------------------------------

export const lmsCreatePayment = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const { courseId, couponCode } = req.body || {};
    if (!courseId) return next(new ErrorHandler("courseId is required", 400));
    const course: any = await CourseModel.findById(courseId);
    if (!course || course.status !== "PUBLISHED")
      return next(new ErrorHandler("Course not available for purchase", 404));
    const already = await isEnrolled(req.userId?.toString(), courseId);
    if (already)
      return next(new ErrorHandler("You are already enrolled in this course", 400));
    const basePrice = Number(
      course.discountPrice != null ? course.discountPrice : course.price
    );
    let discount = 0;
    try {
      const r = await computeCouponDiscount(couponCode, courseId, basePrice);
      discount = r.discount;
    } catch (e: any) {
      return next(e);
    }
    const amount = Math.round((basePrice - discount) * 100) / 100;
    const stripe = getStripeInstance();
    let paymentIntent: any;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "inr",
        automatic_payment_methods: { enabled: true },
        metadata: {
          userId: req.userId?.toString(),
          courseId: courseId.toString(),
          couponCode: couponCode || "",
        },
      });
    } catch {
      paymentIntent = {
        id: `pi_mock_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency: "inr",
        status: "requires_payment_method",
        client_secret: `pi_mock_${Date.now()}_secret_mock`,
        metadata: {
          userId: req.userId?.toString(),
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
  }
);

export const lmsVerifyPayment = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const userId = req.userId?.toString();
    const { paymentIntentId, courseId, couponCode } = req.body || {};
    if (!paymentIntentId || !courseId)
      return next(new ErrorHandler("Missing payment verification parameters", 400));
    const course: any = await CourseModel.findById(courseId);
    if (!course) return next(new ErrorHandler("Course not found", 404));
    const already = await isEnrolled(userId, courseId);
    if (already)
      return next(new ErrorHandler("You are already enrolled in this course", 400));

    const stripe = getStripeInstance();
    let paymentIntent: any;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch {
      return next(new ErrorHandler("Invalid payment intent", 400));
    }
    if (paymentIntent.status !== "succeeded")
      return next(new ErrorHandler("Payment not completed", 400));
    if (paymentIntent.metadata?.userId !== userId)
      return next(new ErrorHandler("Payment verification failed", 400));

    let coupon: any = null;
    if (couponCode) {
      const r = await computeCouponDiscount(couponCode, courseId, Number(course.price));
      coupon = r.coupon;
      if (coupon) {
        coupon.usedCount = (coupon.usedCount || 0) + 1;
        await coupon.save();
      }
    }
    const order: any = await OrderModel.create({
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
    const enrollment = await ensureEnrollment(
      userId,
      course._id.toString(),
      order._id.toString()
    );
    const user = await userModel.findById(userId);
    if (course) {
      course.purchased = (course.purchased || 0) + 1;
      await course.save();
    }
    await NotificationModel.create({
      user: userId,
      title: "Enrollment confirmed",
      message: `You are now enrolled in ${course?.name}. Go to My Learning to start.`,
    });
    void user;
    res.status(201).json({
      success: true,
      message: "Payment verified. Enrollment confirmed. Go to Course.",
      order,
      enrollment,
    });
  }
);

export const lmsPurchases = CatchAsyncErrors(
  async (req: Request | any, res: Response) => {
    const orders = await OrderModel.find({ userId: req.userId?.toString() }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, orders });
  }
);

export const lmsOrders = CatchAsyncErrors(
  async (req: Request | any, res: Response) => {
    const orders = await OrderModel.find({ userId: req.userId?.toString() }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, orders });
  }
);

export const lmsGetOrder = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const order: any = await OrderModel.findById(req.params.orderId);
    if (!order) return next(new ErrorHandler("Order not found", 404));
    if (
      order.userId?.toString() !== req.userId?.toString() &&
      req.user?.role !== "admin"
    )
      return next(new ErrorHandler("Not authorized", 403));
    res.status(200).json({ success: true, order });
  }
);

// ---------------------------------------------------------------------------
// Enrollments + My Learning (primary model; orders live under history)
// ---------------------------------------------------------------------------

export const lmsEnrollments = CatchAsyncErrors(
  async (req: Request | any, res: Response) => {
    const enrollments = await EnrollmentModel.find({
      userId: req.userId?.toString(),
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, enrollments });
  }
);

export const lmsGetEnrollment = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const enrollment = await EnrollmentModel.findById(req.params.enrollmentId);
    if (!enrollment) return next(new ErrorHandler("Enrollment not found", 404));
    if (
      enrollment.userId !== req.userId?.toString() &&
      req.user?.role !== "admin"
    )
      return next(new ErrorHandler("Not authorized", 403));
    res.status(200).json({ success: true, enrollment });
  }
);

export const lmsMyLearning = CatchAsyncErrors(
  async (req: Request | any, res: Response) => {
    const userId = req.userId?.toString();
    const enrollments = await EnrollmentModel.find({ userId }).sort({
      updatedAt: -1,
    });
    const wishlist = await CourseWishlistModel.findOne({ userId });
    const wishlistIds = (wishlist?.courses || []).map((c) => c.courseId);
    const courseIds = enrollments.map((e) => e.courseId);
    const courses: any[] = courseIds.length
      ? await CourseModel.find({ _id: { $in: courseIds } }).select(
          "name thumbnail ratings category level"
        )
      : [];
    const byId: Record<string, any> = {};
    for (const c of courses) byId[c._id.toString()] = c;
    const inProgress = enrollments.filter((e) => !e.completed);
    const completed = enrollments.filter((e) => e.completed);
    const certificates = await CertificateModel.find({ userId });
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
  }
);

// ---------------------------------------------------------------------------
// Wishlist (courses)
// ---------------------------------------------------------------------------

export const lmsGetWishlist = CatchAsyncErrors(
  async (req: Request | any, res: Response) => {
    const wishlist = await CourseWishlistModel.findOne({
      userId: req.userId?.toString(),
    });
    res.status(200).json({ success: true, wishlist: wishlist?.courses || [] });
  }
);

export const lmsToggleWishlist = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const userId = req.userId?.toString();
    const { courseId } = req.body || {};
    if (!courseId) return next(new ErrorHandler("courseId is required", 400));
    const course = await CourseModel.findById(courseId);
    if (!course) return next(new ErrorHandler("Course not found", 404));
    let wishlist = await CourseWishlistModel.findOne({ userId });
    if (!wishlist) wishlist = await CourseWishlistModel.create({ userId, courses: [] });
    const idx = wishlist.courses.findIndex((c) => c.courseId === courseId);
    let wishlisted: boolean;
    if (idx >= 0) {
      wishlist.courses.splice(idx, 1);
      wishlisted = false;
    } else {
      wishlist.courses.push({ courseId, addedAt: new Date() } as any);
      wishlisted = true;
    }
    await wishlist.save();
    res.status(200).json({ success: true, wishlisted, wishlist: wishlist.courses });
  }
);

// ---------------------------------------------------------------------------
// Reviews (courses) — reuses embedded Course.reviews, exposed under /lms
// ---------------------------------------------------------------------------

export const lmsListReviews = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const course: any = await CourseModel.findById(req.params.courseId);
    if (!course) return next(new ErrorHandler("Course not found", 404));
    res.status(200).json({ success: true, reviews: course.reviews || [] });
  }
);

export const lmsAddReview = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const userId = req.userId?.toString();
    const { courseId } = req.params;
    const { rating, comment } = req.body || {};
    if (!rating) return next(new ErrorHandler("rating is required", 400));
    const enrolled = await isEnrolled(userId, courseId);
    if (!enrolled)
      return next(new ErrorHandler("Enroll in this course to review it", 403));
    const course: any = await CourseModel.findById(courseId);
    if (!course) return next(new ErrorHandler("Course not found", 404));
    course.reviews.push({ user: req.user, rating, comment });
    let avg = 0;
    course.reviews.forEach((r: any) => (avg += r.rating));
    course.ratings = avg / course.reviews.length;
    await course.save();
    res.status(201).json({ success: true, reviews: course.reviews });
  }
);

// ---------------------------------------------------------------------------
// Coupons (courses)
// ---------------------------------------------------------------------------

export const lmsValidateCoupon = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { code, courseId } = (req.body || {}) as any;
    if (!code || !courseId)
      return next(new ErrorHandler("code and courseId are required", 400));
    const course: any = await CourseModel.findById(courseId);
    if (!course) return next(new ErrorHandler("Course not found", 404));
    const base = Number(
      course.discountPrice != null ? course.discountPrice : course.price
    );
    try {
      const { discount } = await computeCouponDiscount(code, courseId, base);
      res.status(200).json({
        success: true,
        discount,
        payable: Math.round((base - discount) * 100) / 100,
      });
    } catch (e: any) {
      return next(e);
    }
  }
);

export const lmsCreateCoupon = CatchAsyncErrors(
  async (req: Request, res: Response) => {
    const coupon = await LmsCouponModel.create(req.body);
    res.status(201).json({ success: true, coupon });
  }
);

export const lmsListCoupons = CatchAsyncErrors(
  async (_req: Request, res: Response) => {
    const coupons = await LmsCouponModel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, coupons });
  }
);

// ---------------------------------------------------------------------------
// Certificates
// ---------------------------------------------------------------------------

export const lmsMyCertificates = CatchAsyncErrors(
  async (req: Request | any, res: Response) => {
    const certificates = await CertificateModel.find({
      userId: req.userId?.toString(),
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, certificates });
  }
);

export const lmsGetCertificate = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const certificate = await CertificateModel.findById(req.params.certificateId);
    if (!certificate) return next(new ErrorHandler("Certificate not found", 404));
    if (
      certificate.userId !== req.userId?.toString() &&
      req.user?.role !== "admin"
    )
      return next(new ErrorHandler("Not authorized", 403));
    res.status(200).json({ success: true, certificate });
  }
);

// ---------------------------------------------------------------------------
// Instructor marketplace
// ---------------------------------------------------------------------------

export const lmsInstructorCourses = CatchAsyncErrors(
  async (req: Request | any, res: Response) => {
    const courses = await CourseModel.find({
      "instructor.id": req.userId?.toString(),
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, courses });
  }
);

export const lmsInstructorCreateCourse = CatchAsyncErrors(
  async (req: Request | any, res: Response) => {
    const data = {
      ...req.body,
      status: "DRAFT",
      instructor: {
        id: req.userId?.toString(),
        name: req.user?.name || "Instructor",
      },
    };
    const course = await CourseModel.create(data);
    res.status(201).json({ success: true, course });
  }
);

export const lmsInstructorUpdateCourse = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const course: any = await CourseModel.findById(req.params.courseId);
    if (!course) return next(new ErrorHandler("Course not found", 404));
    const isOwner =
      course.instructor?.id?.toString() === req.userId?.toString();
    if (!isOwner && req.user?.role !== "admin")
      return next(new ErrorHandler("Not authorized", 403));
    if (course.status === "PUBLISHED" && req.user?.role !== "admin") {
      const { status, ...rest } = req.body || {};
      void status;
      Object.assign(course, rest);
    } else {
      Object.assign(course, req.body);
    }
    await course.save();
    res.status(200).json({ success: true, course });
  }
);

export const lmsInstructorAddLecture = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const course: any = await CourseModel.findById(req.params.courseId);
    if (!course) return next(new ErrorHandler("Course not found", 404));
    const isOwner =
      course.instructor?.id?.toString() === req.userId?.toString();
    if (!isOwner && req.user?.role !== "admin")
      return next(new ErrorHandler("Not authorized", 403));
    course.courseData.push(req.body);
    await course.save();
    res.status(201).json({ success: true, courseData: course.courseData });
  }
);

export const lmsInstructorSubmitCourse = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const course: any = await CourseModel.findById(req.params.courseId);
    if (!course) return next(new ErrorHandler("Course not found", 404));
    const isOwner =
      course.instructor?.id?.toString() === req.userId?.toString();
    if (!isOwner && req.user?.role !== "admin")
      return next(new ErrorHandler("Not authorized", 403));
    course.status = "SUBMITTED";
    await course.save();
    res.status(200).json({ success: true, course });
  }
);

export const lmsInstructorStudents = CatchAsyncErrors(
  async (req: Request | any, res: Response) => {
    const courses = await CourseModel.find({
      "instructor.id": req.userId?.toString(),
    }).select("_id name");
    const ids = courses.map((c) => c._id.toString());
    const enrollments = await EnrollmentModel.find({
      courseId: { $in: ids },
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, enrollments });
  }
);

export const lmsInstructorRevenue = CatchAsyncErrors(
  async (req: Request | any, res: Response) => {
    const courses = await CourseModel.find({
      "instructor.id": req.userId?.toString(),
    }).select("_id name price");
    const ids = courses.map((c) => c._id.toString());
    const orders = await OrderModel.find({ courseId: { $in: ids } });
    const revenue = orders.reduce((sum: number, o: any) => {
      const amt = Number(o?.payment_info?.amount) || 0;
      return sum + amt;
    }, 0);
    const byCourse = courses.map((c: any) => {
      const count = orders.filter(
        (o: any) => o.courseId?.toString() === c._id.toString()
      ).length;
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
  }
);

export const lmsInstructorAnalytics = CatchAsyncErrors(
  async (req: Request | any, res: Response) => {
    const courses = await CourseModel.find({
      "instructor.id": req.userId?.toString(),
    }).select("_id name ratings purchased");
    const ids = courses.map((c) => c._id.toString());
    const [enrollments, certificates] = await Promise.all([
      EnrollmentModel.countDocuments({ courseId: { $in: ids } }),
      CertificateModel.countDocuments({ courseId: { $in: ids } }),
    ]);
    res.status(200).json({
      success: true,
      totalCourses: courses.length,
      totalEnrollments: enrollments,
      totalCompletions: certificates,
      courses,
    });
  }
);

// ---------------------------------------------------------------------------
// Admin marketplace
// ---------------------------------------------------------------------------

export const lmsAdminCourses = CatchAsyncErrors(
  async (_req: Request, res: Response) => {
    const courses = await CourseModel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, courses });
  }
);

export const lmsAdminReviewCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
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
      return next(new ErrorHandler("Invalid status", 400));
    const course = await CourseModel.findByIdAndUpdate(
      req.params.courseId,
      { status },
      { new: true }
    );
    if (!course) return next(new ErrorHandler("Course not found", 404));
    res.status(200).json({ success: true, course });
  }
);

export const lmsAdminInstructors = CatchAsyncErrors(
  async (_req: Request, res: Response) => {
    const instructors = await userModel
      .find({ role: { $in: ["instructor", "admin"] } })
      .select("-password");
    res.status(200).json({ success: true, instructors });
  }
);

export const lmsAdminOrders = CatchAsyncErrors(
  async (_req: Request, res: Response) => {
    const orders = await OrderModel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  }
);

export const lmsAdminEnrollments = CatchAsyncErrors(
  async (_req: Request, res: Response) => {
    const enrollments = await EnrollmentModel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, enrollments });
  }
);

export const lmsAdminAnalytics = CatchAsyncErrors(
  async (_req: Request, res: Response) => {
    const [users, courses, orders, enrollments, certificates] =
      await Promise.all([
        userModel.countDocuments(),
        CourseModel.countDocuments(),
        OrderModel.countDocuments(),
        EnrollmentModel.countDocuments(),
        CertificateModel.countDocuments(),
      ]);
    res.status(200).json({
      success: true,
      users,
      courses,
      orders,
      enrollments,
      certificates,
    });
  }
);

export const lmsWebhook = async (req: Request | any, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = CONFIG.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!sig || !webhookSecret) {
    return res.status(400).json({ success: false, message: "Missing webhook signature or secret" });
  }
  const stripe = getStripeInstance();
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    return res.status(400).json({ success: false, message: `Webhook Error: ${err.message}` });
  }
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const { userId, courseId, couponCode } = paymentIntent.metadata || {};
    if (!userId || !courseId) {
      return res.status(200).json({ received: true, skipped: "missing metadata" });
    }
    const existingOrder = await OrderModel.findOne({ "payment_info.id": paymentIntent.id });
    if (existingOrder) {
      return res.status(200).json({ received: true, skipped: "already processed" });
    }
    const course: any = await CourseModel.findById(courseId);
    if (!course) {
      return res.status(200).json({ received: true, skipped: "course not found" });
    }
    const already = await isEnrolled(userId, courseId);
    if (already) {
      return res.status(200).json({ received: true, skipped: "already enrolled" });
    }
    let coupon: any = null;
    if (couponCode) {
      const r = await computeCouponDiscount(couponCode, courseId, Number(course.price));
      coupon = r.coupon;
      if (coupon) {
        coupon.usedCount = (coupon.usedCount || 0) + 1;
        await coupon.save();
      }
    }
    const order: any = await OrderModel.create({
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
    const enrollment = await ensureEnrollment(userId, course._id.toString(), order._id.toString());
    course.purchased = (course.purchased || 0) + 1;
    await course.save();
    await NotificationModel.create({
      user: userId,
      title: "Enrollment confirmed",
      message: `You are now enrolled in ${course?.name}. Go to My Learning to start.`,
    });
    void enrollment;
  }
  res.status(200).json({ received: true });
};

export const lmsRefundPayment = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const { orderId } = req.body || {};
    if (!orderId) return next(new ErrorHandler("orderId is required", 400));
    const order: any = await OrderModel.findById(orderId);
    if (!order) return next(new ErrorHandler("Order not found", 404));
    if (
      order.userId?.toString() !== req.userId?.toString() &&
      req.user?.role !== "admin"
    )
      return next(new ErrorHandler("Not authorized", 403));
    if (order.payment_info?.status === "refunded")
      return next(new ErrorHandler("Order already refunded", 400));
    const paymentIntentId = order.payment_info?.id;
    if (!paymentIntentId)
      return next(new ErrorHandler("No payment intent found for this order", 400));
    const stripe = getStripeInstance();
    try {
      await stripe.refunds.create({ payment_intent: paymentIntentId });
    } catch (err: any) {
      return next(new ErrorHandler(err.message || "Refund failed", 400));
    }
    order.payment_info.status = "refunded";
    order.payment_info.refundedAt = new Date();
    await order.save();
    const enrollment = await EnrollmentModel.findOneAndDelete({
      userId: order.userId,
      courseId: order.courseId,
    });
    const course: any = await CourseModel.findById(order.courseId);
    if (course && course.purchased > 0) {
      course.purchased -= 1;
      await course.save();
    }
    await NotificationModel.create({
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
  }
);

export const lmsCreateCategory = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const { name, description } = req.body || {};
    if (!name) return next(new ErrorHandler("name is required", 400));
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const existing = await CategoryModel.findOne({ slug });
    if (existing) return next(new ErrorHandler("Category already exists", 400));
    const category = await CategoryModel.create({ name, description, slug });
    res.status(201).json({ success: true, category });
  }
);

export const lmsGetCategories = CatchAsyncErrors(
  async (_req: Request, res: Response) => {
    const categories = await CategoryModel.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, categories });
  }
);

export const lmsGetAllCategories = CatchAsyncErrors(
  async (_req: Request, res: Response) => {
    const categories = await CategoryModel.find().sort({ name: 1 });
    res.status(200).json({ success: true, categories });
  }
);

export const lmsUpdateCategory = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    const { name, description, isActive } = req.body || {};
    const category = await CategoryModel.findById(categoryId);
    if (!category) return next(new ErrorHandler("Category not found", 404));
    if (name) {
      category.name = name;
      category.slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;
    await category.save();
    res.status(200).json({ success: true, category });
  }
);

export const lmsDeleteCategory = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    const category = await CategoryModel.findByIdAndDelete(categoryId);
    if (!category) return next(new ErrorHandler("Category not found", 404));
    res.status(200).json({ success: true, message: "Category deleted successfully" });
  }
);

export const lmsUserProgressAnalytics = CatchAsyncErrors(
  async (req: Request | any, res: Response) => {
    const userId = req.userId?.toString();
    const enrollments = await EnrollmentModel.find({ userId }).sort({ updatedAt: -1 });
    const courseIds = enrollments.map((e) => e.courseId);
    const courses: any[] = courseIds.length
      ? await CourseModel.find({ _id: { $in: courseIds } }).select("name thumbnail category level")
      : [];
    const byId: Record<string, any> = {};
    for (const c of courses) byId[c._id.toString()] = c;
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
  }
);

export const lmsCloneCourse = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const { courseId } = req.body || {};
    if (!courseId) return next(new ErrorHandler("courseId is required", 400));
    const source: any = await CourseModel.findById(courseId);
    if (!source) return next(new ErrorHandler("Course not found", 404));
    const cloned = await CourseModel.create({
      name: `${source.name} (Copy)`,
      description: source.description,
      price: source.price,
      discountPrice: source.discountPrice,
      thumbnail: source.thumbnail,
      tags: source.tags,
      level: source.level,
      demoUrl: source.demoUrl,
      benefits: source.benefits,
      prerequisites: source.prerequisites,
      category: source.category,
      status: "DRAFT",
      courseData: source.courseData,
      instructor: source.instructor,
    });
    res.status(201).json({ success: true, course: cloned });
  }
);

export const lmsDownloadCertificate = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const { certificateId } = req.params;
    const certificate = await CertificateModel.findById(certificateId);
    if (!certificate) return next(new ErrorHandler("Certificate not found", 404));
    if (
      certificate.userId !== req.userId?.toString() &&
      req.user?.role !== "admin"
    )
      return next(new ErrorHandler("Not authorized", 403));
    const course: any = await CourseModel.findById(certificate.courseId).select("name");
    const user: any = await userModel.findById(certificate.userId).select("name");
    const doc = new PDFDocument({ size: "A4", layout: "landscape" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificate-${certificate.certificateId}.pdf"`
    );
    doc.pipe(res);
    doc.rect(0, 0, 842, 595).fill("#ffffff");
    doc.rect(20, 20, 802, 555).lineWidth(2).stroke("#1e293b");
    doc.rect(30, 30, 782, 535).lineWidth(1).stroke("#38bdf8");
    doc.fill("#1e293b").font("Helvetica-Bold").fontSize(36).text("Certificate of Completion", 0, 100, { align: "center" });
    doc.font("Helvetica").fontSize(16).fill("#64748b").text("This is to certify that", 0, 180, { align: "center" });
    doc.font("Helvetica-Bold").fontSize(28).fill("#0f172a").text(user?.name || "Student", 0, 220, { align: "center" });
    doc.font("Helvetica").fontSize(16).fill("#64748b").text("has successfully completed the course", 0, 270, { align: "center" });
    doc.font("Helvetica-Bold").fontSize(24).fill("#059669").text(course?.name || certificate.courseName || "Course", 0, 310, { align: "center" });
    doc.font("Helvetica").fontSize(14).fill("#64748b").text(`Certificate ID: ${certificate.certificateId}`, 0, 420, { align: "center" });
    doc.font("Helvetica").fontSize(14).fill("#64748b").text(`Issued: ${(certificate.createdAt || new Date()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 0, 450, { align: "center" });
    doc.font("Helvetica-Bold").fontSize(18).fill("#1e293b").text("QSP LEARNING", 0, 520, { align: "center" });
    doc.end();
  }
);

export const lmsBulkCourseOperation = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const { courseIds, action } = req.body || {};
    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0)
      return next(new ErrorHandler("courseIds array is required", 400));
    if (!["delete", "publish", "unpublish"].includes(action))
      return next(new ErrorHandler("Invalid action. Use: delete, publish, unpublish", 400));
    if (action === "delete") {
      const result = await CourseModel.deleteMany({ _id: { $in: courseIds } });
      for (const id of courseIds) {
        await redis.del(id);
      }
      return res.status(200).json({
        success: true,
        message: `${result.deletedCount} courses deleted`,
        deletedCount: result.deletedCount,
      });
    }
    const status = action === "publish" ? "PUBLISHED" : "UNPUBLISHED";
    const result = await CourseModel.updateMany(
      { _id: { $in: courseIds } },
      { $set: { status } }
    );
    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} courses ${action}ed`,
      modifiedCount: result.modifiedCount,
    });
  }
);
