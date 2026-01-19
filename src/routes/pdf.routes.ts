import { Router } from "express";
import { PdfController } from "../controllers/pdf.controller";
import { protect } from "../middlewares/auth.middleware";
import { uploadPdf } from "../middlewares/pdf-upload.middleware";

const PdfRouter = Router();

// VAPI webhook endpoint (no auth required, uses webhook secret)
PdfRouter.post("/analyze-images", PdfController.analyzeImages);

// All other routes require authentication
PdfRouter.use(protect);

PdfRouter.post("/upload", uploadPdf, PdfController.uploadPdf);
PdfRouter.get("/", PdfController.getUserPdfs);
PdfRouter.get("/:id", PdfController.getPdf);
PdfRouter.get("/:id/chat/history", PdfController.getChatHistory);
PdfRouter.post("/:id/chat", PdfController.chatWithPdf);
PdfRouter.delete("/:id", PdfController.deletePdf);

export default PdfRouter;
