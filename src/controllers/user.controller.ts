import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { userService } from "../services/user.service";
import { AuthenticatedRequest } from "../types";
import { changePasswordSchema } from "../validations/auth.validations";

export class UserController {
  static updateProfileDetails = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const updateData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        userName: req.body.userName,
      };

      const updated = await userService.updateProfile(userId, updateData);
      res.status(200).json({ message: "Profile updated", user: updated });
    }
  );

  static changePassword = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || "Invalid input";
        return res.status(400).json({ message: firstError });
      }

      const { currentPassword, newPassword } = parsed.data;

      const result = await userService.updatePassword(
        userId,
        currentPassword,
        newPassword
      );

      res.status(200).json(result);
    }
  );

  static changeProfileImage = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await userService.changeProfileImage(userId, file);

    if ("message" in result) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  };
}
