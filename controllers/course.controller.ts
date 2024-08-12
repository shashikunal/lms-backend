import { NextFunction, Request, Response } from "express";
import { CatchAsyncErrors } from "../middlewares/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse, getAllCoursesService } from "../services/course.service";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";

import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notificationModel";

//upload Course
export const uploadCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data?.thumbnail;
      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      createCourse(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//edit course
export const editCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data?.thumbnail;
      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(thumbnail.public_id);
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      const courseId = req.params.id;
      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        {
          $set: data,
        },
        {
          new: true,
        }
      );
      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get single course
export const getSingleCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const isCacheExits = await redis.get(courseId);

      if (isCacheExits) {
        const course = JSON.parse(isCacheExits);
        return res.status(200).json({
          success: true,
          course,
        });
      } else {
        const course = await CourseModel.findById(courseId).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );
        await redis.set(courseId, JSON.stringify(course), "EX", 604800); //7days expire
        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get all courses --with out purchasing
export const getAllCourses = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCacheExits = await redis.get("allCourses");
      if (isCacheExits) {
        const courses = JSON.parse(isCacheExits);
        return res.status(200).json({
          success: true,
          courses,
        });
      } else {
        const courses = await CourseModel.find().select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );
        await redis.set("allCourses", JSON.stringify(courses));
        res.status(201).json({
          success: true,
          courses,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get course content only for valid user
export const getCourseByUser = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;
      const courseExits = userCourseList.find(
        (course: any) => course._id === courseId
      );
      if (!courseExits) {
        return next(
          new ErrorHandler("You are not allowed to access this course", 403)
        );
      }
      const course = await CourseModel.findById(courseId);
      const content = course?.courseData;
      res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//add question in to course
interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestionData = req.body;
      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id ", 400));
      }
      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );
      if (!courseContent) {
        return next(new ErrorHandler("Invalid content id ", 400));
      }

      //create a new question object
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };

      //add this question to our course content
      courseContent.questions.push(newQuestion);

      //add notification to the question
      await NotificationModel.create({
        user: req?.user?._id,
        title: "new question added",
        message: `you have a new question in ${courseContent?.title}`,
      });
      //save the updated course
      await course?.save();
      res.status(201).json({
        success: true,
        message: "Question added successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//add answering questions
interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnswer = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IAddAnswerData =
        req.body;
      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id ", 400));
      }
      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );
      if (!courseContent) {
        return next(new ErrorHandler("Invalid content id ", 400));
      }
      const question = courseContent?.questions?.find((item: any) =>
        item._id.equals(questionId)
      );

      if (!question) {
        return next(new ErrorHandler("Invalid question id ", 400));
      }

      //create a new answer object
      const newAnswer: any = {
        user: req.user,
        answer,
      };
      //add this answer to our question
      question?.questionReplies?.push(newAnswer);
      await course?.save();
      if (req.user?._id === question.user?._id) {
        //create a notification
        await NotificationModel.create({
          user: req?.user?._id,
          title: "New Question Replay Received",
          message: `You have a new answer in ${courseContent.title}`,
        });
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title,
        };
        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-replay.ejs"),
          data
        );
        try {
          await sendMail({
            email: question?.user?.email,
            subject: "Question replay",
            template: "question-replay.ejs",
            data,
          });
        } catch (error: any) {
          return new ErrorHandler(error.message, 500);
        }
      }
      res.status(201).json({
        success: true,
        message: "Answer added successfully",
      });
    } catch (error: any) {
      return new ErrorHandler(error.message, 500);
    }
  }
);

//add review in course
interface IAddReviewData {
  rating: number;
  courseId: string;
  review: string;
}

export const addReview = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;
      //check if course exits in courseList
      const courseExits = userCourseList?.some(
        (course: any) => course._id.toString() === courseId
      );
      if (!courseExits) {
        return next(
          new ErrorHandler("You are not allowed to access this course", 403)
        );
      }
      const course: any = await CourseModel.findById(courseId);
      const { review, rating } = req.body as IAddReviewData;
      const reviewData = {
        user: req.user,
        comment: review,
        rating,
      };
      course?.reviews?.push(reviewData);
      let avg = 0;
      course?.reviews?.forEach((rev: any) => {
        avg += rev.rating;
      });
      if (course) {
        course.ratings = avg / course?.reviews?.length;
      }
      await course?.save();
      const notification = {
        title: "new review received",
        message: `${req.user?.name} has given a review in ${course?.name} on your course`,
      };
      //create notification
      res.status(200).json({
        success: true,
        message: "Review added successfully",
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//add replay in review
interface IAddReviewReplayData {
  comment: string;
  reviewId: string;
  courseId: string;
}
export const addReplayToReview = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    try {
      const { comment, reviewId, courseId } = req.body as IAddReviewReplayData;
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 400));
      }
      const review = course?.reviews?.find(
        (rev: any) => rev._id.toString() === reviewId
      );
      if (!review) {
        return next(new ErrorHandler("Review not found", 400));
      }
      const replayData: any = {
        user: req.user,
        comment,
      };
      if (!review.commentReplies) {
        review.commentReplies = [];
      }

      review?.commentReplies?.push(replayData);
      await course?.save();
      res.status(200).json({
        success: true,
        message: "Replay added successfully",
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get All courses
export const getAllCoursesDashboard = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//delete course by admin

export const deleteCourseByAdmin = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const course = await CourseModel.findById(id);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      await course.deleteOne({ id });
      await redis.del(id);

      res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
