import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser, userSchema } from "./user.model";
import { ICourseData } from "./course.model";

export interface IStudentEssayAnswer extends Document {
    questionId:string;
    answer: string;
}


export interface IStudentAnswer extends Document {
    user: IUser;
    courseId:String;
    courseDataId: String;
    essayAnswers?: [IStudentEssayAnswer];
}

const studentEssayAnswerSchema = new Schema<IStudentEssayAnswer>({
    questionId:String,
    answer: String,
});


const studentAnswerSchema = new Schema<IStudentAnswer>({
    user: Object,
    courseId:String,
    courseDataId: String,
    essayAnswers: [studentEssayAnswerSchema],
}, { timestamps: true });

const StudentAnswerModel: Model<IStudentAnswer> = mongoose.model("student_answer", studentAnswerSchema);

export default StudentAnswerModel;