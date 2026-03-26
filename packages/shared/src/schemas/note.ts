import { z } from 'zod'

export const NoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string(),
  isPinned: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const CreateNoteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().default(''),
  isPinned: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
})

export const UpdateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  isPinned: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
})

export type Note = z.infer<typeof NoteSchema>
export type CreateNote = z.infer<typeof CreateNoteSchema>
export type UpdateNote = z.infer<typeof UpdateNoteSchema>
