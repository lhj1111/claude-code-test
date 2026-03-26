import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { CreateTodoSchema, UpdateTodoSchema } from '@app/shared'
import { prisma } from '../../db/index.js'

const todo = new Hono()

todo.get('/', async (c) => {
  const todos = await prisma.todo.findMany({ orderBy: { createdAt: 'desc' } })
  return c.json({ data: todos })
})

todo.post('/', zValidator('json', CreateTodoSchema), async (c) => {
  const body = c.req.valid('json')
  const todo = await prisma.todo.create({
    data: {
      title: body.title,
      priority: body.priority ?? 'none',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  })
  return c.json({ data: todo }, 201)
})

todo.patch('/:id', zValidator('json', UpdateTodoSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.req.valid('json')
  try {
    const updated = await prisma.todo.update({
      where: { id },
      data: {
        ...body,
        dueDate: body.dueDate !== undefined
          ? (body.dueDate ? new Date(body.dueDate) : null)
          : undefined,
      },
    })
    return c.json({ data: updated })
  } catch {
    return c.json({ error: { message: 'Todo not found', code: 'NOT_FOUND' } }, 404)
  }
})

todo.delete('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    await prisma.todo.delete({ where: { id } })
    return c.body(null, 204)
  } catch {
    return c.json({ error: { message: 'Todo not found', code: 'NOT_FOUND' } }, 404)
  }
})

export default todo
