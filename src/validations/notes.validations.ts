import { z } from "zod";

export const createNoteSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must not exceed 200 characters"),
    synopsis: z
      .string()
      .min(1, "Synopsis is required")
      .max(500, "Synopsis must not exceed 500 characters"),
    content: z.string().min(1, "Content is required"),
    isPublic: z.boolean().optional(),
    isBookmarked: z.boolean().optional(),
    isPinned: z.boolean().optional(),
  }),
});

export const updateNoteSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid note ID"),
  }),
  body: z.object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must not exceed 200 characters")
      .optional(),
    synopsis: z
      .string()
      .min(1, "Synopsis is required")
      .max(500, "Synopsis must not exceed 500 characters")
      .optional(),
    content: z.string().min(1, "Content is required").optional(),
    isPublic: z.boolean().optional(),
    isBookmarked: z.boolean().optional(),
    isPinned: z.boolean().optional(),
  }),
});

export const getNoteSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid note ID"),
  }),
});

export const getNotesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().optional(),
    isPublic: z
      .string()
      .regex(/^(true|false)$/)
      .transform((val) => val === "true")
      .optional(),
    isBookmarked: z
      .string()
      .regex(/^(true|false)$/)
      .transform((val) => val === "true")
      .optional(),
    isPinned: z
      .string()
      .regex(/^(true|false)$/)
      .transform((val) => val === "true")
      .optional(),
  }),
});
