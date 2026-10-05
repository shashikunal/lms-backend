"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const lms_controller_1 = require("../controllers/lms.controller");
const lmsRouter = express_1.default.Router();
// Marketplace discovery (public)
lmsRouter.get("/courses", lms_controller_1.lmsListCourses);
lmsRouter.get("/categories", lms_controller_1.lmsCategories);
lmsRouter.get("/search", lms_controller_1.lmsSearchCourses);
lmsRouter.get("/home", lms_controller_1.lmsHome);
lmsRouter.get("/courses/:courseId", lms_controller_1.lmsGetCourse);
lmsRouter.get("/courses/:courseId/curriculum", lms_controller_1.lmsGetCurriculum);
lmsRouter.get("/courses/:courseId/sections", lms_controller_1.lmsGetSections);
// Sections (derived from courseData.videoSection grouping)
lmsRouter.get("/sections/:sectionId", lms_controller_1.lmsGetSection);
lmsRouter.get("/sections/:sectionId/lectures", lms_controller_1.lmsSectionLectures);
// Lectures (enrollment-gated inside controller)
lmsRouter.get("/lectures/:lectureId", auth_1.isAuthenticated, lms_controller_1.lmsGetLecture);
lmsRouter.get("/lectures/:lectureId/access", auth_1.isAuthenticated, lms_controller_1.lmsLectureAccess);
lmsRouter.post("/lectures/:lectureId/progress", auth_1.isAuthenticated, lms_controller_1.lmsSaveProgress);
lmsRouter.post("/lectures/:lectureId/complete", auth_1.isAuthenticated, lms_controller_1.lmsCompleteLecture);
// Purchase: Buy Now -> Checkout -> Payment -> Verify -> Order -> Enrollment
lmsRouter.get("/purchases", auth_1.isAuthenticated, lms_controller_1.lmsPurchases);
lmsRouter.get("/orders", auth_1.isAuthenticated, lms_controller_1.lmsOrders);
lmsRouter.get("/orders/:orderId", auth_1.isAuthenticated, lms_controller_1.lmsGetOrder);
lmsRouter.post("/payments/create", auth_1.isAuthenticated, lms_controller_1.lmsCreatePayment);
lmsRouter.post("/payments/verify", auth_1.isAuthenticated, lms_controller_1.lmsVerifyPayment);
lmsRouter.post("/payments/webhook", express_1.default.raw({ type: "application/json" }), lms_controller_1.lmsWebhook);
lmsRouter.post("/payments/refund", auth_1.isAuthenticated, lms_controller_1.lmsRefundPayment);
// Enrollments + My Learning (primary learning model)
lmsRouter.get("/enrollments", auth_1.isAuthenticated, lms_controller_1.lmsEnrollments);
lmsRouter.get("/enrollments/:enrollmentId", auth_1.isAuthenticated, lms_controller_1.lmsGetEnrollment);
lmsRouter.get("/my-learning", auth_1.isAuthenticated, lms_controller_1.lmsMyLearning);
lmsRouter.get("/progress-analytics", auth_1.isAuthenticated, lms_controller_1.lmsUserProgressAnalytics);
lmsRouter.post("/courses/clone", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), lms_controller_1.lmsCloneCourse);
lmsRouter.post("/courses/bulk", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), lms_controller_1.lmsBulkCourseOperation);
// Wishlist (courses)
lmsRouter.get("/wishlist", auth_1.isAuthenticated, lms_controller_1.lmsGetWishlist);
lmsRouter.post("/wishlist", auth_1.isAuthenticated, lms_controller_1.lmsToggleWishlist);
lmsRouter.post("/wishlist/toggle", auth_1.isAuthenticated, lms_controller_1.lmsToggleWishlist);
lmsRouter.get("/cart", auth_1.isAuthenticated, lms_controller_1.lmsGetCart);
lmsRouter.post("/cart", auth_1.isAuthenticated, lms_controller_1.lmsAddToCart);
lmsRouter.delete("/cart", auth_1.isAuthenticated, lms_controller_1.lmsRemoveFromCart);
lmsRouter.delete("/cart/all", auth_1.isAuthenticated, lms_controller_1.lmsClearCart);
lmsRouter.post("/wishlist/move-to-cart", auth_1.isAuthenticated, lms_controller_1.lmsMoveWishlistToCart);
// Reviews (courses)
lmsRouter.get("/reviews/:courseId", lms_controller_1.lmsListReviews);
lmsRouter.get("/courses/:courseId/reviews", lms_controller_1.lmsListReviews);
lmsRouter.post("/reviews/:courseId", auth_1.isAuthenticated, lms_controller_1.lmsAddReview);
// Coupons (courses)
lmsRouter.post("/coupons/validate", auth_1.isAuthenticated, lms_controller_1.lmsValidateCoupon);
lmsRouter.post("/coupons", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), lms_controller_1.lmsCreateCoupon);
lmsRouter.get("/coupons", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), lms_controller_1.lmsListCoupons);
// Certificates
lmsRouter.get("/certificates", auth_1.isAuthenticated, lms_controller_1.lmsMyCertificates);
lmsRouter.get("/certificates/:certificateId", auth_1.isAuthenticated, lms_controller_1.lmsGetCertificate);
lmsRouter.get("/certificates/:certificateId/download", auth_1.isAuthenticated, lms_controller_1.lmsDownloadCertificate);
// Instructor marketplace
lmsRouter.get("/instructor/courses", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin", "instructor"), lms_controller_1.lmsInstructorCourses);
lmsRouter.post("/instructor/courses", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin", "instructor"), lms_controller_1.lmsInstructorCreateCourse);
lmsRouter.put("/instructor/courses/:courseId", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin", "instructor"), lms_controller_1.lmsInstructorUpdateCourse);
lmsRouter.post("/instructor/courses/:courseId/lectures", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin", "instructor"), lms_controller_1.lmsInstructorAddLecture);
lmsRouter.post("/instructor/courses/:courseId/submit", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin", "instructor"), lms_controller_1.lmsInstructorSubmitCourse);
lmsRouter.get("/instructor/students", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin", "instructor"), lms_controller_1.lmsInstructorStudents);
lmsRouter.get("/instructor/revenue", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin", "instructor"), lms_controller_1.lmsInstructorRevenue);
lmsRouter.get("/instructor/analytics", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin", "instructor"), lms_controller_1.lmsInstructorAnalytics);
// Admin marketplace
lmsRouter.get("/admin/courses", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), lms_controller_1.lmsAdminCourses);
lmsRouter.put("/admin/courses/:courseId/status", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), lms_controller_1.lmsAdminReviewCourse);
lmsRouter.get("/admin/instructors", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), lms_controller_1.lmsAdminInstructors);
lmsRouter.get("/admin/orders", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), lms_controller_1.lmsAdminOrders);
lmsRouter.get("/admin/enrollments", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), lms_controller_1.lmsAdminEnrollments);
lmsRouter.get("/admin/analytics", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), lms_controller_1.lmsAdminAnalytics);
lmsRouter.post("/categories", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), lms_controller_1.lmsCreateCategory);
lmsRouter.get("/categories", lms_controller_1.lmsGetCategories);
lmsRouter.get("/categories/all", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), lms_controller_1.lmsGetAllCategories);
lmsRouter.put("/categories/:categoryId", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), lms_controller_1.lmsUpdateCategory);
lmsRouter.delete("/categories/:categoryId", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), lms_controller_1.lmsDeleteCategory);
exports.default = lmsRouter;
//# sourceMappingURL=lms.routes.js.map