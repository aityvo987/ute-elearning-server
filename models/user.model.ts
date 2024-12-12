require('dotenv').config();
import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs"; //For hashing passwords
import { timeStamp } from "console";
import jwt from "jsonwebtoken";

//RegExp-REgular Expression(Biểu thức chính quy):ktra định dạng email
const emailRegexPattern: RegExp = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;


export interface CartItem extends Document {
    courseId: string;
    name: string;
    thumbnail:object;
    price: number;
    estimatedPrice?: number;
}
const cartSchema: Schema<CartItem> = new Schema({
    courseId: String,
    name: String,
    thumbnail:Object,
    price: Number,
    estimatedPrice: Number,
}, {});

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    avatar: {
        public_id: string; //Cloudinary neeeded
        url: string;
    },
    role: string;
    isVerified: boolean;
    courses: Array<{
        courseId: string;
        progress: number; // Add progress field for each course section
    }>;
    cart:CartItem[];
    comparePassword(password: string): Promise<boolean>;
    SignAccessToken: () => string;
    SignRefreshToken: () => string;
};

export const userSchema: Schema<IUser> = new Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        validate: {
            validator: function (value: string) {
                return emailRegexPattern.test(value);
            },
            message: "Please enter a valid email address",
        },
        unique: true,
    },
    password: {
        type: String,
        minlength: [6, "Password must be at least 6 characters"],
        select: false,
    },
    //object avatars
    avatar: {
        public_id: String,
        url: String,
    },
    role: {
        type: String,
        default: "user",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    //fetch course which user has already purchase by course id==> selling course platform  
    courses: [
        {
            courseId: String,
            progress: {
                type: Number,
                default: 0, // Set default progress to 0
            },
        },
    ],
    cart:[cartSchema],
    // create 2 fields createdAt & updatedAt fields
}, { timestamps: true });

// Hash password before saving

userSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// sign access token
userSchema.methods.SignAccessToken = function () {
    return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || '', {
        expiresIn: "5m",
    });
}

// sign refresh token
userSchema.methods.SignRefreshToken = function () {
    return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || '', {
        expiresIn: "3d",
    });
}

//compared password 
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> = mongoose.model("User", userSchema);

export default userModel;