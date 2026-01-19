import prisma from "../config/prisma";
import { ApiError } from "../utils/apiError";
import imagekit from "../config/imagekit";
import { createCanvas, Image } from "canvas";
import { PdfChatService } from "./pdf-chat.service";

// Configure pdf.js for Node.js environment - provide Image class from canvas
// This must be done before requiring pdfjs-dist
if (typeof global !== 'undefined') {
  (global as any).Image = Image;
}

// Use require for pdfjs-dist (CommonJS module)
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.mjs");

// Note: We don't configure GlobalWorkerOptions for Node.js
// The worker will be disabled via getDocument options (useWorkerFetch: false)

// Use require for pdf-parse (it's a CommonJS-compatible module)
const pdfParseModule = require("pdf-parse");

// NodeCanvasFactory for pdf.js to work in Node.js environment
class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    return { canvas, context };
  }

  reset(canvasAndContext: { canvas: any; context: any }, width: number, height: number) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext: { canvas: any; context: any }) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

export class PdfService {
  /**
   * Upload and process PDF file
   */
  static async uploadPdf(
    userId: string,
    file: Express.Multer.File
  ) {
    try {
      // Extract text from PDF using PDFParse class
      const PDFParse = pdfParseModule.PDFParse || pdfParseModule;
      const parser = new PDFParse({ data: file.buffer });
      const pdfData = await parser.getText();
      const extractedText = pdfData.text || "";
      const pageCount = pdfData.total || 0;

      // Log extraction results for debugging
      console.log(`PDF extracted: ${pageCount} pages, ${extractedText.length} characters`);
      
      if (!extractedText || extractedText.trim().length === 0) {
        console.warn("Warning: No text extracted from PDF. The PDF might be image-based or encrypted.");
      }

      // Upload PDF to ImageKit
      const uploadResult = await imagekit.upload({
        file: file.buffer,
        fileName: `pdf_${Date.now()}_${file.originalname}`,
        folder: "/pdfs",
        useUniqueFileName: true,
      });

      // Extract images from PDF pages and analyze with Gemini 3.0 Flash
      let imageUrls: string[] = [];
      let imageAnalysis: string | null = null;
      
      try {
        console.log("[PDF UPLOAD] Starting image extraction and analysis...");
        
        // Extract PDF page images
        imageUrls = await PdfService.extractPdfImages(
          file.buffer,
          uploadResult.url,
          pageCount
        );
        
        console.log(`[PDF UPLOAD] Extracted ${imageUrls.length} page images`);
        
        // Automatically analyze images with Gemini 3.0 Flash
        if (imageUrls.length > 0) {
          console.log("[PDF UPLOAD] Analyzing images with Gemini 3.0 Flash...");
          const startTime = Date.now();
          
          imageAnalysis = await PdfChatService.analyzeImages(
            imageUrls,
            undefined // No specific question - general analysis
          );
          
          const duration = Date.now() - startTime;
          console.log(`[PDF UPLOAD] Gemini analysis completed in ${duration}ms`);
          console.log(`[PDF UPLOAD] Analysis preview (first 300 chars):`, imageAnalysis.substring(0, 300));
          console.log("[PDF UPLOAD] Image analysis stored successfully");
        } else {
          console.log("[PDF UPLOAD] No images found in PDF, skipping analysis");
        }
      } catch (error: any) {
        console.error("[PDF UPLOAD] Error during image extraction/analysis:", error);
        // Continue without images - don't fail the upload
        console.warn("[PDF UPLOAD] Continuing upload without image analysis");
      }

      // Save PDF document to database with image URLs and analysis
      const pdfDocument = await prisma.pdfDocument.create({
        data: {
          userId,
          fileName: file.originalname,
          fileUrl: uploadResult.url,
          fileSize: file.size,
          pageCount,
          extractedText,
          imageUrls: imageUrls.length > 0 ? imageUrls : [],
          imageAnalysis: imageAnalysis,
          imageAnalysisDate: imageAnalysis ? new Date() : null,
        },
      });
      
      console.log(`[PDF UPLOAD] PDF document saved with ID: ${pdfDocument.id}`);

      // Create initial chat session
      const chatSession = await prisma.chatSession.create({
        data: {
          pdfId: pdfDocument.id,
        },
        include: {
          messages: {
            orderBy: { dateCreated: "asc" },
          },
        },
      });

      return {
        pdf: pdfDocument,
        session: chatSession,
      };
    } catch (error: any) {
      console.error("PDF upload error:", error);
      throw new ApiError(500, "Failed to process PDF: " + error.message);
    }
  }

