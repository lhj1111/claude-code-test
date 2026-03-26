import { z } from 'zod'

export const TodoStatus = z.enum(['todo', 'in-progress', 'done'])
export const TodoPriority = z.enum(['none', 'low', 'medium', 'high', 'urgent'])

export const TodoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  status: TodoStatus,
  priority: TodoPriority,
  dueDate: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const CreateTodoSchema = z.object({
  title: z.string().min(1).max(500),
  priority: TodoPriority.default('none'),
  dueDate: z.string().datetime().nullable().optional(),
})

export const UpdateTodoSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  status: TodoStatus.optional(),
  priority: TodoPriority.optional(),
  dueDate: z.string().datetime().nullable().optional(),
})

export type Todo = z.infer<typeof TodoSchema>
export type CreateTodo = z.infer<typeof CreateTodoSchema>
export type UpdateTodo = z.infer<typeof UpdateTodoSchema>
