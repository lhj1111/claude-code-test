import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { SummaryCategory } from '@prisma/client'
import { prisma } from '../../db/index.js'
import { CreateSummarySchema, UpdateSummarySchema } from '@app/shared'
import { summarize } from './summarizer.js'

const app = new Hono()

// GET / — 목록 조회 (카테고리 필터 + 키워드 검색)
app.get('/', async (c) => {
  const { category, q } = c.req.query()

  const items = await prisma.summary.findMany({
    where: {
      ...(category && category !== 'ALL'
        ? { category: category as SummaryCategory }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { summary: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return c.json({ data: items })
})

// POST / — URL 제출 → 요약 시작
app.post('/', zValidator('json', CreateSummarySchema), async (c) => {
  const body = c.req.valid('json')

  const item = await prisma.summary.create({
    data: {
      url: body.url,
      category: body.category as SummaryCategory,
      provider: body.provider,
      status: 'PENDING',
    },
  })

  // 비동기 요약 시작 (await 없음 — 즉시 반환)
  summarize(item.id, body.url, body.provider).catch(console.error)

  return c.json({ data: item }, 201)
})

// GET /:id — 단일 조회 (폴링용)
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const item = await prisma.summary.findUnique({ where: { id } })

  if (!item) {
    return c.json(
      { error: { message: '요약을 찾을 수 없습니다.', code: 'NOT_FOUND' } },
      404
    )
  }

  return c.json({ data: item })
})

// PATCH /:id — 메모 수정
app.patch('/:id', zValidator('json', UpdateSummarySchema), async (c) => {
  const id = c.req.param('id')
  const body = c.req.valid('json')

  try {
    const item = await prisma.summary.update({
      where: { id },
      data: { memo: body.memo },
    })
    return c.json({ data: item })
  } catch {
    return c.json(
      { error: { message: '요약을 찾을 수 없습니다.', code: 'NOT_FOUND' } },
      404
    )
  }
})

// DELETE /bulk — 벌크 삭제
const BulkDeleteSchema = z.object({ ids: z.array(z.string()).min(1) })

app.delete('/bulk', zValidator('json', BulkDeleteSchema), async (c) => {
  const { ids } = c.req.valid('json')

  const result = await prisma.summary.deleteMany({
    where: { id: { in: ids } },
  })

  return c.json({ data: { deleted: result.count } })
})

// DELETE /:id — 단건 삭제
app.delete('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    await prisma.summary.delete({ where: { id } })
    return c.body(null, 204)
  } catch {
    return c.json(
      { error: { message: '요약을 찾을 수 없습니다.', code: 'NOT_FOUND' } },
      404
    )
  }
})

export default app
