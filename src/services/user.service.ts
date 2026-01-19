import imagekit from "../config/imagekit";
import prisma from "../config/prisma";
import { ApiError } from "../utils/apiError";
import bcrypt from "bcryptjs";

export class userService {
  static async updateProfile(
    userId: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      userName?: string;
    }
  ) {
    // Check if username is being updated and if it already exists
    if (updateData.userName) {
      const existingUser = await prisma.user.findFirst({
        where: {
          userName: updateData.userName,
          id: { not: userId },
          isDeleted: false,
        },
      });

      if (existingUser) {
        throw new ApiError(409, "Username already exists");
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userName: true,
        email: true,
        avatar: true,
        isVerified: true,
        dateJoined: true,
        lastUpdated: true,
      },
    });

    return updatedUser;
  }

  static async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return { message: "current password is incorrect" };
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: "Password updated successfully" };
  }

  static async changeProfileImage(userId: string, image: Express.Multer.File) {
    if (!image) {
      return { message: "No image file provided" };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { message: "User not found" };
    }

    if (user.avatar) {
      try {
        await imagekit.deleteFile(user.avatar);
      } catch (error) {
        console.error("Failed to delete old avatar from ImageKit", error);
      }
    }

    const result = await imagekit.upload({
      file: image.buffer,
      fileName: `avatar_${userId}_${Date.now()}`,
      folder: "/avatars",
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        avatar: result.url,
      },
      select: {
        id: true,
        avatar: true,
        firstName: true,
        lastName: true,
        userName: true,
        email: true,
      },
    });

    return updatedUser;
  }
}
