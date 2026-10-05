import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import {
  lmsAddReview,
  lmsAdminAnalytics,
  lmsAdminCourses,
  lmsAdminEnrollments,
  lmsAdminInstructors,
  lmsAdminOrders,
  lmsAdminReviewCourse,
  lmsCategories,
  lmsCompleteLecture,
  lmsCreateCoupon,
  lmsCreatePayment,
  lmsEnrollments,
  lmsGetCertificate,
  lmsGetCourse,
  lmsGetCurriculum,
  lmsGetEnrollment,
  lmsGetLecture,
  lmsGetOrder,
  lmsGetSection,
  lmsGetSections,
  lmsGetWishlist,
  lmsHome,
  lmsInstructorAnalytics,
  lmsInstructorAddLecture,
  lmsInstructorCourses,
  lmsInstructorCreateCourse,
  lmsInstructorRevenue,
  lmsInstructorStudents,
  lmsInstructorSubmitCourse,
  lmsInstructorUpdateCourse,
  lmsLectureAccess,
  lmsListCoupons,
  lmsListCourses,
  lmsListReviews,
  lmsMyCertificates,
  lmsMyLearning,
  lmsOrders,
  lmsPurchases,
  lmsSaveProgress,
  lmsSearchCourses,
  lmsSectionLectures,
  lmsToggleWishlist,
  lmsValidateCoupon,
  lmsVerifyPayment,
  lmsWebhook,
} from "../controllers/lms.controller";

const lmsRouter = express.Router();

// Marketplace discovery (public)
lmsRouter.get("/courses", lmsListCourses);
lmsRouter.get("/categories", lmsCategories);
lmsRouter.get("/search", lmsSearchCourses);
lmsRouter.get("/home", lmsHome);
lmsRouter.get("/courses/:courseId", lmsGetCourse);
lmsRouter.get("/courses/:courseId/curriculum", lmsGetCurriculum);
lmsRouter.get("/courses/:courseId/sections", lmsGetSections);

// Sections (derived from courseData.videoSection grouping)
lmsRouter.get("/sections/:sectionId", lmsGetSection);
lmsRouter.get("/sections/:sectionId/lectures", lmsSectionLectures);

// Lectures (enrollment-gated inside controller)
lmsRouter.get("/lectures/:lectureId", isAuthenticated, lmsGetLecture);
lmsRouter.get(
  "/lectures/:lectureId/access",
  isAuthenticated,
  lmsLectureAccess
);
lmsRouter.post(
  "/lectures/:lectureId/progress",
  isAuthenticated,
  lmsSaveProgress
);
lmsRouter.post(
  "/lectures/:lectureId/complete",
  isAuthenticated,
  lmsCompleteLecture
);

// Purchase: Buy Now -> Checkout -> Payment -> Verify -> Order -> Enrollment
lmsRouter.get("/purchases", isAuthenticated, lmsPurchases);
lmsRouter.get("/orders", isAuthenticated, lmsOrders);
lmsRouter.get("/orders/:orderId", isAuthenticated, lmsGetOrder);
lmsRouter.post("/payments/create", isAuthenticated, lmsCreatePayment);
lmsRouter.post("/payments/verify", isAuthenticated, lmsVerifyPayment);
lmsRouter.post("/payments/webhook", express.raw({ type: "application/json" }), lmsWebhook);

// Enrollments + My Learning (primary learning model)
lmsRouter.get("/enrollments", isAuthenticated, lmsEnrollments);
lmsRouter.get(
  "/enrollments/:enrollmentId",
  isAuthenticated,
  lmsGetEnrollment
);
lmsRouter.get("/my-learning", isAuthenticated, lmsMyLearning);

// Wishlist (courses)
lmsRouter.get("/wishlist", isAuthenticated, lmsGetWishlist);
lmsRouter.post("/wishlist", isAuthenticated, lmsToggleWishlist);
lmsRouter.post("/wishlist/toggle", isAuthenticated, lmsToggleWishlist);

// Reviews (courses)
lmsRouter.get("/reviews/:courseId", lmsListReviews);
lmsRouter.get("/courses/:courseId/reviews", lmsListReviews);
lmsRouter.post(
  "/reviews/:courseId",
  isAuthenticated,
  lmsAddReview
);

// Coupons (courses)
lmsRouter.post("/coupons/validate", isAuthenticated, lmsValidateCoupon);
lmsRouter.post(
  "/coupons",
  isAuthenticated,
  authorizeRoles("admin"),
  lmsCreateCoupon
);
lmsRouter.get(
  "/coupons",
  isAuthenticated,
  authorizeRoles("admin"),
  lmsListCoupons
);

// Certificates
lmsRouter.get("/certificates", isAuthenticated, lmsMyCertificates);
lmsRouter.get(
  "/certificates/:certificateId",
  isAuthenticated,
  lmsGetCertificate
);

// Instructor marketplace
lmsRouter.get(
  "/instructor/courses",
  isAuthenticated,
  authorizeRoles("admin", "instructor"),
  lmsInstructorCourses
);
lmsRouter.post(
  "/instructor/courses",
  isAuthenticated,
  authorizeRoles("admin", "instructor"),
  lmsInstructorCreateCourse
);
lmsRouter.put(
  "/instructor/courses/:courseId",
  isAuthenticated,
  authorizeRoles("admin", "instructor"),
  lmsInstructorUpdateCourse
);
lmsRouter.post(
  "/instructor/courses/:courseId/lectures",
  isAuthenticated,
  authorizeRoles("admin", "instructor"),
  lmsInstructorAddLecture
);
lmsRouter.post(
  "/instructor/courses/:courseId/submit",
  isAuthenticated,
  authorizeRoles("admin", "instructor"),
  lmsInstructorSubmitCourse
);
lmsRouter.get(
  "/instructor/students",
  isAuthenticated,
  authorizeRoles("admin", "instructor"),
  lmsInstructorStudents
);
lmsRouter.get(
  "/instructor/revenue",
  isAuthenticated,
  authorizeRoles("admin", "instructor"),
  lmsInstructorRevenue
);
lmsRouter.get(
  "/instructor/analytics",
  isAuthenticated,
  authorizeRoles("admin", "instructor"),
  lmsInstructorAnalytics
);

// Admin marketplace
lmsRouter.get(
  "/admin/courses",
  isAuthenticated,
  authorizeRoles("admin"),
  lmsAdminCourses
);
lmsRouter.put(
  "/admin/courses/:courseId/status",
  isAuthenticated,
  authorizeRoles("admin"),
  lmsAdminReviewCourse
);
lmsRouter.get(
  "/admin/instructors",
  isAuthenticated,
  authorizeRoles("admin"),
  lmsAdminInstructors
);
lmsRouter.get(
  "/admin/orders",
  isAuthenticated,
  authorizeRoles("admin"),
  lmsAdminOrders
);
lmsRouter.get(
  "/admin/enrollments",
  isAuthenticated,
  authorizeRoles("admin"),
  lmsAdminEnrollments
);
lmsRouter.get(
  "/admin/analytics",
  isAuthenticated,
  authorizeRoles("admin"),
  lmsAdminAnalytics
);

export default lmsRouter;
