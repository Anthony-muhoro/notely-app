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
      
      // Store fileId for later deletion (uploadResult.fileId)
      const pdfFileId = uploadResult.fileId;

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

      // Save PDF document to database first (we need the ID for summary generation)
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

      // Generate comprehensive Gemini summary for VAPI
      let geminiSummary: string | null = null;
      try {
        console.log("[PDF UPLOAD] Generating comprehensive Gemini summary for VAPI...");
        const startTime = Date.now();
        
        geminiSummary = await PdfChatService.getPdfSummaryForVapi(
          pdfDocument.id,
          userId
        );
        
        const duration = Date.now() - startTime;
        console.log(`[PDF UPLOAD] Gemini summary generated in ${duration}ms`);
        console.log(`[PDF UPLOAD] Summary preview (first 300 chars):`, geminiSummary.substring(0, 300));
        
        // Update PDF document with summary
        await prisma.pdfDocument.update({
          where: { id: pdfDocument.id },
          data: {
            geminiSummary: geminiSummary,
            geminiSummaryDate: new Date(),
          },
        });
        
        console.log("[PDF UPLOAD] Gemini summary stored successfully");
      } catch (error: any) {
        console.error("[PDF UPLOAD] Error generating Gemini summary:", error);
        // Continue without summary - don't fail the upload
        console.warn("[PDF UPLOAD] Continuing upload without Gemini summary");
      }

      // Fetch the updated PDF document with summary
      const updatedPdf = await prisma.pdfDocument.findUnique({
        where: { id: pdfDocument.id },
      });

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
        pdf: updatedPdf || pdfDocument,
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
   * Get all chat sessions for a PDF (only sessions with messages)
   */
  static async getChatSessions(pdfId: string, userId: string) {
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

    // Get all sessions with message counts
    const sessions = await prisma.chatSession.findMany({
      where: {
        pdfId,
      },
      include: {
        messages: {
          orderBy: { dateCreated: "asc" },
          take: 1, // Just get first message for preview
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: {
        lastUpdated: "desc",
      },
    });

    // Filter out sessions with no messages
    return sessions.filter((session) => session._count.messages > 0);
  }

  /**
   * Get a specific chat session by ID
   */
  static async getChatSessionById(sessionId: string, userId: string) {
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        pdf: {
          userId,
        },
      },
      include: {
        messages: {
          orderBy: { dateCreated: "asc" },
        },
        pdf: true,
      },
    });

    if (!session) {
      throw new ApiError(404, "Chat session not found");
    }

    return session;
  }

  /**
   * Create a new chat session for PDF
   */
  static async createChatSession(pdfId: string, userId: string) {
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

    return await prisma.chatSession.create({
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

  /**
   * Delete a chat session
   */
  static async deleteChatSession(sessionId: string, userId: string) {
    // Verify session belongs to user's PDF
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        pdf: {
          userId,
        },
      },
    });

    if (!session) {
      throw new ApiError(404, "Chat session not found");
    }

    // Delete session (messages will cascade delete)
    await prisma.chatSession.delete({
      where: {
        id: sessionId,
      },
    });

    return { message: "Chat session deleted successfully" };
  }

  /**
   * Get or create chat session for PDF (legacy method for backward compatibility)
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
   * Delete PDF document and associated ImageKit files
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

    // Delete ImageKit files
    try {
      // Delete main PDF file from ImageKit
      const fileUrl = pdf.fileUrl;
      if (fileUrl) {
        try {
          // Extract file path from URL
          const urlObj = new URL(fileUrl);
          const filePath = urlObj.pathname.substring(1); // Remove leading slash
          
          // List files in the /pdfs folder and find matching file
          const files = await imagekit.listFiles({
            path: "/pdfs",
            limit: 100,
          });
          
          // Find file by matching URL (filter out folders, only get FileObject)
          const matchingFile = files.find((f: any) => {
            // Check if it's a file (has fileId property) and matches URL or path
            return 'fileId' in f && (f.url === fileUrl || f.filePath === filePath);
          });
          
          if (matchingFile && 'fileId' in matchingFile) {
            const fileId = (matchingFile as any).fileId;
            await imagekit.deleteFile(fileId);
            console.log(`[PDF DELETE] Deleted PDF file from ImageKit: ${fileId}`);
          } else {
            console.warn(`[PDF DELETE] Could not find PDF file in ImageKit for deletion: ${fileUrl}`);
          }
        } catch (error: any) {
          console.error("[PDF DELETE] Error deleting PDF file from ImageKit:", error);
          // Continue with deletion even if ImageKit deletion fails
        }
      }

      // Delete page images from ImageKit
      if (pdf.imageUrls && pdf.imageUrls.length > 0) {
        for (const imageUrl of pdf.imageUrls) {
          try {
            const urlObj = new URL(imageUrl);
            const filePath = urlObj.pathname.substring(1);
            
            // List files in the /pdf-pages folder
            const files = await imagekit.listFiles({
              path: "/pdf-pages",
              limit: 100,
            });
            
            // Find matching file (filter out folders)
            const matchingFile = files.find((f: any) => {
              return 'fileId' in f && (f.url === imageUrl || f.filePath === filePath);
            });
            
            if (matchingFile && 'fileId' in matchingFile) {
              const fileId = (matchingFile as any).fileId;
              await imagekit.deleteFile(fileId);
              console.log(`[PDF DELETE] Deleted image from ImageKit: ${fileId}`);
            }
          } catch (error: any) {
            console.error(`[PDF DELETE] Error deleting image from ImageKit:`, error);
            // Continue with other deletions
          }
        }
      }
    } catch (error: any) {
      console.error("[PDF DELETE] Error during ImageKit cleanup:", error);
      // Continue with database deletion even if ImageKit cleanup fails
    }

    // Delete from database (cascade will delete chat sessions and messages)
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
