import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI } from "@google/genai";
import { createPartFromUri } from "@google/genai";
import { PdfService } from "./pdf.service";

// Old SDK for image analysis (keeping for backward compatibility)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const visionModel = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// New SDK for PDF document processing
const genAIClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export class PdfChatService {
  /**
   * Upload PDF to Gemini Files API and get file reference
   * Uses caching to avoid re-uploading the same PDF
   */
  private static pdfFileCache = new Map<string, { uri: string; mimeType: string }>();

  private static async uploadPdfToGemini(pdfUrl: string, pdfId: string): Promise<{ uri: string; mimeType: string }> {
    // Check cache first
    if (this.pdfFileCache.has(pdfId)) {
      const cached = this.pdfFileCache.get(pdfId)!;
      console.log(`[PDF UPLOAD] Using cached Gemini file for PDF ${pdfId}`);
      return cached;
    }

    try {
      console.log(`[PDF UPLOAD] Downloading PDF from ImageKit: ${pdfUrl}`);
      
      // Download PDF from ImageKit
      const pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to download PDF: ${pdfResponse.statusText}`);
      }
      
      const pdfBuffer = await pdfResponse.arrayBuffer();
      const fileBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

      console.log(`[PDF UPLOAD] Uploading PDF to Gemini Files API (${pdfBuffer.byteLength} bytes)...`);
      
      // Upload to Gemini Files API
      const file = await genAIClient.files.upload({
        file: fileBlob,
        config: {
          displayName: `pdf_${pdfId}`,
          mimeType: 'application/pdf',
        },
      });

      console.log(`[PDF UPLOAD] File uploaded, waiting for processing... File name: ${file.name}`);

      // Wait for the file to be processed
      let getFile = await genAIClient.files.get({ name: file.name! });
      while (getFile.state === 'PROCESSING' || !getFile.state) {
        console.log(`[PDF UPLOAD] File is still processing, current state: ${getFile.state || 'UNKNOWN'}`);
        console.log('[PDF UPLOAD] Retrying in 2 seconds...');

        await new Promise((resolve) => {
          setTimeout(resolve, 2000);
        });
        
        getFile = await genAIClient.files.get({ name: file.name! });
      }

      if (getFile.state === 'FAILED') {
        throw new Error('File processing failed in Gemini API');
      }

      if (!getFile.uri || !getFile.mimeType) {
        throw new Error('File upload succeeded but missing URI or MIME type');
      }

      console.log(`[PDF UPLOAD] File processed successfully. URI: ${getFile.uri}`);

      // Cache the result
      const fileInfo = { uri: getFile.uri, mimeType: getFile.mimeType };
      this.pdfFileCache.set(pdfId, fileInfo);

      return fileInfo;
    } catch (error: any) {
      console.error("[PDF UPLOAD] Error uploading PDF to Gemini:", error);
      throw new Error(`Failed to upload PDF to Gemini: ${error.message}`);
    }
  }

  /**
   * Generate AI response with streaming support
   * Now uses actual PDF file upload to Gemini instead of extracted text
   */
  static async chatWithPdf(
    pdfId: string,
    userId: string,
    userMessage: string,
    sessionId?: string,
    onChunk?: (chunk: string) => void
  ) {
    // Get PDF
    const pdf = await PdfService.getPdfById(pdfId, userId);
    
    // Get specific session or create/get default session
    let session;
    if (sessionId) {
      session = await PdfService.getChatSessionById(sessionId, userId);
    } else {
      session = await PdfService.getOrCreateChatSession(pdfId, userId);
    }

    // Get conversation history
    const history = session.messages || [];
    
    // Save user message
    await PdfService.saveMessage(session.id, "user", userMessage);

    // Build conversation context
    let conversationContext = "";
    if (history.length > 0) {
      conversationContext = "\n\nPrevious conversation:\n";
      history.forEach((msg) => {
        conversationContext += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
      });
    }

    try {
      // Upload PDF to Gemini Files API
      console.log(`[PDF CHAT] Uploading PDF ${pdfId} to Gemini...`);
      const fileInfo = await this.uploadPdfToGemini(pdf.fileUrl, pdfId);

      // Build prompt
      const prompt = `You are an expert AI assistant specialized in analyzing and answering questions about PDF documents.

PDF Document: ${pdf.fileName}
Total Pages: ${pdf.pageCount || 'Unknown'}
${conversationContext}

User Question: ${userMessage}

Answer the user's question based on the PDF document. Analyze the document thoroughly, including any text, images, charts, diagrams, and tables. If the information is not in the PDF, clearly state that.`;

      // Prepare content with PDF file
      // Format: text prompt first, then file part
      const filePart = createPartFromUri(fileInfo.uri, fileInfo.mimeType);
      const content = [
        { text: prompt },
        filePart,
      ];

      console.log(`[PDF CHAT] Sending request to Gemini with PDF file...`);
      
      // Generate content using the new SDK
      const response = await genAIClient.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: content,
      });

      const fullResponse = response.text || "";

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
   * Get comprehensive PDF summary from Gemini for VAPI
   * This provides a detailed analysis of the entire PDF document
   */
  static async getPdfSummaryForVapi(
    pdfId: string,
    userId: string
  ): Promise<string> {
    try {
      // Get PDF
      const pdf = await PdfService.getPdfById(pdfId, userId);

      console.log(`[PDF SUMMARY] Generating comprehensive summary for PDF ${pdfId}...`);

      // Upload PDF to Gemini Files API
      const fileInfo = await this.uploadPdfToGemini(pdf.fileUrl, pdfId);

      // Build comprehensive summary prompt
      const prompt = `Please provide a comprehensive summary and analysis of this PDF document. 

PDF Document: ${pdf.fileName}
Total Pages: ${pdf.pageCount || 'Unknown'}

Please analyze the entire document and provide:

1. **Document Overview**: What is this document about? What is its main purpose or topic?

2. **Key Topics & Sections**: What are the main topics, chapters, or sections covered?

3. **Important Information**: What are the most important facts, data points, or insights?

4. **Visual Content**: Describe any charts, graphs, diagrams, tables, or images and what they show.

5. **Key Takeaways**: What are the main conclusions, recommendations, or important points?

6. **Structure & Organization**: How is the document organized? What is the flow of information?

Provide a detailed, comprehensive summary that captures the essence of the entire document. This summary will be used by a voice assistant to help users understand and discuss the PDF content. Be thorough and include specific details where relevant.`;

      // Prepare content with PDF file
      const filePart = createPartFromUri(fileInfo.uri, fileInfo.mimeType);
      const content = [
        { text: prompt },
        filePart,
      ];

      console.log(`[PDF SUMMARY] Requesting summary from Gemini...`);
      
      // Generate comprehensive summary
      const response = await genAIClient.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: content,
      });

      const summary = response.text || "";

      if (!summary || summary.trim().length === 0) {
        throw new Error("Gemini returned an empty summary");
      }

      console.log(`[PDF SUMMARY] Summary generated successfully (${summary.length} characters)`);
      console.log(`[PDF SUMMARY] Preview (first 500 chars):`, summary.substring(0, 500));

      return summary;
    } catch (error: any) {
      console.error("[PDF SUMMARY] Error generating summary:", error);
      throw new Error(`Failed to generate PDF summary: ${error.message}`);
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
