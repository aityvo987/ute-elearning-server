import express from 'express';
import {
    activateUser,
    registrationUser,
    loginUser,
    logoutUser,
    
    getUserInfo,
    socialAuth,
    upateUserInfo,
    updatePassword,
    updateAvatar,
    getAllUsers,
    updateUserRole,
    deleteUser,
    updateAccessToken,
    forgetPassword,
    recoveryPassword,
} from '../controllers/user.controller';

import { authorizeRoles, isAutheticated } from '../middleware/auth';

const userRouter = express.Router();

//navigation 
userRouter.post('/registration', registrationUser);

userRouter.post('/activate-user', activateUser);

userRouter.post('/forget-password', forgetPassword);

userRouter.post('/recovery-password', recoveryPassword);

userRouter.post('/login', loginUser);

userRouter.get('/logout', isAutheticated, logoutUser);

userRouter.get('/refresh', updateAccessToken);

userRouter.get('/user', isAutheticated, getUserInfo);

userRouter.post('/social-auth', socialAuth);

userRouter.put('/update-user-info', isAutheticated, upateUserInfo);

userRouter.put('/update-user-password', isAutheticated, updatePassword);

userRouter.put('/update-user-avatar', isAutheticated, updateAvatar);

userRouter.get('/get-users', isAutheticated, authorizeRoles("admin"), getAllUsers);

userRouter.put('/update-user-role', isAutheticated,authorizeRoles("admin"), updateUserRole);

userRouter.delete('/delete-user/:id', isAutheticated,authorizeRoles("admin"), deleteUser);


export default userRouter;
