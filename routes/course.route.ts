import express from "express";
import { addAnswer, addQuestion, addReview, addReviewReply, editCourse, getAdminAllCourses, getAllCourse, getCourseContent, getLecturerAllCourses, getSingleCourse, updateProgress, uploadCourse } from "../controllers/course.controller";
import { authorizeRoles, isAutheticated } from "../middleware/auth";
import { deleteCourse } from "../controllers/course.controller";
import { addQuizzAnswer, getQuizzAnswer } from "../controllers/answer.controller";

const courseRouter = express.Router();

courseRouter.post("/create-course", isAutheticated, authorizeRoles("admin","lecturer"), uploadCourse);

courseRouter.put("/edit-course/:id", isAutheticated, authorizeRoles("admin","lecturer"), editCourse);

courseRouter.get("/get-course/:id", getSingleCourse);

courseRouter.get("/get-courses/", getAllCourse);

courseRouter.get("/get-course-content/:id",isAutheticated,getCourseContent);

courseRouter.post("/add-question",isAutheticated,addQuestion);

courseRouter.put("/update-progress",isAutheticated,updateProgress);

courseRouter.put("/add-answer",isAutheticated,addAnswer);

courseRouter.put("/add-review/:id",isAutheticated,addReview);

courseRouter.put("/add-review-reply",isAutheticated,authorizeRoles("admin","lecturer"),addReviewReply);
courseRouter.get("/get-course-content/:id", isAutheticated, getCourseContent);

courseRouter.get("/get-admin-courses", isAutheticated, authorizeRoles("admin"), getAdminAllCourses);

courseRouter.get("/get-lecturer-courses/", isAutheticated, authorizeRoles("lecturer"), getLecturerAllCourses);

courseRouter.delete('/delete-course/:id', isAutheticated, authorizeRoles("admin","lecturer"), deleteCourse);

courseRouter.post("/submit-essay-answer",isAutheticated,addQuizzAnswer);

courseRouter.get("/get-essay-answer/", isAutheticated, authorizeRoles("admin","lecturer"), getQuizzAnswer);

courseRouter.delete("/delete-essay-answer/", isAutheticated, authorizeRoles("admin","lecturer"), getQuizzAnswer);


export default courseRouter;