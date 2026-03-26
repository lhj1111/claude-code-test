---
description: db + backend 에이전트 협업 — Zod 스키마 · Prisma 모델 · Hono 라우트 추가
argument-hint: <path> — <설명>
---

# /add-endpoint

db 에이전트와 backend 에이전트가 협업하여 API 엔드포인트를 추가합니다.

## 사용법
```
/add-endpoint <path> — <설명>
```
예시: `/add-endpoint /api/tags — 태그 CRUD`

---

## 작업 지침 (backend + db 에이전트 협업)

### 실행 순서

#### Step 1: db 에이전트 — Zod 스키마 + Prisma 모델

**Zod 스키마** (`packages/shared/src/schemas/{name}.ts`):
```ts
import { z } from 'zod';

export const {resource}Schema = z.object({
  id: z.string().uuid(),
  // ... 비즈니스 필드
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const create{Resource}Schema = {resource}Schema.omit({
  id: true, createdAt: true, updatedAt: true,
});
export const update{Resource}Schema = create{Resource}Schema.partial();

export type {Resource} = z.infer<typeof {resource}Schema>;
export type Create{Resource}Input = z.infer<typeof create{Resource}Schema>;
export type Update{Resource}Input = z.infer<typeof update{Resource}Schema>;
```

`packages/shared/src/index.ts`에 re-export 추가:
```ts
export * from './schemas/{name}';
```

**Prisma 모델** (`apps/api/prisma/schema.prisma`):
```prisma
model {Resource} {
  id        String   @id @default(uuid())
  // ... 비즈니스 필드
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

마이그레이션 실행 (Step 1 완료의 일부):
```bash
pnpm --filter api db:migrate
```
→ 마이그레이션 성공 확인 후 Step 2 시작

#### Step 2: backend 에이전트 — Hono 라우트

**라우트 파일** (`apps/api/src/routes/{name}/index.ts`):
```ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '../../db/client';
import { create{Resource}Schema, update{Resource}Schema } from '@repo/shared';

const app = new Hono();

app.get('/', async (c) => {
  const items = await prisma.{resource}.findMany({ orderBy: { createdAt: 'desc' } });
  return c.json({ data: items });
});

app.post('/', zValidator('json', create{Resource}Schema), async (c) => {
  const body = c.req.valid('json');
  const item = await prisma.{resource}.create({ data: body });
  return c.json({ data: item }, 201);
});

app.patch('/:id', zValidator('json', update{Resource}Schema), async (c) => {
  const { id } = c.req.param();
  const body = c.req.valid('json');
  try {
    const item = await prisma.{resource}.update({ where: { id }, data: body });
    return c.json({ data: item });
  } catch {
    return c.json({ error: { message: 'Not found', code: 'NOT_FOUND' } }, 404);
  }
});

app.delete('/:id', async (c) => {
  const { id } = c.req.param();
  try {
    await prisma.{resource}.delete({ where: { id } });
    return c.body(null, 204);
  } catch {
    return c.json({ error: { message: 'Not found', code: 'NOT_FOUND' } }, 404);
  }
});

export default app;
```

**라우트 등록** (`apps/api/src/routes/index.ts`):
```ts
import {resource}Route from './{resource}';
app.route('/api/{resources}', {resource}Route);
```

### API 응답 컨벤션
- 성공: `{ data: T }`
- 실패: `{ error: { message: string, code: string } }`
- HTTP: 200 GET/PATCH · 201 POST · 204 DELETE · 404 없음 · 422 유효성 오류

### 프로젝트 루트
`/mnt/d/Dev/claude-code-test`

### 검증
```bash
pnpm --filter api build
```

엔드포인트 이름, 리소스 필드, CRUD 범위가 불명확하면 사용자에게 확인한다.
