"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoursesByLecturerId = exports.getAllcoursesService = exports.CreateCourse = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const course_model_1 = __importDefault(require("../models/course.model"));
exports.CreateCourse = (0, catchAsyncErrors_1.CatchAsyncError)(async (data, res) => {
    const course = await course_model_1.default.create(data);
    res.status(201).json({
        success: true,
        course
    });
});
//Get all courses
const getAllcoursesService = async (res) => {
    const courses = await course_model_1.default.find().sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        courses,
    });
};
exports.getAllcoursesService = getAllcoursesService;
const getCoursesByLecturerId = async (res, lecturerId) => {
    try {
        const courses = await course_model_1.default.find({ 'lecturer._id': lecturerId }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            courses,
        });
    }
    catch (error) {
        console.error("Error fetching courses by lecturer ID:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching courses by lecturer ID.",
        });
    }
};
exports.getCoursesByLecturerId = getCoursesByLecturerId;
