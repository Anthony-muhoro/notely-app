import prisma from "../config/prisma";
import imagekit from "../config/imagekit";
import { ApiError } from "../utils/apiError";
import { google } from "@ai-sdk/google";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
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
    } catch (err) {
      console.error("Gemini failed:", err);
      return {
        success: false,
        message: "Failed to generate a note",
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
    } catch (err) {
      console.error(" Failed to rewrite note content:", err);
      return {
        success: false,
        message: "Failed to rewrite the note content.",
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
      include: { images: true },
    });

    if (!note) {
      throw new ApiError(
        404,
        "Note not found or you do not have permission to delete it"
      );
    }

    // Delete images from ImageKit
    if (note.images.length > 0) {
      const deletePromises = note.images.map(async (image) => {
        try {
          await imagekit.deleteFile(image.imageId);
        } catch (error) {
          console.error("Error deleting image from ImageKit:", error);
        }
      });
      await Promise.all(deletePromises);
    }

    // Soft delete the note
    await prisma.note.update({
      where: { id: noteId },
      data: { isDeleted: true },
    });

    return { message: "Note deleted successfully" };
  }
  static async getUserDeletedNotes(userId: string) {
    const deletedNotes = await prisma.note.findMany({
      where: {
        creatorId: userId,
        isDeleted: true,
      },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
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

  static async addImagesToNote(
    noteId: string,
    userId: string,
    images: Express.Multer.File[]
  ) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, creatorId: userId, isDeleted: false },
      include: { images: true },
    });

    if (!note) {
      throw new ApiError(
        404,
        "Note not found or you do not have permission to modify it"
      );
    }

    const currentImageCount = note.images.length;
    if (currentImageCount + images.length > 10) {
      throw new ApiError(
        400,
        `Cannot add ${images.length} images. Maximum 10 images allowed per note.`
      );
    }

    const imagePromises = images.map(async (image, index) => {
      try {
        const result = await imagekit.upload({
          file: image.buffer,
          fileName: `note_${noteId}_${currentImageCount + index}_${Date.now()}`,
          folder: "/notes",
        });

        return prisma.noteImage.create({
          data: {
            noteId,
            imageUrl: result.url,
            imageId: result.fileId,
            alt: `Note image ${currentImageCount + index + 1}`,
            order: currentImageCount + index,
          },
        });
      } catch (error) {
        console.error("Error uploading image:", error);
        return null;
      }
    });

    const uploadedImages = await Promise.all(imagePromises);
    const successfulUploads = uploadedImages.filter((img) => img !== null);

    return successfulUploads;
  }

  static async removeImageFromNote(
    noteId: string,
    imageId: string,
    userId: string
  ) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, creatorId: userId, isDeleted: false },
    });

    if (!note) {
      throw new ApiError(
        404,
        "Note not found or you do not have permission to modify it"
      );
    }

    const image = await prisma.noteImage.findFirst({
      where: { id: imageId, noteId },
    });

    if (!image) {
      throw new ApiError(404, "Image not found");
    }

    try {
      await imagekit.deleteFile(image.imageId);
    } catch (error) {
      console.error("Error deleting image from ImageKit:", error);
    }

    await prisma.noteImage.delete({
      where: { id: imageId },
    });

    return { message: "Image removed successfully" };
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
}
