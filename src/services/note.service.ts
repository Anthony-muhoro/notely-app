import prisma from "../config/prisma";
import imagekit from "../config/imagekit";
import { ApiError } from "../utils/apiError";
import { google } from "@ai-sdk/google";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
interface CreateNoteData {
  title: string;
  synopsis: string;
  content: string;
  isPublic?: boolean;
  isBookmarked?: boolean;
  isPinned?: boolean;
}

interface UpdateNoteData {
  title?: string;
  synopsis?: string;
  content?: string;
  isPublic?: boolean;
  isBookmarked?: boolean;
  isPinned?: boolean;
}

interface GetNotesFilters {
  page?: number;
  limit?: number;
  search?: string;
  isPublic?: boolean;
  isBookmarked?: boolean;
  isPinned?: boolean;
}

export class NoteService {
  static async createNote(
    userId: string,
    noteData: CreateNoteData,
    images?: Express.Multer.File[]
  ) {
    const note = await prisma.note.create({
      data: {
        ...noteData,
        creatorId: userId,
      },
      include: {
        images: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userName: true,
            avatar: true,
          },
        },
      },
    });

    // Upload images if provided
    if (images && images.length > 0) {
      const imagePromises = images.map(async (image, index) => {
        try {
          const result = await imagekit.upload({
            file: image.buffer,
            fileName: `note_${note.id}_${index}_${Date.now()}`,
            folder: "/notes",
          });

          return prisma.noteImage.create({
            data: {
              noteId: note.id,
              imageUrl: result.url,
              imageId: result.fileId,
              alt: `Note image ${index + 1}`,
              order: index,
            },
          });
        } catch (error) {
          console.error("Error uploading image:", error);
          return null;
        }
      });

      const uploadedImages = await Promise.all(imagePromises);
      note.images = uploadedImages.filter((img) => img !== null) as any[];
    }

    return note;
  }
  static async createwithgeminiNote(userId: string, noteData: CreateNoteData) {
    const { title } = noteData;

    const prompt = `
You are an assistant that generates well-written notes based on a title.

Title: "${title}"

Generate:
1. A short, clear synopsis (max 150 characters)
2.  A detailed, well-structured content section written in natural language, in plain text format only.

Respond in this format:
Synopsis: [your synopsis here]
Content: [your content here]
`;

    let synopsis = "";
    let content = "";

    try {
      const result = await model.generateContent(prompt);
      const text = await result.response.text();

      const synopsisMatch = text.match(/Synopsis:\s*(.+)/i);
      const contentMatch = text.match(/Content:\s*([\s\S]+)/i);

      if (!synopsisMatch || !contentMatch) {
        throw new Error("Invalid response format from Gemini.");
      }

      synopsis = synopsisMatch[1].trim();
      content = contentMatch[1].trim();
    } catch (err: any) {
      console.error("Gemini failed:", err);
      
      // Handle quota/rate limit errors (429)
      if (err.status === 429 || err.statusCode === 429) {
        let retryDelay = 60; // Default to 60 seconds
        
        // Try to extract retry delay from error details
        if (err.errorDetails && Array.isArray(err.errorDetails)) {
          const retryInfo = err.errorDetails.find(
            (detail: any) => detail?.["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
          );
          if (retryInfo?.retryDelay) {
            // Parse delay (format: "50s", "5s", etc.)
            const delayMatch = String(retryInfo.retryDelay).match(/(\d+)/);
            if (delayMatch) {
              retryDelay = parseInt(delayMatch[1], 10);
            }
          }
        }
        
        // Fallback: try to extract from error message
        if (retryDelay === 60 && err.message) {
          const messageMatch = err.message.match(/retry in ([\d.]+)s/i);
          if (messageMatch) {
            retryDelay = Math.ceil(parseFloat(messageMatch[1]));
          }
        }
        
        return {
          success: false,
          error: "QUOTA_EXCEEDED",
          message: "AI service quota exceeded. Please try again later or check your API plan.",
          retryAfter: retryDelay,
          statusCode: 429,
        };
      }
      
      // Handle other API errors
      if (err.status || err.statusCode) {
        return {
          success: false,
          error: "API_ERROR",
          message: "AI service is currently unavailable. Please try again later.",
          statusCode: err.status || err.statusCode || 500,
        };
      }
      
      // Generic error
      return {
        success: false,
        error: "GENERATION_FAILED",
        message: "Failed to generate a note. Please try again.",
        statusCode: 500,
      };
    }

    return { synopsis, content };
  }
  static async rewriteNoteContentWithGemini(content: string, title?: string) {
    const prompt = `
You are a helpful assistant that rewrites notes to be clearer, well-structured, and engaging.

${title ? `Title: "${title}"\n` : ""}Original Content:
${content}

Now rewrite it in a more polished and structured way.
just give the only one result. no explanations or suggestion ,just rewrite well.
 written in natural language, in plain text format only.
`;

    try {
      const result = await model.generateContent(prompt);
      const rewrittenText = await result.response.text();

      return {
        success: true,
        rewrittenContent: rewrittenText.trim(),
      };
    } catch (err: any) {
      console.error("Failed to rewrite note content:", err);
      
      // Handle quota/rate limit errors (429)
      if (err.status === 429 || err.statusCode === 429) {
        let retryDelay = 60; // Default to 60 seconds
        
        // Try to extract retry delay from error details
        if (err.errorDetails && Array.isArray(err.errorDetails)) {
          const retryInfo = err.errorDetails.find(
            (detail: any) => detail?.["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
          );
          if (retryInfo?.retryDelay) {
            // Parse delay (format: "50s", "5s", etc.)
            const delayMatch = String(retryInfo.retryDelay).match(/(\d+)/);
            if (delayMatch) {
              retryDelay = parseInt(delayMatch[1], 10);
            }
          }
        }
        
        // Fallback: try to extract from error message
        if (retryDelay === 60 && err.message) {
          const messageMatch = err.message.match(/retry in ([\d.]+)s/i);
          if (messageMatch) {
            retryDelay = Math.ceil(parseFloat(messageMatch[1]));
          }
        }
        
        return {
          success: false,
          error: "QUOTA_EXCEEDED",
          message: "AI service quota exceeded. Please try again later or check your API plan.",
          retryAfter: retryDelay,
          statusCode: 429,
        };
      }
      
      // Handle other API errors
      if (err.status || err.statusCode) {
        return {
          success: false,
          error: "API_ERROR",
          message: "AI service is currently unavailable. Please try again later.",
          statusCode: err.status || err.statusCode || 500,
        };
      }
      
      // Generic error
      return {
        success: false,
        error: "REWRITE_FAILED",
        message: "Failed to rewrite the note content. Please try again.",
        statusCode: 500,
      };
    }
  }

  static async getUserNotes(userId: string, filters: GetNotesFilters = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      isPublic,
      isBookmarked,
      isPinned,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {
      creatorId: userId,
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { synopsis: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isPublic !== undefined) where.isPublic = isPublic;
    if (isBookmarked !== undefined) where.isBookmarked = isBookmarked;
    if (isPinned !== undefined) where.isPinned = isPinned;

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        include: {
          images: {
            orderBy: { order: "asc" },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userName: true,
              avatar: true,
            },
          },
        },
        orderBy: [{ isPinned: "desc" }, { lastUpdated: "desc" }],
        skip,
        take: limit,
      }),
      prisma.note.count({ where }),
    ]);

    return {
      notes,
    };
  }

  static async getNoteById(noteId: string, userId?: string) {
    const note = await prisma.note.findUnique({
      where: { id: noteId, isDeleted: false },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userName: true,
            avatar: true,
          },
        },
      },
    });

    if (!note) {
      throw new ApiError(404, "Note not found");
    }

    // Check if user can access this note
    if (!note.isPublic && note.creatorId !== userId) {
      throw new ApiError(403, "You do not have permission to access this note");
    }

    return note;
  }

  static async updateNote(
    noteId: string,
    userId: string,
    updateData: UpdateNoteData
  ) {
    const existingNote = await prisma.note.findFirst({
      where: { id: noteId, creatorId: userId, isDeleted: false },
    });

    if (!existingNote) {
      throw new ApiError(
        404,
        "Note not found or you do not have permission to update it"
      );
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: updateData,
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userName: true,
            avatar: true,
          },
        },
      },
    });

    return updatedNote;
  }

  static async deleteNote(noteId: string, userId: string) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, creatorId: userId, isDeleted: false },
    });

    if (!note) {
      throw new ApiError(
        404,
        "Note not found or you do not have permission to delete it"
      );
    }
    // Soft delete the note
    await prisma.note.update({
      where: { id: noteId },
      data: { isDeleted: true },
    });

    return { message: "Note deleted successfully" };
  }
  static async pinNote(noteId: string, userId: string) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, creatorId: userId, isDeleted: false },
    });

    if (!note) {
      throw new ApiError(
        404,
        "Note not found or you do not have permission to delete it"
      );
    }
    // Soft delete the note
    await prisma.note.update({
      where: { id: noteId },
      data: { isPinned: true },
    });

    return { message: "Note pinned successfully" };
  }
  static async unPinNote(noteId: string, userId: string) {
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        creatorId: userId,
        isDeleted: false,
        isPinned: true,
      },
    });

    if (!note) {
      throw new ApiError(
        404,
        "Note not found or you do not have permission to delete it"
      );
    }
    await prisma.note.update({
      where: { id: noteId },
      data: { isPinned: false },
    });

    return { message: "Note unpinned successfully" };
  }
  static async BoomarkNote(noteId: string, userId: string) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, creatorId: userId, isDeleted: false },
    });

    if (!note) {
      throw new ApiError(
        404,
        "Note not found or you do not have permission to delete it"
      );
    }
    await prisma.note.update({
      where: { id: noteId },
      data: { isBookmarked: true },
    });

    return { message: "Note added to bookmarks" };
  }
  static async remveNoteBookmark(noteId: string, userId: string) {
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        creatorId: userId,
        isDeleted: false,
        isBookmarked: true,
      },
    });

    if (!note) {
      throw new ApiError(
        404,
        "Note not found or you do not have permission to delete it"
      );
    }
    await prisma.note.update({
      where: { id: noteId },
      data: { isBookmarked: false },
    });

    return { message: "Note removed from bookmarks" };
  }
  static async getUserDeletedNotes(userId: string) {
    const deletedNotes = await prisma.note.findMany({
      where: {
        creatorId: userId,
        isDeleted: true,
      },
      orderBy: {
        lastUpdated: "desc",
      },
    });

    return {
      success: true,
      message: deletedNotes.length
        ? "Deleted notes retrieved successfully"
        : "No deleted notes found",
      notes: deletedNotes,
    };
  }
  static async getUserpinneddNotes(userId: string) {
    const pinnedNotes = await prisma.note.findMany({
      where: {
        creatorId: userId,
        isDeleted: false,
        isPinned: true,
      },
      orderBy: {
        lastUpdated: "desc",
      },
    });

    return {
      success: true,
      message: pinnedNotes.length
        ? "pinned notes retrieved successfully"
        : "No pinned notes found",
      notes: pinnedNotes,
    };
  }
  static async getUserBokmarkeddNotes(userId: string) {
    const pinnedNotes = await prisma.note.findMany({
      where: {
        creatorId: userId,
        isDeleted: false,
        isBookmarked: true,
      },
      orderBy: {
        lastUpdated: "desc",
      },
    });

    return {
      success: true,
      message: pinnedNotes.length
        ? "pinned notes retrieved successfully"
        : "No pinned notes found",
      notes: pinnedNotes,
    };
  }

  static async restoreNote(noteId: string, userId: string) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, creatorId: userId, isDeleted: true },
    });

    if (!note) {
      return { success: false, message: "Note not found or already restored" };
    }

    const restoredNote = await prisma.note.update({
      where: { id: noteId },
      data: { isDeleted: false },
    });

    return {
      success: true,
      message: "Note restored successfully",
      data: restoredNote,
    };
  }

  static async getPublicNotes(userId: string) {
    return await prisma.note.findMany({
      where: {
        isPublic: true,
        creatorId: {
          not: userId,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
            userName: true,
          },
        },
      },
    });
  }

  /**
   * Create a note from voice input using Gemini
   * Processes voice transcription and generates a well-formatted note
   */
  static async createNoteFromVoice(
    userId: string,
    voiceTranscript: string,
    topic?: string
  ) {
    const prompt = `
You are an expert note-taking assistant. A user has spoken about a topic and you need to create a comprehensive, well-formatted note.

${topic ? `Topic/Title: "${topic}"\n` : ""}
Voice Transcript: "${voiceTranscript}"

Your task:
1. Extract the main topic/title if not provided
2. Create a concise synopsis (max 150 characters)
3. Generate well-structured, professional HTML content with:
   - Clear headings using <h1>, <h2>, <h3> tags
   - Well-organized paragraphs using <p> tags
   - Bullet lists using <ul><li> tags
   - Numbered lists using <ol><li> tags
   - Important text in <strong> or <em> tags
   - Clean, professional formatting
   - Logical organization with clear sections

Format your response as JSON:
{
  "title": "Main topic/title",
  "synopsis": "Brief synopsis (max 150 characters)",
  "content": "Well-formatted HTML content. Structure it professionally with proper HTML tags. Organize content into clear sections with headings. Use <h1> for main title, <h2> for major sections, <h3> for subsections. Use <p> for paragraphs, <ul><li> for bullet points, <ol><li> for numbered lists. Make it clean, smart, and well-organized."
}

Make the content comprehensive, educational, and well-organized. If the topic is technical (like machine learning, programming, etc.), include:
- Definitions
- Key concepts
- Examples
- Applications
- Best practices (if applicable)
`;

    try {
      const result = await model.generateContent(prompt);
      const text = await result.response.text();

      // Try to extract JSON from response
      let jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Fallback: try to parse the entire response
        jsonMatch = text.match(/\{[\s\S]*\}/);
      }

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            title: parsed.title || topic || "Untitled Note",
            synopsis: parsed.synopsis || "",
            content: parsed.content || text,
          };
        } catch (parseError) {
          // If JSON parsing fails, extract manually
          const titleMatch = text.match(/"title":\s*"([^"]+)"/i) || 
                           text.match(/title[:\s]+([^\n]+)/i);
          const synopsisMatch = text.match(/"synopsis":\s*"([^"]+)"/i) ||
                              text.match(/synopsis[:\s]+([^\n]+)/i);
          const contentMatch = text.match(/"content":\s*"([^"]+)"/i) ||
                              text.match(/content[:\s]+([\s\S]+)/i);

          return {
            success: true,
            title: titleMatch?.[1]?.trim() || topic || "Untitled Note",
            synopsis: synopsisMatch?.[1]?.trim() || "",
            content: contentMatch?.[1]?.trim() || text,
          };
        }
      }

      // Fallback: extract title, synopsis, and content from structured text
      const titleMatch = text.match(/Title[:\s]+([^\n]+)/i);
      const synopsisMatch = text.match(/Synopsis[:\s]+([^\n]+)/i);
      const contentMatch = text.match(/Content[:\s]+([\s\S]+)/i);

      return {
        success: true,
        title: titleMatch?.[1]?.trim() || topic || "Untitled Note",
        synopsis: synopsisMatch?.[1]?.trim() || "",
        content: contentMatch?.[1]?.trim() || text,
      };
    } catch (err: any) {
      console.error("Voice-to-note generation failed:", err);
      
      if (err.status === 429 || err.statusCode === 429) {
        let retryDelay = 60;
        if (err.errorDetails && Array.isArray(err.errorDetails)) {
          const retryInfo = err.errorDetails.find(
            (detail: any) => detail?.["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
          );
          if (retryInfo?.retryDelay) {
            const delayMatch = String(retryInfo.retryDelay).match(/(\d+)/);
            if (delayMatch) {
              retryDelay = parseInt(delayMatch[1], 10);
            }
          }
        }
        if (retryDelay === 60 && err.message) {
          const messageMatch = err.message.match(/retry in ([\d.]+)s/i);
          if (messageMatch) {
            retryDelay = Math.ceil(parseFloat(messageMatch[1]));
          }
        }
        
        return {
          success: false,
          error: "QUOTA_EXCEEDED",
          message: "AI service quota exceeded. Please try again later.",
          retryAfter: retryDelay,
          statusCode: 429,
        };
      }

      return {
        success: false,
        error: "GENERATION_FAILED",
        message: "Failed to generate note from voice. Please try again.",
        statusCode: 500,
      };
    }
  }

  /**
   * Generate enhanced note with charts and images descriptions
   * Uses Gemini to create comprehensive notes with visual elements
   */
  static async generateEnhancedNote(
    userId: string,
    topic: string,
    includeCharts: boolean = true,
    includeImages: boolean = true
  ) {
    const prompt = `
You are an expert content creator. Generate a comprehensive, well-formatted note about: "${topic}"

Requirements:
1. Create a clear, engaging title
2. Write a concise synopsis (max 150 characters)
3. Generate detailed, well-structured content with:
   - Introduction
   - Main sections with clear headings (use # for main headings, ## for subheadings)
   - Key concepts explained clearly
   - Examples and use cases
   - Conclusion or summary

${includeCharts ? `4. Identify where charts/graphs would be helpful and describe them in this format:
   [CHART: Chart Type - Description]
   Example: [CHART: Bar Chart - Comparison of machine learning algorithms by accuracy]
` : ""}

${includeImages ? `5. Identify where images/diagrams would be helpful and describe them in this format:
   [IMAGE: Description of what the image should show]
   Example: [IMAGE: Neural network architecture diagram showing input, hidden, and output layers]
` : ""}

Format your response as JSON:
{
  "title": "Main title",
  "synopsis": "Brief synopsis",
  "content": "Well-formatted markdown content with [CHART] and [IMAGE] placeholders",
  "charts": ["Description of chart 1", "Description of chart 2"],
  "images": ["Description of image 1", "Description of image 2"]
}

Make it comprehensive, educational, and professional.`;

    try {
      const result = await model.generateContent(prompt);
      const text = await result.response.text();

      // Extract JSON
      let jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            title: parsed.title || topic,
            synopsis: parsed.synopsis || "",
            content: parsed.content || text,
            charts: parsed.charts || [],
            images: parsed.images || [],
          };
        } catch (parseError) {
          // Fallback parsing
        }
      }

      // Fallback extraction
      const titleMatch = text.match(/"title":\s*"([^"]+)"/i) || text.match(/Title[:\s]+([^\n]+)/i);
      const synopsisMatch = text.match(/"synopsis":\s*"([^"]+)"/i) || text.match(/Synopsis[:\s]+([^\n]+)/i);
      const contentMatch = text.match(/"content":\s*"([^"]+)"/i) || text.match(/Content[:\s]+([\s\S]+)/i);
      
      // Extract chart and image descriptions
      const chartMatches = text.match(/\[CHART:[^\]]+\]/gi) || [];
      const imageMatches = text.match(/\[IMAGE:[^\]]+\]/gi) || [];

      return {
        success: true,
        title: titleMatch?.[1]?.trim() || topic,
        synopsis: synopsisMatch?.[1]?.trim() || "",
        content: contentMatch?.[1]?.trim() || text,
        charts: chartMatches.map(m => m.replace(/\[CHART:\s*/i, "").replace(/\]$/, "").trim()),
        images: imageMatches.map(m => m.replace(/\[IMAGE:\s*/i, "").replace(/\]$/, "").trim()),
      };
    } catch (err: any) {
      console.error("Enhanced note generation failed:", err);
      
      if (err.status === 429 || err.statusCode === 429) {
        let retryDelay = 60;
        if (err.errorDetails && Array.isArray(err.errorDetails)) {
          const retryInfo = err.errorDetails.find(
            (detail: any) => detail?.["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
          );
          if (retryInfo?.retryDelay) {
            const delayMatch = String(retryInfo.retryDelay).match(/(\d+)/);
            if (delayMatch) {
              retryDelay = parseInt(delayMatch[1], 10);
            }
          }
        }
        
        return {
          success: false,
          error: "QUOTA_EXCEEDED",
          message: "AI service quota exceeded. Please try again later.",
          retryAfter: retryDelay,
          statusCode: 429,
        };
      }

      return {
        success: false,
        error: "GENERATION_FAILED",
        message: "Failed to generate enhanced note. Please try again.",
        statusCode: 500,
      };
    }
  }

  /**
   * Generate image from description using Gemini
   */
  static async generateImageFromDescription(description: string): Promise<string> {
    // Note: Gemini doesn't directly generate images, but we can use it to create image prompts
    // For actual image generation, you'd need to integrate with DALL-E, Stable Diffusion, or similar
    // For now, we'll return a placeholder and suggest using an image generation API
    
    const prompt = `
You are an image generation assistant. A user wants to create an image with this description: "${description}"

Since I cannot directly generate images, please provide:
1. A detailed image generation prompt that could be used with DALL-E, Midjourney, or Stable Diffusion
2. Suggestions for free image resources that match this description

Respond in JSON format:
{
  "prompt": "Detailed image generation prompt",
  "suggestions": ["suggestion 1", "suggestion 2"]
}
`;

    try {
      const result = await model.generateContent(prompt);
      const text = await result.response.text();
      
      // For now, return a placeholder image URL
      // In production, integrate with actual image generation API
      return `https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=${encodeURIComponent(description.substring(0, 50))}`;
    } catch (err: any) {
      console.error("Image generation prompt failed:", err);
      // Return placeholder
      return `https://via.placeholder.com/800x600/9CA3AF/FFFFFF?text=${encodeURIComponent(description.substring(0, 50))}`;
    }
  }
}
