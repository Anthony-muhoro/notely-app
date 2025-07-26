import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../services/auth.service";
import { ApiResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  registerSchema,
  resetPasswordSchema,
} from "../../validations/auth.validations";

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse({ body: req.body });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return res.status(400).json(new ApiResponse(400, null, firstError));
    }
    const result = await AuthService.register(parsed.data.body);

    if (!result.success) {
      return res.status(400).json(new ApiResponse(400, null, result.message));
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          result.data,
          "User registered successfully. Please check your email for verification."
        )
      );
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, userName, password } = req.body;
    const result = await AuthService.login(email, userName, password);

    if (!result.success) {
      return res.status(401).json(new ApiResponse(401, null, result.message));
    }

    res.status(200).json(new ApiResponse(200, result.data, "Login successful"));
  });

  static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    const result = await AuthService.verifyEmail(token);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Email verified successfully"));
  });

  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await AuthService.forgotPassword(email);
    if (!result.success) {
      return res.status(401).json(new ApiResponse(401, null, result.message));
    }

    res
      .status(200)
      .json(new ApiResponse(200, result, "Password reset email sent"));
  });

  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const parsed = resetPasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            parsed.error.issues[0]?.message || "Invalid input"
          )
        );
    }

    const { token, password } = parsed.data;

    const result = await AuthService.resetPassword(token, password);

    if (!result.success) {
      return res.status(400).json(new ApiResponse(400, null, result.message));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password reset successfully"));
  });

  static getProfile = asyncHandler(async (req: any, res: Response) => {
    res
      .status(200)
      .json(new ApiResponse(200, req.user, "Profile retrieved successfully"));
  });
}
