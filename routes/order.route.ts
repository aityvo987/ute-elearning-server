import express from "express";
import {
    addToCartGuest,
    addToCartUser,
    clearCartItemsUser,
    createCartOrder,
    createOrder,
    deleteCartItemGuest,
    deleteCartItemUser,
    fetchCartGuest,
    fetchCartUser,
    getAllOrders,
    newPayment,
    sendStripePublishableKey
} from "../controllers/order.controller";
import { authorizeRoles, isAutheticated } from "../middleware/auth";
import { updateAccessToken } from "../controllers/user.controller";

const orderRouter = express.Router();

orderRouter.post("/create-order", isAutheticated, createOrder);

orderRouter.post("/create-cart-order", isAutheticated, createCartOrder);

orderRouter.get("/get-orders", isAutheticated, authorizeRoles("admin"), getAllOrders);

orderRouter.get("/payment/stripepublishablekey", sendStripePublishableKey);

orderRouter.post("/payment", isAutheticated, newPayment);

orderRouter.post("/add-cart", addToCartGuest);

orderRouter.delete("/delete-cart/:id", deleteCartItemGuest);

orderRouter.get("/get-cart", fetchCartGuest);

orderRouter.post("/add-user-cart",isAutheticated, addToCartUser);

orderRouter.delete("/delete-user-cart/:id",isAutheticated, deleteCartItemUser);

orderRouter.delete("/clear-user-cart/",isAutheticated, clearCartItemsUser);

orderRouter.get("/get-user-cart",isAutheticated, fetchCartUser);

export default orderRouter;
