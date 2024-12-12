import { NextFunction, Request, Response } from "express";

import { CatchAsyncError } from "../middleware/catchAsyncErrors"

import ErrorHandler from "../utils/ErrorHandler";

import CourseModel from "../models/course.model";
import StudentAnswerModel from "../models/answer.model";
import NotificationModel from "../models/notification.model";
import { CheckCourseAvailability } from "./course.controller";
import { IUser } from "../models/user.model";

interface IEssayAnswer {
    questionId: string;
    answer: string;
}
interface IStudentAnswer {
    courseId:string;
    courseDataId:string;
    essayAnswers:IEssayAnswer[];
}

export const addQuizzAnswer = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId, courseDataId, essayAnswers }: IStudentAnswer = req.body;
        
        const user = req.user;
        if (!CheckCourseAvailability(user.courses, courseId)) {
            return next(new ErrorHandler("You have not paid for accessing this course", 404));
        }
        
        // Check if the user has already submitted an answer for the given courseId and courseDataId
        const existingAnswer = await StudentAnswerModel.findOne({
            user:user,
            courseId: courseId,
            courseDataId: courseDataId
        });

        if (existingAnswer) {
            return res.status(400).json({
                success: false,
                message: "You have already submitted an answer for this course section."
            });
        }

        const course = await CourseModel.findById(courseId);
        
        const courseContent = course?.courseData?.find((courseDataContent: any) => courseDataContent._id.toString() === courseDataId);

        if (!courseContent) {
            return next(new ErrorHandler("Course Content not found", 400));
        }

        const newEssayAnswers = essayAnswers.map((essayAnswer) => ({
            questionId: essayAnswer.questionId,
            answer: essayAnswer.answer,
        }));

        const newAnswer = {
            user: user,
            courseId: courseId,
            courseDataId: courseDataId,
            essayAnswers: newEssayAnswers,
        };

        const studentAnswer = await StudentAnswerModel.create(newAnswer);
        await NotificationModel.create({
            user: course?.lecturer,
            title: "New Submission",
            message: `You have a new submitted answer in ${courseContent.title}`,
        });

        res.status(200).json({
            success: true,
            studentAnswer,
        });
    } catch (error: any) {
        console.log("Error Submit Answer", error.message);
        return next(new ErrorHandler(error.message, 500));
    }
});

export const getQuizzAnswer = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId, courseDataId }: { courseId: string, courseDataId: string} = req.body;

        // Find and return the user's answer for the specified courseId and courseDataId
        const answers = await StudentAnswerModel.find({
            courseId: courseId,
            courseDataId: courseDataId
        });

        if (!answers) {
            return res.status(404).json({
                success: false,
                message: "Answer not found for the courseId, and courseDataId."
            });
        }

        res.status(200).json({
            success: true,
            answers
        });
    } catch (error: any) {
        console.log("Error getting answer", error.message);
        return next(new ErrorHandler(error.message, 500));
    }
});

export const evaluateQuizzAnswer = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId, courseDataId, user }: { courseId: string, courseDataId: string, user: IUser } = req.body;

        // Find and return the user's answer for the specified courseId and courseDataId
        const answer = await StudentAnswerModel.findOne({
            user: user,
            courseId: courseId,
            courseDataId: courseDataId
        });

        if (!answer) {
            return res.status(404).json({
                success: false,
                message: "Answer not found for the specified user, courseId, and courseDataId."
            });
        }

        res.status(200).json({
            success: true,
            answer
        });
    } catch (error: any) {
        console.log("Error getting answer", error.message);
        return next(new ErrorHandler(error.message, 500));
    }
});

export const deleteQuizzAnswer = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId, courseDataId, user }: { courseId: string, courseDataId: string, user: IUser } = req.body;

        // Find and delete the user's answer for the specified courseId and courseDataId
        const deletedAnswer = await StudentAnswerModel.findOneAndDelete({
            user:user,
            courseId: courseId,
            courseDataId: courseDataId
        });

        if (!deletedAnswer) {
            return res.status(404).json({
                success: false,
                message: "Answer not found for the specified user, Course ID , and Course Data Id."
            });
        }

        res.status(200).json({
            success: true,
            message: "Answer deleted successfully.",
            deletedAnswer
        });
    } catch (error: any) {
        console.log("Error deleting answer", error.message);
        return next(new ErrorHandler(error.message, 500));
    }
});