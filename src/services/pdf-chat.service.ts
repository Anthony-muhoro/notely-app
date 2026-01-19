import { GoogleGenerativeAI } from "@google/generative-ai";
import { PdfService } from "./pdf.service";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
const visionModel = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

export class PdfChatService {
  /**
   * Generate AI response with streaming support
   */
  static async chatWithPdf(
    pdfId: string,
    userId: string,
    userMessage: string,
    onChunk?: (chunk: string) => void
  ) {
    // Get PDF and session
    const pdf = await PdfService.getPdfById(pdfId, userId);
    const session = await PdfService.getOrCreateChatSession(pdfId, userId);

    // Get conversation history
    const history = session.messages || [];
    
    // Save user message
    await PdfService.saveMessage(session.id, "user", userMessage);

    // Prepare PDF content
    const pdfText = pdf.extractedText || "";
    
    // Build conversation context
    let conversationContext = "";
    if (history.length > 0) {
      conversationContext = "\n\nPrevious conversation:\n";
      history.forEach((msg) => {
        conversationContext += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
      });
    }

    // Build prompt like note creation
    const prompt = `You are an expert AI assistant specialized in analyzing and answering questions about PDF documents.

PDF Document: ${pdf.fileName}
Total Pages: ${pdf.pageCount}

PDF Content:
${pdfText || "PDF text extraction was not available for this document."}
${conversationContext}

User Question: ${userMessage}

Answer the user's question based on the PDF content above. If the information is not in the PDF, clearly state that.`;

    try {
      const result = await model.generateContent(prompt);
      const fullResponse = await result.response.text();

      if (!fullResponse || fullResponse.trim().length === 0) {
        throw new Error("AI returned an empty response");
      }

      // Send as streaming chunks for better UX
      if (onChunk) {
        const chunkSize = 50;
        for (let i = 0; i < fullResponse.length; i += chunkSize) {
          const chunk = fullResponse.substring(i, i + chunkSize);
          onChunk(chunk);
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // Save assistant response
      await PdfService.saveMessage(session.id, "assistant", fullResponse);

      return {
        response: fullResponse,
        sessionId: session.id,
      };
    } catch (error: any) {
      console.error("PDF chat error:", error);
      
      // Save error message to chat
      await PdfService.saveMessage(
        session.id,
        "assistant",
        `I apologize, but I encountered an error while processing your request: ${error.message}. Please try again or rephrase your question.`
      );
      
      throw new Error("Failed to generate response: " + error.message);
    }
  }

  /**
   * Get chat history for a PDF
   */
  static async getChatHistory(pdfId: string, userId: string) {
    const pdf = await PdfService.getPdfById(pdfId, userId);
    const session = await PdfService.getOrCreateChatSession(pdfId, userId);

    return {
      messages: session.messages,
      sessionId: session.id,
    };
  }

  /**
   * Analyze images using Gemini 3.0 Flash vision capabilities
   * This acts as the "Eyes" - Gemini sees the images and describes them
   */
  static async analyzeImages(imageUrls: string[], question?: string): Promise<string> {
    if (!imageUrls || imageUrls.length === 0) {
      console.log("[GEMINI IMAGE ANALYSIS] No images provided");
      return "No images provided for analysis.";
    }

    try {
      // Limit to first 10 images for performance
      const imagesToAnalyze = imageUrls.slice(0, 10);
      
      console.log("=== GEMINI IMAGE ANALYSIS TEST ===");
      console.log(`[GEMINI IMAGE ANALYSIS] Starting analysis of ${imagesToAnalyze.length} images`);
      console.log(`[GEMINI IMAGE ANALYSIS] Question: ${question || "General analysis"}`);
      console.log(`[GEMINI IMAGE ANALYSIS] Image URLs:`, imagesToAnalyze);
      
      // Build prompt for image analysis
      const prompt = question 
        ? `Please analyze these ${imagesToAnalyze.length} images from a PDF document and answer this question: "${question}"
        
        Provide a detailed description of what you see in the images, including:
        - Text content visible in the images
        - Charts, graphs, diagrams, or visual elements
        - Layout and structure
        - Any important details relevant to the question
        
        Be specific and detailed in your analysis.`
        : `Please analyze these ${imagesToAnalyze.length} images from a PDF document.
        
        Provide a comprehensive description of what you see, including:
        - All text content visible in the images
        - Charts, graphs, diagrams, tables, or other visual elements
        - Layout, structure, and organization
        - Key information and important details
        - Any patterns or relationships between elements
        
        Be thorough and descriptive.`;

      // Prepare image parts for Gemini
      const imageParts = await Promise.all(
        imagesToAnalyze.map(async (imageUrl) => {
          try {
            // Fetch image and convert to base64 or use URL directly
            const response = await fetch(imageUrl);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Image = buffer.toString('base64');
            
            // Determine MIME type from URL or default to image/png
            const mimeType = imageUrl.match(/\.(jpg|jpeg)$/i) ? 'image/jpeg' : 
                            imageUrl.match(/\.(png)$/i) ? 'image/png' : 
                            'image/png';
            
            return {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            };
          } catch (error) {
            console.error(`Error processing image ${imageUrl}:`, error);
            return null;
          }
        })
      );

      // Filter out failed image processing
      const validImageParts = imageParts.filter((part) => part !== null) as any[];

      if (validImageParts.length === 0) {
        return "Failed to process images for analysis.";
      }

      // Use Gemini vision model to analyze images
      console.log(`[GEMINI IMAGE ANALYSIS] Sending ${validImageParts.length} images to Gemini...`);
      const startTime = Date.now();
      const result = await visionModel.generateContent([prompt, ...validImageParts]);
      const analysis = await result.response.text();
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`[GEMINI IMAGE ANALYSIS] Analysis completed in ${duration}ms`);
      console.log(`[GEMINI IMAGE ANALYSIS] Response length: ${analysis.length} characters`);
      console.log(`[GEMINI IMAGE ANALYSIS] Response preview (first 500 chars):`, analysis.substring(0, 500));
      console.log("=== GEMINI IMAGE ANALYSIS TEST COMPLETE ===");

      return analysis || "I was unable to analyze the images. Please try again.";
    } catch (error: any) {
      console.error("[GEMINI IMAGE ANALYSIS] Error:", error);
      console.error("[GEMINI IMAGE ANALYSIS] Error details:", error.message, error.stack);
      return `Error analyzing images: ${error.message}. Please try again.`;
    }
  }
}
