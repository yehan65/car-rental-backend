const express = require("express");

const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");

const userRouter = express.Router();

userRouter.get("/me", authMiddleware, userController.httpGetMe);
userRouter.post("/new", userController.httpNewUser);
userRouter.post("/login", userController.httpLogin);
userRouter.post(
  "/resend-verification",
  authMiddleware,
  userController.httpRequestNewLink,
);
userRouter.post(
  "/forgot-password",
  authMiddleware,
  userController.httpForgotPassword,
);
userRouter.put("/update/me", authMiddleware, userController.httpUpdateUser);
userRouter.put(
  "/update/password",
  authMiddleware,
  userController.httpChangePassword,
);
userRouter.put("/verify-email", authMiddleware, userController.httpVerifyEmail);
userRouter.put(
  "/reset-password/:token",
  authMiddleware,
  userController.httpResetPassword,
);

module.exports = userRouter;
