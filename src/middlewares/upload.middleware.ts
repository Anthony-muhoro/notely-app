import multer from "multer";
import { Request } from "express";
import { ApiError } from "../utils/apiError";

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only image files are allowed") as any, false);
  }
};

export const uploadImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10, // Maximum 10 files
  },
}).array("images", 10);
