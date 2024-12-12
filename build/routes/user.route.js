"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middleware/auth");
const userRouter = express_1.default.Router();
//navigation 
userRouter.post('/registration', user_controller_1.registrationUser);
userRouter.post('/activate-user', user_controller_1.activateUser);
userRouter.post('/forget-password', user_controller_1.forgetPassword);
userRouter.post('/recovery-password', user_controller_1.recoveryPassword);
userRouter.post('/login', user_controller_1.loginUser);
userRouter.get('/logout', auth_1.isAutheticated, user_controller_1.logoutUser);
userRouter.get('/refresh', user_controller_1.updateAccessToken);
userRouter.get('/user', auth_1.isAutheticated, user_controller_1.getUserInfo);
userRouter.post('/social-auth', user_controller_1.socialAuth);
userRouter.put('/update-user-info', auth_1.isAutheticated, user_controller_1.upateUserInfo);
userRouter.put('/update-user-password', auth_1.isAutheticated, user_controller_1.updatePassword);
userRouter.put('/update-user-avatar', auth_1.isAutheticated, user_controller_1.updateAvatar);
userRouter.get('/get-users', auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), user_controller_1.getAllUsers);
userRouter.put('/update-user-role', auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), user_controller_1.updateUserRole);
userRouter.delete('/delete-user/:id', auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), user_controller_1.deleteUser);
exports.default = userRouter;
