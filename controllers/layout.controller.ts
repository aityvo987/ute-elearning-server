import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import LayoutModel from "../models/layout.model";

import cloudinary from "cloudinary";
import layoutRouter from "../routes/layout.route";

export const createLayout = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.body;
        const isTypeExists = await LayoutModel.findOne({ type });
        if (isTypeExists) {
            return next(new ErrorHandler(`${type} was already created`, 400));
        }
        if (type === "Banner") {
            const { image, title, subtitle } = req.body;
            const myCloud = await cloudinary.v2.uploader.upload(image, {
                folder: "layout",
            });
            const banner = {
                type: "Banner",
                banner: {
                    image: {
                        public_id: myCloud.public_id,
                        url: myCloud.secure_url,
                    },
                    title,
                    subtitle,
                },
            }
            await LayoutModel.create(banner);
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const faqItems = await Promise.all(
                faq.map(async (item: any) => {
                    return {
                        question: item.question,
                        answer: item.answer,
                    };
                })
            )
            await LayoutModel.create({ type: "FAQ", faq: faqItems });

        }
        if (type === "Categories") {
            const { categories } = req.body;
            const categoriesItems = await Promise.all(
                categories.map(async (item: any) => {
                    return {
                        title: item.title,
                    };
                })
            )
            await LayoutModel.create({ type: "Categories", categories: categoriesItems });
        }
        res.status(200).json({
            success: true,
            message: "Layout created successfully"
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

export const editLayout = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.body;

        if (type === "Banner") {
            const existedBannerData: any = await LayoutModel.findOne({ type: "Banner" });
            const { image, title, subTitle } = req.body;
            if (existedBannerData) {
                await cloudinary.v2.uploader.destroy(existedBannerData?.banner.image.public_id);
            }
            const data = image.startsWith("https")
                ? existedBannerData
                : await cloudinary.v2.uploader.upload(image, {
                    folder: "layout",
                });
            const banner = {
                type: "Banner",
                image: {
                    public_id: image.startsWith("https")
                        ? existedBannerData.banner.image.public_id
                        : data?.public_id,
                    url: image.startsWith("https")
                        ? existedBannerData.banner.image.url
                        : data?.secure_url,
                },
                title,
                subTitle,
            };
            await LayoutModel.findByIdAndUpdate(existedBannerData._id, { banner });
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const existedFaqData = await LayoutModel.findOne({ type: "FAQ" });
            const faqItems = await Promise.all(
                faq.map(async (item: any) => {
                    return {
                        question: item.question,
                        answer: item.answer,
                    };
                })
            )
            await LayoutModel.findByIdAndUpdate(existedFaqData?._id, { type: "FAQ", faq: faqItems });

        }
        if (type === "Categories") {
            const { categories } = req.body;
            const existedCategoriesData = await LayoutModel.findOne({ type: "Categories" });
            const categoriesItems = await Promise.all(
                categories.map(async (item: any) => {
                    if (item._id) {
                        return {
                            title: item.title,
                            _id: item._id,
                        }
                    }
                    return {
                        title: item.title,
                    };
                })
            )
            await LayoutModel.findByIdAndUpdate(existedCategoriesData?._id, { type: "Categories", categories: categoriesItems });
        }
        res.status(200).json({
            success: true,
            message: "Layout updated successfully"
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

export const getLayoutByType = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.params;
        console.log(type);
        const layout = await LayoutModel.findOne({ type });
        res.status(201).json({
            success: true,
            layout
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})
