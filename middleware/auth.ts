import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "./catchAsyncErrors";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../utils/redis";
import ErrorHandler from "../utils/ErrorHandler";
import { updateAccessToken } from "../controllers/user.controller";



//authenticated user
export const isAutheticated = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {

    const access_token = req.cookies.access_token as string;
    const refresh_token = req.cookies.refresh_token as string;
    //check access_token cookie global variable is exists
    if (!access_token) {
        if (!refresh_token) {
            return next(new ErrorHandler("Please login to access this page!", 400));
        }
        else {
            const decoded = jwt.decode(refresh_token) as JwtPayload;

            //access token validation
            if (!decoded) {
                return next(new ErrorHandler("Please login to access this page!", 400));
            }
            //check if refresh token is expired

            if (decoded.exp && decoded.exp <= Date.now() / 1000) {

                return next(new ErrorHandler("Please login to access this page!", 400));

            }
            try {
                await updateAccessToken(req, res, next);
            } catch (error) {
                return next(error);
            }
        }
    }

    else {
        const decoded = jwt.decode(access_token) as JwtPayload;
        const user = await redis.get(decoded.id);

        if (!user) {
            return next(new ErrorHandler("Please login to access this resources", 400));
        }

        req.user = JSON.parse(user);

        next();
    }

});

//authorized user: validate user role
export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role || '')) {
            return next(new ErrorHandler(`Role: ${req.user?.role} is not allowed to access this page`, 403));
        }
        next();
    }
}