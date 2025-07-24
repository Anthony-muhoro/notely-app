import { Router } from "express";
import { NoteController } from "../controllers/note.controller";
import { validate } from "../utils/validation";
import { protect } from "../middlewares/auth.middleware";
import { uploadImages } from "../middlewares/upload.middleware";
import {
  createNoteSchema,
  updateNoteSchema,
  getNoteSchema,
  getNotesSchema,
} from "../validations/notes.validations";

const NotesRouter = Router();

NotesRouter.get(
  "/public/:id",
  validate(getNoteSchema),
  NoteController.getNoteById
);

// Protected routes
NotesRouter.use(protect);

NotesRouter.post(
  "/",
  uploadImages,
  validate(createNoteSchema),
  NoteController.createNote
);
NotesRouter.get("/", validate(getNotesSchema), NoteController.getUserNotes);
NotesRouter.get("/:id", validate(getNoteSchema), NoteController.getNoteById);
NotesRouter.put("/:id", validate(updateNoteSchema), NoteController.updateNote);
NotesRouter.delete("/:id", validate(getNoteSchema), NoteController.deleteNote);
NotesRouter.post("/:id/images", uploadImages, NoteController.addImages);
NotesRouter.delete("/:id/images/:imageId", NoteController.removeImage);
NotesRouter.get(
  "/public",
  validate(getNotesSchema),
  NoteController.getPublicNotes
);
export default NotesRouter;
