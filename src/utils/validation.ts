import { z, ZodError, ZodIssue } from "zod";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "./apiError";

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(
          (err: ZodIssue) =>
            `${err.path
              .map((p) => (typeof p === "symbol" ? p.toString() : p))
              .join(".")}: ${err.message}`
        );
        throw new ApiError(
          400,
          `Validation error: ${errorMessages.join(", ")}`
        );
      }
      next(error);
    }
  };
};
