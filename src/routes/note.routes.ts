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

NotesRouter.use(protect);

// Group public routes
NotesRouter.get(
  "/public/:id",
  validate(getNoteSchema),
  NoteController.getNoteById
);
NotesRouter.get("/public", NoteController.getPublicNotes);
NotesRouter.get("/", validate(getNotesSchema), NoteController.getUserNotes);
NotesRouter.get("/deleted-notes", protect, NoteController.getDeletedNotes);
NotesRouter.get("/:id", NoteController.getNoteById);
NotesRouter.put("/:id/restore", protect, NoteController.restoreNote);
NotesRouter.post(
  "/",
  uploadImages,
  validate(createNoteSchema),
  NoteController.createNote
);
NotesRouter.post("/gemininote", protect, NoteController.createNotewithgemini);
NotesRouter.post("/rewrite", protect, NoteController.rewriteContentWithGemini);
NotesRouter.put("/:id", validate(updateNoteSchema), NoteController.updateNote);
NotesRouter.delete("/:id", validate(getNoteSchema), NoteController.deleteNote);
NotesRouter.post("/:id/images", uploadImages, NoteController.addImages);
NotesRouter.delete("/:id/images/:imageId", NoteController.removeImage);
export default NotesRouter;
