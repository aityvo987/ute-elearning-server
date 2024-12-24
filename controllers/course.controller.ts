import { NextFunction, Request, Response } from "express";

import { CatchAsyncError } from "../middleware/catchAsyncErrors"

import ErrorHandler from "../utils/ErrorHandler";


import cloudinary from "cloudinary";
import { CreateCourse, getAllcoursesService, getCoursesByLecturerId } from "../services/course.service";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";

import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import userModel from "../models/user.model";


export const uploadCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses"
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }
        }
        CreateCourse(data, res, next);

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

export const editCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        const courseId = req.params.id;
        const courseData = await CourseModel.findById(courseId) as any;
        if (thumbnail && !thumbnail.startsWith("https")) {
            await cloudinary.v2.uploader.destroy(courseData.thumbnail.public_id);
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        if (thumbnail.startsWith("https")) {
            data.thumbnail = {
                public_id: courseData?.thumbnail.public_id,
                url: courseData?.thumbnail.url,
            };
        }
        const course = await CourseModel.findByIdAndUpdate(courseId, {
            $set: data
        }, { new: true });
        res.status(201).json({
            success: true,
            course,
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

export const getSingleCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const courseId = req.params.id;
        
        const isCacheExists = await redis.get(courseId);
        if (isCacheExists) {
            const course = JSON.parse(isCacheExists)
           
            res.status(200).json({
                success: true,
                course,
            });
        }
        else {
            const course = await CourseModel.findById(req.params.id).select(
                "-courseData.videoUrl -courseData.suggestion -courseData.question -courseData.links -courseData.quizzes"
            ).select("courseData");
            await redis.set(courseId, JSON.stringify(course), 'EX', 604800) //expired after 7 days
         
            res.status(200).json({
                success: true,
                course,
            });
        }


    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

export const getAllCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isCacheExists = await redis.get("allCourses");
        // if (isCacheExists) {
        //     const course = JSON.parse(isCacheExists)
        //     res.status(200).json({
        //         success: true,
        //         course,
        //     });
        // } else {
        const courses = await CourseModel.find().select(
            "-courseData.videoUrl -courseData.suggestion -courseData.question -courseData.links -courseData.quizzes" 
        ).select("courseData");

        // await redis.set("allCourses", JSON.stringify(courses));
        res.status(200).json({
            success: true,
            courses,
        });
        // }


    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});


export const getCourseContent = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userCourseList = req.user?.courses;
        const courseId = req.params.id;
        const courseExists = userCourseList?.find((course: any) => course._id.toString() === courseId);

        if (!courseExists) {
            return next(new ErrorHandler("You have not paid for full content of the course", 404));
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
});

interface IAddQuestionData {
    question: string;
    courseId: string;
    contentId: string;
}

