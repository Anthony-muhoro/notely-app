import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../services/auth.service";
import { ApiResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const user = await AuthService.register(req.body);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          user,
          "User registered successfully. Please check your email for verification."
        )
      );
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);

    res.status(200).json(new ApiResponse(200, result, "Login successful"));
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

    res
      .status(200)
      .json(new ApiResponse(200, result, "Password reset email sent"));
  });

  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;
    const result = await AuthService.resetPassword(token, password);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Password reset successful"));
  });

  static getProfile = asyncHandler(async (req: any, res: Response) => {
    res
      .status(200)
      .json(new ApiResponse(200, req.user, "Profile retrieved successfully"));
  });
}
