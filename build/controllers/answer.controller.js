"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQuizzAnswer = exports.evaluateQuizzAnswer = exports.getQuizzAnswer = exports.addQuizzAnswer = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const course_model_1 = __importDefault(require("../models/course.model"));
const answer_model_1 = __importDefault(require("../models/answer.model"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const course_controller_1 = require("./course.controller");
exports.addQuizzAnswer = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { courseId, courseDataId, essayAnswers } = req.body;
        const user = req.user;
        if (!(0, course_controller_1.CheckCourseAvailability)(user.courses, courseId)) {
            return next(new ErrorHandler_1.default("You have not paid for accessing this course", 404));
        }
        // Check if the user has already submitted an answer for the given courseId and courseDataId
        const existingAnswer = await answer_model_1.default.findOne({
            user: user,
            courseId: courseId,
            courseDataId: courseDataId
        });
        if (existingAnswer) {
            return res.status(400).json({
                success: false,
                message: "You have already submitted an answer for this course section."
            });
        }
        const course = await course_model_1.default.findById(courseId);
        const courseContent = course?.courseData?.find((courseDataContent) => courseDataContent._id.toString() === courseDataId);
        if (!courseContent) {
            return next(new ErrorHandler_1.default("Course Content not found", 400));
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
        const studentAnswer = await answer_model_1.default.create(newAnswer);
        await notification_model_1.default.create({
            userId: course?.lecturer,
            title: "New Submission",
            message: `You have a new submitted answer in ${courseContent.title}`,
        });
        res.status(200).json({
            success: true,
            studentAnswer,
        });
    }
    catch (error) {
        console.log("Error Submit Answer", error.message);
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.getQuizzAnswer = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { courseId, courseDataId } = req.body;
        // Find and return the user's answer for the specified courseId and courseDataId
        const answers = await answer_model_1.default.find({
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
    }
    catch (error) {
        console.log("Error getting answer", error.message);
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.evaluateQuizzAnswer = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { courseId, courseDataId, user } = req.body;
        // Find and return the user's answer for the specified courseId and courseDataId
        const answer = await answer_model_1.default.findOne({
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
    }
    catch (error) {
        console.log("Error getting answer", error.message);
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.deleteQuizzAnswer = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { courseId, courseDataId, user } = req.body;
        // Find and delete the user's answer for the specified courseId and courseDataId
        const deletedAnswer = await answer_model_1.default.findOneAndDelete({
            user: user,
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
    }
    catch (error) {
        console.log("Error deleting answer", error.message);
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
