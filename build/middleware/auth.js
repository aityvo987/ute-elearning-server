"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.isAutheticated = void 0;
const catchAsyncErrors_1 = require("./catchAsyncErrors");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_1 = require("../utils/redis");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const user_controller_1 = require("../controllers/user.controller");
//authenticated user
exports.isAutheticated = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    const access_token = req.cookies.access_token;
    const refresh_token = req.cookies.refresh_token;
    //check access_token cookie global variable is exists
    if (!access_token) {
        if (!refresh_token) {
            return next(new ErrorHandler_1.default("Please login to access this page!", 400));
        }
        else {
            const decoded = jsonwebtoken_1.default.decode(refresh_token);
            //access token validation
            if (!decoded) {
                return next(new ErrorHandler_1.default("Please login to access this page!", 400));
            }
            //check if refresh token is expired
            if (decoded.exp && decoded.exp <= Date.now() / 1000) {
                return next(new ErrorHandler_1.default("Please login to access this page!", 400));
            }
            try {
                await (0, user_controller_1.updateAccessToken)(req, res, next);
            }
            catch (error) {
                return next(error);
            }
        }
    }
    else {
        const decoded = jsonwebtoken_1.default.decode(access_token);
        const user = await redis_1.redis.get(decoded.id);
        if (!user) {
            return next(new ErrorHandler_1.default("Please login to access this resources", 400));
        }
        req.user = JSON.parse(user);
        next();
    }
});
//authorized user: validate user role
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role || '')) {
            return next(new ErrorHandler_1.default(`Role: ${req.user?.role} is not allowed to access this page`, 403));
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