  /**
   * Get PDF document by ID
   */
  static async getPdfById(pdfId: string, userId: string) {
    const pdf = await prisma.pdfDocument.findFirst({
      where: {
        id: pdfId,
        userId,
      },
      include: {
        chatSessions: {
          include: {
            messages: {
              orderBy: { dateCreated: "asc" },
            },
          },
          orderBy: { lastUpdated: "desc" },
          take: 1, // Get the most recent session
        },
      },
    });

    if (!pdf) {
      throw new ApiError(404, "PDF document not found");
    }

    return pdf;
  }

  /**
   * Get all PDFs for a user
   */
  static async getUserPdfs(userId: string) {
    return await prisma.pdfDocument.findMany({
      where: {
        userId,
      },
      orderBy: {
        lastUpdated: "desc",
      },
    });
  }

  /**
   * Get or create chat session for PDF
   */
  static async getOrCreateChatSession(pdfId: string, userId: string) {
    // Verify PDF belongs to user
    const pdf = await prisma.pdfDocument.findFirst({
      where: {
        id: pdfId,
        userId,
      },
    });

    if (!pdf) {
      throw new ApiError(404, "PDF document not found");
    }

    // Get the most recent session or create a new one
    let session = await prisma.chatSession.findFirst({
      where: {
        pdfId,
      },
      include: {
        messages: {
          orderBy: { dateCreated: "asc" },
        },
      },
      orderBy: {
        lastUpdated: "desc",
      },
    });

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          pdfId,
        },
        include: {
          messages: {
            orderBy: { dateCreated: "asc" },
          },
        },
      });
    }

    return session;
  }

  /**
   * Save chat message
   */
  static async saveMessage(
    sessionId: string,
    role: "user" | "assistant",
    content: string
  ) {
    return await prisma.chatMessage.create({
      data: {
        sessionId,
        role,
        content,
      },
    });
  }

  /**
   * Delete PDF document
   */
  static async deletePdf(pdfId: string, userId: string) {
    const pdf = await prisma.pdfDocument.findFirst({
      where: {
        id: pdfId,
        userId,
      },
    });

    if (!pdf) {
      throw new ApiError(404, "PDF document not found");
    }

    await prisma.pdfDocument.delete({
      where: {
        id: pdfId,
      },
    });

    return { message: "PDF deleted successfully" };
  }

  /**
   * Extract images from PDF pages using pdfjs-dist and canvas
   */
  static async extractPdfImages(
    pdfBuffer: Buffer,
    pdfUrl: string,
    pageCount: number
  ): Promise<string[]> {
    const imageUrls: string[] = [];
    
    try {
      // Load PDF document - convert Buffer to Uint8Array for pdf.js
      const pdfData = new Uint8Array(pdfBuffer);
      const canvasFactory = new NodeCanvasFactory();
      
      const loadingTask = pdfjsLib.getDocument({ 
        data: pdfData,
        CanvasFactory: NodeCanvasFactory,
        disableWorker: true, // Completely disable worker in Node.js
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        verbosity: 0
      });
      const pdfDocument = await loadingTask.promise;
      
      // Process up to 10 pages (for performance)
      const pagesToProcess = Math.min(pageCount, 10);
      
      for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
        try {
          const page = await pdfDocument.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
          
          // Create canvas using factory
          const { canvas, context } = canvasFactory.create(viewport.width, viewport.height);
          
          // Render PDF page to canvas
          const renderContext = {
            canvasContext: context as any,
            viewport: viewport,
            canvasFactory: canvasFactory,
          };
          await page.render(renderContext).promise;
          
          // Convert canvas to buffer
          const imageBuffer = canvas.toBuffer('image/png');
          
          // Clean up canvas
          canvasFactory.destroy({ canvas, context });
          
          // Upload to ImageKit
          const imageResult = await imagekit.upload({
            file: imageBuffer,
            fileName: `pdf_page_${Date.now()}_${pageNum}.png`,
            folder: "/pdf-pages",
            useUniqueFileName: true,
          });
          
          imageUrls.push(imageResult.url);
          console.log(`Extracted image from page ${pageNum}`);
        } catch (pageError) {
          console.error(`Error extracting page ${pageNum}:`, pageError);
        }
      }
    } catch (error) {
      console.error("Error in PDF image extraction:", error);
    }
    
    return imageUrls;
  }

  /**
   * Get PDF images (extract on-the-fly)
   */
  static async getPdfImages(pdfId: string, pdfUrl: string, pageCount: number): Promise<string[]> {
    try {
      const response = await fetch(pdfUrl);
      const pdfBuffer = Buffer.from(await response.arrayBuffer());
      return await PdfService.extractPdfImages(pdfBuffer, pdfUrl, pageCount);
    } catch (error) {
      console.error("Error getting PDF images:", error);
      return [];
    }
  }
}
