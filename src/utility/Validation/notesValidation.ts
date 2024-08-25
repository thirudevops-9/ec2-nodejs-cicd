import z from "zod";

export const createNotesValidation = z.object({
  title: z.string().min(1, "title is required"),
  description: z.string().min(1, "description is required"),
  color: z.string().min(1, "color is required"),
});

export const updateNotesValidation = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
});