export const addQuestion = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { question, courseId, contentId }: IAddQuestionData = req.body;
        const course = await CourseModel.findById(courseId);

        if (!mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid Content Id", 400));
        }
        const courseContent = course?.courseData?.find((item: any) => item._id.equals(contentId));

        if (!courseContent) {
            return next(new ErrorHandler("Empty Course Content", 400));
        }

        const newQuestion: any = {
            user: req.user,
            question,
            questionReplies: [],
        };

        courseContent.questions.push(newQuestion);

        await NotificationModel.create({
            userId: course?.lecturer._id,
            title: "New Question",
            message: `You have a new question in ${courseContent.title}`,
        });


        await course?.save();

        res.status(200).json({
            success: true,
            course,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

interface IAddAnswerData {
    answer: string;
    courseId: string;
    contentId: string;
    questionId: string;
}

export const addAnswer = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { answer, courseId, contentId, questionId }: IAddAnswerData = req.body;
        const course = await CourseModel.findById(courseId);

        if (!mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid Content Id", 400));
        }
        const courseContent = course?.courseData?.find((item: any) => item._id.equals(contentId));

        if (!courseContent) {
            return next(new ErrorHandler("Empty Course Content", 400));
        }

        const question = courseContent?.questions?.find((item: any) => item._id.equals(questionId));

        if (!question) {
            return next(new ErrorHandler("Empty Question Content", 400));
        }

        const newAnswer: any = {
            user: req.user,
            answer,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        question.questionReplies.push(newAnswer);

        await course?.save()

        if (req.user?._id === question.user._id) {
            await NotificationModel.create({
                userId: req.user?._id,
                title: "New Question Reply",
                message: `You have a new question reply in ${courseContent.title}`,
            });

        } else {
            const data = {
                name: question.user.name,
                title: courseContent.title,

            }
            const html = await ejs.renderFile(path.join(__dirname, "../mails/question-reply.ejs"), data);
            try {
            
                await sendMail({
                    email: question.user.email,
                    subject: "Question Reply",
                    template: "question-reply.ejs",
                    data,
                });
            } catch (error: any) {
                return next(new ErrorHandler(error.message, 500));
            }
        }
        res.status(200).json({
            success: true,
            course,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

interface IAddReviewData {
    review: string;
    rating: number;
}

export const addReview = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userCourseList = req.user?.courses;
        const courseId = req.params.id;
        const courseExists = userCourseList?.some((course: any) => course._id.toString() === courseId.toString());

        if (!courseExists) {
            return next(new ErrorHandler("You have not paid for full content of the course", 404));
        }

        const course = await CourseModel.findById(courseId);
        const { review, rating } = req.body as IAddReviewData;
        const reviewData: any = {
            user: req.user,
            comment: review,
            rating,
        }
        course?.reviews.push(reviewData)

        let total = 0;
        course?.reviews.forEach((rev: any) => {
            total += rev.rating;
        })
        if (course) {
            course.ratings = total / course?.reviews.length;
        }

        await course?.save();

        await redis.set(courseId, JSON.stringify(course), 'EX', 604800)

        if (course){
            if(course.lecturer){
                await NotificationModel.create({
                    user: course.lecturer._id,
                    title: "New Review Received",
                    message: `${req.user?.name} has given a review on your course: ${course?.name}`,
                });
            }
        }

        res.status(200).json({
            success: true,
            course,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

interface IAddReviewReplyData {
    comment: string;
    courseId: string;
    reviewId: string;
}

export const addReviewReply = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { comment, courseId, reviewId } = req.body as IAddReviewReplyData;
        const course = await CourseModel.findById(courseId);

        if (!course) {
            return next(new ErrorHandler("Course not Found", 404));
        }
        const review = course?.reviews?.find((rev: any) => rev._id.toString() === reviewId);
        if (!review) {
            return next(new ErrorHandler("Review not Found", 404));
        }
        const reviewReplyData: any = {
            user: req.user,
            comment,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        if (!review.commentReplies) {
            review.commentReplies = [];
        }
        review.commentReplies?.push(reviewReplyData);

        await course?.save();

        await redis.set(courseId, JSON.stringify(course), 'EX', 604800);

        res.status(200).json({
            success: true,
            course,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});
export const deleteCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const course = await CourseModel.findById(id);

        //wrong user id
        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }

        await course.deleteOne({ id });

        //delete id from redis
        await redis.del(id);

        res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});
export const getAdminAllCourses = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            getAllcoursesService(res);
        } catch (error: any) {

            return next(new ErrorHandler(error.message, 400));
        }
    }
);

export const getLecturerAllCourses = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const lecturer = req.user;
        try {
           
            getCoursesByLecturerId(res,lecturer._id);
        } catch (error: any) {

            return next(new ErrorHandler(error.message, 400));
        }
    }
);

export const updateProgress = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, courseId, progress } = req.body as { userId: string, courseId: string, progress: number };

        // Find the user by userId
        const user = await userModel.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }
     
        // Find the course in the user's courses
        const courseIndex = user.courses.findIndex((course: any) => course._id.toString() === courseId);
        if (courseIndex === -1) {
            return next(new ErrorHandler("Course not found in user's courses", 404));
        }

        // Update the progress for the course
        user.courses[courseIndex].progress = progress;

        // Save the updated user data
        await user.save();
        await redis.set(userId, JSON.stringify(user));

        res.status(200).json({ success: true, message: "Progress updated successfully" });

    } catch (err: any) {
        return next(new ErrorHandler(err.message, 500));
    }
});

export const CheckCourseAvailability = (userCourses: any, courseId: string): boolean => {
    return userCourses?.some((course: any) => course._id.toString() === courseId);
};