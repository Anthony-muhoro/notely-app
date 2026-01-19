import { Response } from "express";
import { NoteService } from "../services/note.service";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../types";

type NoteRequest = AuthenticatedRequest & {
  files?:
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] };
};

export class NoteController {
  static createNote = asyncHandler(async (req: NoteRequest, res: Response) => {
    const note = await NoteService.createNote(
      req.user!.id,
      req.body,
      Array.isArray(req.files) ? req.files : []
    );

    res
      .status(201)
      .json(new ApiResponse(201, note, "Note created successfully"));
  });
  static createNotewithgemini = asyncHandler(
    async (req: NoteRequest, res: Response) => {
      const result = await NoteService.createwithgeminiNote(
        req.user!.id,
        req.body
      );

      if ((result as any).success === false) {
        const errorResult = result as any;
        const statusCode = errorResult.statusCode || 500;
        return res.status(statusCode).json({
          success: false,
          error: errorResult.error || "GENERATION_FAILED",
          message: errorResult.message || "Failed to generate a note",
          ...(errorResult.retryAfter && { retryAfter: errorResult.retryAfter }),
        });
      }

      res
        .status(201)
        .json(new ApiResponse(201, result, "Note created successfully"));
    }
  );
  static rewriteContentWithGemini = asyncHandler(
    async (req: NoteRequest, res: Response) => {
      const { content, title } = req.body;

      const result = await NoteService.rewriteNoteContentWithGemini(
        content,
        title
      );

      if ((result as any).success === false) {
        const errorResult = result as any;
        const statusCode = errorResult.statusCode || 500;
        return res.status(statusCode).json({
          success: false,
          error: errorResult.error || "REWRITE_FAILED",
          message: errorResult.message || "Failed to rewrite content",
          ...(errorResult.retryAfter && { retryAfter: errorResult.retryAfter }),
        });
      }

      res
        .status(200)
        .json(new ApiResponse(200, result, "Content rewritten successfully"));
    }
  );

  static getUserNotes = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const result = await NoteService.getUserNotes(req.user!.id, req.query);

