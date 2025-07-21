import { Router } from "express";
import { AuthController } from "../controllers/AuthController/auth.controller";
import { validate } from "../utils/validation";
import { protect } from "../middlewares/auth.middleware";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../validations/auth.validations";

const AuthRouter = Router();

AuthRouter.post("/register", validate(registerSchema), AuthController.register);
AuthRouter.post("/login", validate(loginSchema), AuthController.login);
AuthRouter.post(
  "/verify-email",
  validate(verifyEmailSchema),
  AuthController.verifyEmail
);
AuthRouter.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  AuthController.forgotPassword
);
AuthRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  AuthController.resetPassword
);
AuthRouter.get("/profile", protect, AuthController.getProfile);

export default AuthRouter;
