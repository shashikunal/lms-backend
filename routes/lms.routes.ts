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
  lmsRefundPayment,
  lmsCreateCategory,
  lmsGetCategories,
  lmsGetAllCategories,
  lmsUpdateCategory,
  lmsDeleteCategory,
  lmsUserProgressAnalytics,
  lmsCloneCourse,
  lmsDownloadCertificate,
  lmsBulkCourseOperation,
  lmsGetCart,
  lmsAddToCart,
  lmsRemoveFromCart,
  lmsClearCart,
  lmsMoveWishlistToCart,
  lmsBulkCouponOperation,
  lmsExportEnrollments,
  lmsSetEnrollmentExpiry,
  lmsBulkSetEnrollmentExpiry,
  lmsSetCourseSale,
  lmsClearCourseSale,
  lmsGetActiveSales,
  lmsVoteReview,
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
lmsRouter.post("/payments/refund", isAuthenticated, lmsRefundPayment);

// Enrollments + My Learning (primary learning model)
lmsRouter.get("/enrollments", isAuthenticated, lmsEnrollments);
lmsRouter.get(
  "/enrollments/:enrollmentId",
  isAuthenticated,
  lmsGetEnrollment
);
lmsRouter.get("/my-learning", isAuthenticated, lmsMyLearning);
lmsRouter.get("/progress-analytics", isAuthenticated, lmsUserProgressAnalytics);
lmsRouter.post("/courses/clone", isAuthenticated, authorizeRoles("admin"), lmsCloneCourse);
lmsRouter.post("/courses/bulk", isAuthenticated, authorizeRoles("admin"), lmsBulkCourseOperation);

// Wishlist (courses)
lmsRouter.get("/wishlist", isAuthenticated, lmsGetWishlist);
lmsRouter.post("/wishlist", isAuthenticated, lmsToggleWishlist);
lmsRouter.post("/wishlist/toggle", isAuthenticated, lmsToggleWishlist);

lmsRouter.get("/cart", isAuthenticated, lmsGetCart);
lmsRouter.post("/cart", isAuthenticated, lmsAddToCart);
lmsRouter.delete("/cart", isAuthenticated, lmsRemoveFromCart);
lmsRouter.delete("/cart/all", isAuthenticated, lmsClearCart);
lmsRouter.post("/wishlist/move-to-cart", isAuthenticated, lmsMoveWishlistToCart);

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
lmsRouter.post("/coupons/bulk", isAuthenticated, authorizeRoles("admin"), lmsBulkCouponOperation);
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
lmsRouter.get(
  "/certificates/:certificateId/download",
  isAuthenticated,
  lmsDownloadCertificate
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
  "/admin/enrollments/export",
  isAuthenticated,
  authorizeRoles("admin"),
  lmsExportEnrollments
);
lmsRouter.put(
  "/admin/enrollments/expiry",
  isAuthenticated,
  authorizeRoles("admin"),
  lmsSetEnrollmentExpiry
);
lmsRouter.put(
  "/admin/enrollments/expiry/bulk",
  isAuthenticated,
  authorizeRoles("admin"),
  lmsBulkSetEnrollmentExpiry
);
lmsRouter.put(
  "/courses/sale",
  isAuthenticated,
  authorizeRoles("admin"),
  lmsSetCourseSale
);
lmsRouter.delete(
  "/courses/sale",
  isAuthenticated,
  authorizeRoles("admin"),
  lmsClearCourseSale
);
lmsRouter.get("/sales", lmsGetActiveSales);
lmsRouter.post("/reviews/vote", isAuthenticated, lmsVoteReview);
lmsRouter.get(
  "/admin/analytics",
  isAuthenticated,
  authorizeRoles("admin"),
  lmsAdminAnalytics
);

lmsRouter.post(
  "/categories",
  isAuthenticated,
  authorizeRoles("admin"),
  lmsCreateCategory
);
lmsRouter.get("/categories", lmsGetCategories);
lmsRouter.get(
  "/categories/all",
  isAuthenticated,
  authorizeRoles("admin"),
  lmsGetAllCategories
);
lmsRouter.put(
  "/categories/:categoryId",
  isAuthenticated,
  authorizeRoles("admin"),
  lmsUpdateCategory
);
lmsRouter.delete(
  "/categories/:categoryId",
  isAuthenticated,
  authorizeRoles("admin"),
  lmsDeleteCategory
);

export default lmsRouter;
