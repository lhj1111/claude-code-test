import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { CreateNoteSchema, UpdateNoteSchema } from '@app/shared'
import { prisma } from '../../db/index.js'

const note = new Hono()

note.get('/', async (c) => {
  const notes = await prisma.note.findMany({ orderBy: { updatedAt: 'desc' } })
  return c.json({ data: notes })
})

note.post('/', zValidator('json', CreateNoteSchema), async (c) => {
  const body = c.req.valid('json')
  const note = await prisma.note.create({ data: body })
  return c.json({ data: note }, 201)
})

note.patch('/:id', zValidator('json', UpdateNoteSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.req.valid('json')
  try {
    const updated = await prisma.note.update({ where: { id }, data: body })
    return c.json({ data: updated })
  } catch {
    return c.json({ error: { message: 'Note not found', code: 'NOT_FOUND' } }, 404)
  }
})

note.delete('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    await prisma.note.delete({ where: { id } })
    return c.body(null, 204)
  } catch {
    return c.json({ error: { message: 'Note not found', code: 'NOT_FOUND' } }, 404)
  }
})

export default note
