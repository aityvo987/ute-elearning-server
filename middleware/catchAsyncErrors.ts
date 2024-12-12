// Create catchAsyncErrors.ts file to catch the error asynchronously functions
// Since in controllers we will use a lots asynchronously functions

import { Request, Response, NextFunction } from 'express';

export const CatchAsyncError =
    (theFunc: any) => (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(theFunc(req, res, next).catch(next));
    };