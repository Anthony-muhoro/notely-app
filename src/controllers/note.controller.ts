import { Response, NextFunction } from "express";
import { NoteService } from "../services/note.service";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest, MulterRequest } from "../types";

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

  static addImages = asyncHandler(async (req: NoteRequest, res: Response) => {
    const { id } = req.params;

    const normalizedFiles = (
      Array.isArray(req.files)
        ? req.files
        : req.files
        ? Object.values(req.files).flat()
        : []
    ) as Express.Multer.File[];

    const images = await NoteService.addImagesToNote(
      id,
      req.user!.id,
      normalizedFiles
    );

    res
      .status(200)
      .json(new ApiResponse(200, images, "Images added successfully"));
  });

  static removeImage = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id, imageId } = req.params;
      const result = await NoteService.removeImageFromNote(
        id,
        imageId,
        req.user!.id
      );

      res
        .status(200)
        .json(new ApiResponse(200, result, "Image removed successfully"));
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
}
