import { Request } from "express";
import { User } from "@prisma/client";

export interface AuthenticatedRequest extends Request {
  user?: Omit<User, "password" | "verificationToken" | "resetToken">;
}

export interface JWTPayload {
  id: string;
  email: string;
}

export interface MulterRequest extends Request {
  files?: Express.Multer.File[];
}
