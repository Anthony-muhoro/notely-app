import { Response } from "express";
import { PdfService } from "../services/pdf.service";
import { PdfChatService } from "../services/pdf-chat.service";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../types";

type PdfRequest = AuthenticatedRequest & {
  file?: Express.Multer.File;
};

export class PdfController {
  /**
   * Upload PDF document
   */
  static uploadPdf = asyncHandler(
    async (req: PdfRequest, res: Response) => {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "PDF file is required",
        });
      }

      const result = await PdfService.uploadPdf(req.user!.id, req.file);

      res
        .status(201)
        .json(
          new ApiResponse(201, result, "PDF uploaded and processed successfully")
        );
    }
  );

  /**
   * Get PDF by ID with chat session
   * Returns PDF with pre-analyzed images (already processed by Gemini during upload)
   */
  static getPdf = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const pdf = await PdfService.getPdfById(id, req.user!.id);

      // PDF already has imageUrls and imageAnalysis from upload
      // No need to re-extract or re-analyze - use stored data
      const pdfWithAnalysis = {
        ...pdf,
        imageUrls: pdf.imageUrls || [],
        imageAnalysis: pdf.imageAnalysis || null,
      };

      res.status(200).json(new ApiResponse(200, pdfWithAnalysis, "PDF retrieved successfully"));
    }
  );

  /**
   * Get all user PDFs
   */
  static getUserPdfs = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const pdfs = await PdfService.getUserPdfs(req.user!.id);

      res
        .status(200)
        .json(new ApiResponse(200, pdfs, "PDFs retrieved successfully"));
    }
  );

  /**
   * Chat with PDF (streaming)
   */
  static chatWithPdf = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const { message } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: "Message is required",
        });
      }

      console.log("=== PDF CHAT REQUEST ===");
      console.log("PDF ID:", id);
      console.log("User ID:", req.user!.id);
      console.log("Message:", message);

      // Set up SSE headers for streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullResponse = "";
      let chunkSentCount = 0;

      try {
        console.log("Starting chat with PDF service...");
        await PdfChatService.chatWithPdf(
          id,
          req.user!.id,
          message,
          (chunk) => {
            chunkSentCount++;
            fullResponse += chunk;
            
            // Log first few chunks being sent
            if (chunkSentCount <= 3) {
              console.log(`Sending chunk ${chunkSentCount} to client:`, chunk.substring(0, 50));
            }
            
            const data = JSON.stringify({ chunk, done: false });
            res.write(`data: ${data}\n\n`);
          }
        );

        console.log(`=== STREAMING COMPLETE ===`);
        console.log(`Total chunks sent: ${chunkSentCount}`);
        console.log(`Final response length: ${fullResponse.length}`);

        // Send completion signal
        res.write(`data: ${JSON.stringify({ done: true, fullResponse })}\n\n`);
        res.end();
        console.log("Response stream closed");
      } catch (error: any) {
        console.error("=== PDF CHAT ERROR ===");
        console.error("Error type:", error.constructor.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        console.error("Full error object:", JSON.stringify(error, null, 2));
        
        const errorMessage = error.message || "An unknown error occurred";
        const errorData = JSON.stringify({ error: errorMessage, done: true });
        console.log("Sending error to client:", errorData);
        
        res.write(`data: ${errorData}\n\n`);
        res.end();
        console.log("Error response sent, stream closed");
      }
    }
  );

  /**
   * Get chat history
   */
  static getChatHistory = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const history = await PdfChatService.getChatHistory(id, req.user!.id);

      res
        .status(200)
        .json(new ApiResponse(200, history, "Chat history retrieved successfully"));
    }
  );

  /**
   * Delete PDF
   */
  static deletePdf = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const result = await PdfService.deletePdf(id, req.user!.id);

      res
        .status(200)
        .json(new ApiResponse(200, result, "PDF deleted successfully"));
    }
  );

  /**
   * Analyze images using Gemini 3.0 Flash vision
   * This endpoint is called by VAPI function calling
   * VAPI sends function calls in a specific format and expects results in a specific format
   */
  static analyzeImages = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      // VAPI function calling format: { toolCallId, function: { name, arguments } }
      const { toolCallId, function: func } = req.body;

      // Handle VAPI function calling format
      if (toolCallId && func) {
        console.log("=== VAPI FUNCTION CALL RECEIVED ===");
        console.log("[VAPI] Tool Call ID:", toolCallId);
        console.log("[VAPI] Function Name:", func.name);
        console.log("[VAPI] Function Arguments:", func.arguments);
        
        try {
          const args = typeof func.arguments === 'string' 
            ? JSON.parse(func.arguments) 
            : func.arguments;
          
          const { imageUrls, question } = args;
          
          console.log("[VAPI] Parsed Image URLs:", imageUrls);
          console.log("[VAPI] Parsed Question:", question || "None");

          if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
            return res.status(200).json({
              results: [
                {
                  toolCallId,
                  result: "Error: imageUrls array is required",
                },
              ],
            });
          }

          const analysis = await PdfChatService.analyzeImages(
            imageUrls,
            question
          );

          console.log("[VAPI] Analysis completed, returning result to VAPI");
          console.log("[VAPI] Analysis preview (first 200 chars):", analysis.substring(0, 200));
          console.log("=== VAPI FUNCTION CALL COMPLETE ===");

          // Return in VAPI's expected format
          return res.status(200).json({
            results: [
              {
                toolCallId,
                result: analysis,
              },
            ],
          });
        } catch (error: any) {
          console.error("Image analysis error:", error);
          return res.status(200).json({
            results: [
              {
                toolCallId,
                result: `Error analyzing images: ${error.message}`,
              },
            ],
          });
        }
      }

      // Fallback: Handle direct API call format (for testing)
      const { imageUrls, question } = req.body;

      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        return res.status(400).json({
          success: false,
          message: "imageUrls array is required",
        });
      }

      try {
        const analysis = await PdfChatService.analyzeImages(
          imageUrls,
          question
        );

        res.status(200).json(
          new ApiResponse(200, { analysis }, "Images analyzed successfully")
        );
      } catch (error: any) {
        console.error("Image analysis error:", error);
        res.status(500).json({
          success: false,
          message: "Failed to analyze images: " + error.message,
        });
      }
    }
  );
}
