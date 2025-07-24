import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../config/prisma";
import { ApiError } from "../utils/apiError";
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
} from "../utils/emailService";

export class AuthService {
  static async register(userData: {
    firstName: string;
    lastName: string;
    userName: string;
    email: string;
    password: string;
  }) {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: userData.email }, { userName: userData.userName }],
      },
    });

    if (existingUser) {
      throw new ApiError(
        409,
        "User with this email or username already exists"
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create user
    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        verificationToken,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userName: true,
        email: true,
        isVerified: true,
        dateJoined: true,
      },
    });

    // Send verification email
    await sendVerificationEmail(
      userData.email,
      verificationToken,
      userData.firstName
    );

    return user;
  }

  static async login(email: string, userName: string, password: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { userName }],
        isDeleted: false,
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new ApiError(401, "Invalid credentials");
    }

    if (!user.isVerified) {
      throw new ApiError(401, "Please verify your email address first");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const userResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      email: user.email,
      avatar: user.avatar,
      isVerified: user.isVerified,
      dateJoined: user.dateJoined,
    };

    return { user: userResponse, token };
  }

  static async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token, isDeleted: false },
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired verification token");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    return { message: "Email verified successfully" };
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email, isDeleted: false },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour TODO change this later

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    await sendResetPasswordEmail(email, resetToken, user.firstName);

    return { message: "Password reset email sent" };
  }

  static async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
        isDeleted: false,
      },
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: "Password reset successfully" };
  }
}