      res
        .status(200)
        .json(new ApiResponse(200, result, "Notes retrieved successfully"));
    }
  );

  static getNoteById = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const note = await NoteService.getNoteById(id, req.user?.id);

      res
        .status(200)
        .json(new ApiResponse(200, note, "Note retrieved successfully"));
    }
  );

  static updateNote = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const note = await NoteService.updateNote(id, req.user!.id, req.body);

      res
        .status(200)
        .json(new ApiResponse(200, note, "Note updated successfully"));
    }
  );

  static deleteNote = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const result = await NoteService.deleteNote(id, req.user!.id);

      res
        .status(200)
        .json(new ApiResponse(200, result, "Note deleted successfully"));
    }
  );
  static pinNote = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const result = await NoteService.pinNote(id, req.user!.id);

      res.status(200).json(new ApiResponse(200, result, "Note pinned"));
    }
  );
  static unpinNote = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const result = await NoteService.unPinNote(id, req.user!.id);

      res.status(200).json(new ApiResponse(200, result, "Note unpinned"));
    }
  );
  static bookmarkNote = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const result = await NoteService.BoomarkNote(id, req.user!.id);

      res
        .status(200)
        .json(new ApiResponse(200, result, "Note added to bookmark"));
    }
  );
  static unbookmarkNote = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const result = await NoteService.remveNoteBookmark(id, req.user!.id);

      res
        .status(200)
        .json(new ApiResponse(200, result, "Note removed from bookmarks"));
    }
  );

  static getDeletedNotes = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const result = await NoteService.getUserDeletedNotes(req.user!.id);

      return res.status(200).json({
        message: result.message,
        notes: result.notes,
      });
    }
  );
  static getPinnedNotes = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const result = await NoteService.getUserpinneddNotes(req.user!.id);

      return res.status(200).json({
        message: result.message,
        notes: result.notes,
      });
    }
  );
  static getBookmappedNotes = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const result = await NoteService.getUserBokmarkeddNotes(req.user!.id);

      return res.status(200).json({
        message: result.message,
        notes: result.notes,
      });
    }
  );

  static restoreNote = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const result = await NoteService.restoreNote(id, req.user!.id);

      if (!result.success) {
        return res.status(404).json({ message: result.message });
      }

      return res.status(200).json({
        message: result.message,
        note: result.data,
      });
    }
  );

  static getPublicNotes = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const result = await NoteService.getPublicNotes(req.user!.id);

      res
        .status(200)
        .json(
          new ApiResponse(200, result, "Public notes retrieved successfully")
        );
    }
  );

  /**
   * Create note from voice input
   */
  static createNoteFromVoice = asyncHandler(
    async (req: NoteRequest, res: Response) => {
      const { voiceTranscript, topic } = req.body;

      if (!voiceTranscript || !voiceTranscript.trim()) {
        return res.status(400).json({
          success: false,
          message: "Voice transcript is required",
        });
      }

      const result = await NoteService.createNoteFromVoice(
        req.user!.id,
        voiceTranscript,
        topic
      );

      if ((result as any).success === false) {
        const errorResult = result as any;
        const statusCode = errorResult.statusCode || 500;
        return res.status(statusCode).json({
          success: false,
          error: errorResult.error || "GENERATION_FAILED",
          message: errorResult.message || "Failed to generate note from voice",
          ...(errorResult.retryAfter && { retryAfter: errorResult.retryAfter }),
        });
      }

      // Optionally create the note directly
      if (req.body.autoSave) {
        try {
          const note = await NoteService.createNote(req.user!.id, {
            title: result.title,
            synopsis: result.synopsis,
            content: result.content,
            isPublic: req.body.isPublic || false,
          });

          return res
            .status(201)
            .json(
              new ApiResponse(
                201,
                { note, generated: result },
                "Note created from voice successfully"
              )
            );
        } catch (error) {
          // Return generated content even if save fails
          return res.status(201).json(
            new ApiResponse(201, result, "Note generated from voice (save failed)")
          );
        }
      }

      res
        .status(201)
        .json(
          new ApiResponse(201, result, "Note generated from voice successfully")
        );
    }
  );

  /**
   * Generate enhanced note with charts and images
   */
  static generateEnhancedNote = asyncHandler(
    async (req: NoteRequest, res: Response) => {
      const { topic, includeCharts, includeImages } = req.body;

      if (!topic || !topic.trim()) {
        return res.status(400).json({
          success: false,
          message: "Topic is required",
        });
      }

      const result = await NoteService.generateEnhancedNote(
        req.user!.id,
        topic,
        includeCharts !== false, // Default to true
        includeImages !== false // Default to true
      );

      if ((result as any).success === false) {
        const errorResult = result as any;
        const statusCode = errorResult.statusCode || 500;
        return res.status(statusCode).json({
          success: false,
          error: errorResult.error || "GENERATION_FAILED",
          message: errorResult.message || "Failed to generate enhanced note",
          ...(errorResult.retryAfter && { retryAfter: errorResult.retryAfter }),
        });
      }

      // Optionally create the note directly
      if (req.body.autoSave) {
        try {
          const note = await NoteService.createNote(req.user!.id, {
            title: result.title,
            synopsis: result.synopsis,
            content: result.content,
            isPublic: req.body.isPublic || false,
          });

          return res.status(201).json(
            new ApiResponse(201, { note, generated: result }, "Enhanced note created successfully")
          );
        } catch (error) {
          return res.status(201).json(
            new ApiResponse(201, result, "Enhanced note generated (save failed)")
          );
        }
      }

      res
        .status(201)
        .json(
          new ApiResponse(201, result, "Enhanced note generated successfully")
        );
    }
  );

  /**
   * Generate image from description
   */
  static generateImage = asyncHandler(
    async (req: NoteRequest, res: Response) => {
      const { description } = req.body;

      if (!description || !description.trim()) {
        return res.status(400).json({
          success: false,
          message: "Image description is required",
        });
      }

      const imageUrl = await NoteService.generateImageFromDescription(description);

      res.status(200).json(
        new ApiResponse(200, { imageUrl, description }, "Image generated successfully")
      );
    }
  );
}
