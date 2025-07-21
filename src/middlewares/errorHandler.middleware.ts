import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { Prisma } from "@prisma/client";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err } as any;
  error.message = err.message;

  // Log error
  console.error(err);

  // Prisma validation error
  if (err instanceof Prisma.PrismaClientValidationError) {
    const message = "Invalid data provided";
    error = new ApiError(400, message);
  }

  // Prisma known request error
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    let message = "Database error";
    let statusCode = 400;

    switch (err.code) {
      case "P2002":
        message = `Duplicate field value entered for ${err.meta?.target}`;
        statusCode = 409;
        break;
      case "P2025":
        message = "Record not found";
        statusCode = 404;
        break;
      case "P2003":
        message = "Invalid input data";
        statusCode = 400;
        break;
      default:
        message = "Database operation failed";
        statusCode = 500;
    }

    error = new ApiError(statusCode, message);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = new ApiError(401, message);
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = new ApiError(401, message);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
