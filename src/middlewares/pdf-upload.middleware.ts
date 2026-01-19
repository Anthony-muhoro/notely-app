import multer from "multer";
import { Request } from "express";
import { ApiError } from "../utils/apiError";

const storage = multer.memoryStorage();
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only PDF files are allowed") as any, false);
  }
};

export const uploadPdf = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
}).single("pdf");
