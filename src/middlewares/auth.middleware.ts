import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest, JWTPayload } from "../types";

export const protect = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new ApiError(401, "Not authorized, no token provided");
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          userName: true,
          email: true,
          avatar: true,
          isVerified: true,
          isDeleted: true,
          dateJoined: true,
          lastUpdated: true,
          resetTokenExpiry: true,
        },
      });

      if (!user || user.isDeleted) {
        throw new ApiError(401, "User not found or account deleted");
      }

      if (!user.isVerified) {
        throw new ApiError(401, "Please verify your email address first");
      }

      req.user = user;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(401, "Invalid token");
      }
      throw error;
    }
  }
);
