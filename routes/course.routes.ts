import express from "express";

import {
  addAnswer,
  addQuestion,
  addReplayToReview,
  addReview,
  deleteCourseByAdmin,
  editCourse,
  getAllCourses,
  getAllCoursesDashboard,
  getCourseByUser,
  getSingleCourse,
  uploadCourse,
} from "../controllers/course.controller";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
const courseRouter = express.Router();

courseRouter.post(
  "/create-course",
  isAuthenticated,
  authorizeRoles("admin"),
  uploadCourse
);
courseRouter.put(
  "/edit-course/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  editCourse
);

courseRouter.get("/get-course/:id", getSingleCourse);
courseRouter.get("/get-courses", getAllCourses);

courseRouter.get("/get-course-content/:id", isAuthenticated, getCourseByUser);

courseRouter.put("/add-question", isAuthenticated, addQuestion);
courseRouter.put("/add-answer", isAuthenticated, addAnswer);
courseRouter.put("/add-review/:id", isAuthenticated, addReview);
courseRouter.put(
  "/add-replay",
  isAuthenticated,
  authorizeRoles("admin"),
  addReplayToReview
);

courseRouter.get(
  "/get-all-course-dashboard",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllCoursesDashboard
);

courseRouter.delete(
  "/delete-course/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteCourseByAdmin
);
export default courseRouter;
