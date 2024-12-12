"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLayoutByType = exports.editLayout = exports.createLayout = void 0;
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const layout_model_1 = __importDefault(require("../models/layout.model"));
const cloudinary_1 = __importDefault(require("cloudinary"));
exports.createLayout = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { type } = req.body;
        const isTypeExists = await layout_model_1.default.findOne({ type });
        if (isTypeExists) {
            return next(new ErrorHandler_1.default(`${type} was already created`, 400));
        }
        if (type === "Banner") {
            const { image, title, subtitle } = req.body;
            const myCloud = await cloudinary_1.default.v2.uploader.upload(image, {
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
            };
            await layout_model_1.default.create(banner);
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const faqItems = await Promise.all(faq.map(async (item) => {
                return {
                    question: item.question,
                    answer: item.answer,
                };
            }));
            await layout_model_1.default.create({ type: "FAQ", faq: faqItems });
        }
        if (type === "Categories") {
            const { categories } = req.body;
            const categoriesItems = await Promise.all(categories.map(async (item) => {
                return {
                    title: item.title,
                };
            }));
            await layout_model_1.default.create({ type: "Categories", categories: categoriesItems });
        }
        res.status(200).json({
            success: true,
            message: "Layout created successfully"
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.editLayout = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { type } = req.body;
        if (type === "Banner") {
            const existedBannerData = await layout_model_1.default.findOne({ type: "Banner" });
            const { image, title, subTitle } = req.body;
            if (existedBannerData) {
                await cloudinary_1.default.v2.uploader.destroy(existedBannerData?.banner.image.public_id);
            }
            const data = image.startsWith("https")
                ? existedBannerData
                : await cloudinary_1.default.v2.uploader.upload(image, {
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
            await layout_model_1.default.findByIdAndUpdate(existedBannerData._id, { banner });
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const existedFaqData = await layout_model_1.default.findOne({ type: "FAQ" });
            const faqItems = await Promise.all(faq.map(async (item) => {
                return {
                    question: item.question,
                    answer: item.answer,
                };
            }));
            await layout_model_1.default.findByIdAndUpdate(existedFaqData?._id, { type: "FAQ", faq: faqItems });
        }
        if (type === "Categories") {
            const { categories } = req.body;
            const existedCategoriesData = await layout_model_1.default.findOne({ type: "Categories" });
            const categoriesItems = await Promise.all(categories.map(async (item) => {
                if (item._id) {
                    return {
                        title: item.title,
                        _id: item._id,
                    };
                }
                return {
                    title: item.title,
                };
            }));
            await layout_model_1.default.findByIdAndUpdate(existedCategoriesData?._id, { type: "Categories", categories: categoriesItems });
        }
        res.status(200).json({
            success: true,
            message: "Layout updated successfully"
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.getLayoutByType = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { type } = req.params;
        console.log(type);
        const layout = await layout_model_1.default.findOne({ type });
        res.status(201).json({
            success: true,
            layout
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
