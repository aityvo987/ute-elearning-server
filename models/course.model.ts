import mongoose,{Document,Model,Schema} from "mongoose";
import { IUser, userSchema } from "./user.model";

export interface IComment extends Document{
    user:IUser,
    question:String;
    questionReplies:IComment[];
}


interface IReview extends Document{
    user:IUser,
    rating:number,
    comment:string,
    commentReplies?:IComment[];
}

interface ILink extends Document {
    title: string;
    url: string;
}
interface IQuizEssay extends Document {
    question: string;
}

interface IQuizMultipleChoice extends Document {
    question: string;
    options: string[];
    correctOptionIndex: number;
}

export interface ICourseData extends Document{
    title:string;
    description:string;
    videoUrl:string;
    videoThumbnail:object;
    videoSection:string;
    videoLength:number;
    videoPlayer:string;
    links:ILink[];
    suggestion:string;
    questions:IComment[];
    quizzes: {
        essayQuizzes: IQuizEssay[];
        multipleChoiceQuizzes: IQuizMultipleChoice[];
    };

}

export interface ICourse extends Document {
    name: string;
    description?: string;
    category:string;
    lecturer:IUser;
    price: number;
    estimatedPrice?: number;
    thumbnail: object;
    tags: string;
    level: string;
    demoUrl: string;
    benefits: { title: string }[];
    prerequisites: { title: string }[];
    reviews: IReview[];
    courseData: ICourseData[];
    ratings?: number;
    purchased?: number;
}

const reviewSchema = new Schema<IReview>({
    user: Object,
    rating: {
        type: Number,
        default: 0,
    },
    comment:String,
    commentReplies:[Object],
},{timestamps:true});

const linkSchema = new Schema<ILink>({
    title: String,
    url: String,
});

const commentSchema = new Schema<IComment>({
    user:Object,
    question:String,
    questionReplies:[Object],
},{timestamps:true});

const quizEssaySchemma = new Schema<IQuizEssay>({
    question:String,
});

const quizMultipleSchema = new Schema<IQuizMultipleChoice>({
    question: String,
    options: [String],
    correctOptionIndex:Number,
}); 

const courseDataSchema = new Schema<ICourseData>({
    videoUrl:String, 
    videoThumbnail:Object,
    title:String,
    videoSection:String,
    description:String,
    videoLength:Number,
    videoPlayer:String,
    links:[linkSchema],
    suggestion:String,
    questions:[commentSchema],
    quizzes: {
        essayQuizzes: [quizEssaySchemma],
        multipleChoiceQuizzes: [quizMultipleSchema],
    },
});

const courseSchema = new Schema<ICourse>({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category:{
        type:String,
        required:true,
    },
    lecturer:{
        type:Object,
        required:true,
    },
    price: {
        type: Number,
        required: true,
    },
    estimatedPrice: {
        type: Number,
        required: false,
    },
    thumbnail: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        },
    },
    tags: {
        type: String,
        required: true,
    },
    level: {
        type: String,
        required: true,
    },
    demoUrl: {
        type: String,
        required: true,
    },
    benefits: [{ title: String }],
    prerequisites: [{ title: String }],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    ratings: {
        type: Number,
        default: 0
    },
    purchased: {
        type: Number,
        default: 0
    }
},{ timestamps: true });


const CourseModel: Model<ICourse>= mongoose.model("course",courseSchema);


export default CourseModel;