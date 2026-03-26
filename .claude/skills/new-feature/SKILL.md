---
description: 새 기능을 풀스택으로 스캐폴딩 (Zod 스키마 → API → React 페이지)
argument-hint: <name> — <설명>
---

# /new-feature

새 기능을 풀스택으로 스캐폴딩합니다.

## 사용법
```
/new-feature <name> — <설명>
```
예시: `/new-feature bookmark — URL 북마크 저장 기능`

## 실행 단계

### Phase 1 — Schema Agent (직렬, 먼저 완료)

`packages/shared/src/schemas/{name}.ts` 생성:
- 메인 엔티티 Zod 스키마 (전체 필드)
- Create/Update 입력 스키마
- TypeScript 타입 export

`packages/shared/src/index.ts` 에 re-export 추가

### Phase 2 — API Agent + Frontend Agent (병렬, Phase 1 완료 후 시작)

**API Agent** (Phase 1 Zod 스키마 완료 후 시작):
1. `apps/api/prisma/schema.prisma` 에 모델 추가 + 마이그레이션 실행
   ```bash
   pnpm --filter api db:migrate
   ```
2. `apps/api/src/routes/{name}/index.ts` Hono 라우트 구현
   - GET / (목록)
   - POST / (생성)
   - PATCH /:id (수정)
   - DELETE /:id (삭제)
   - zValidator로 입력 검증
   - `{ data: T }` / `{ error: { message, code } }` 응답 형식
3. `apps/api/src/routes/index.ts` 에 라우트 등록

**Frontend Agent** (Phase 1 Zod 스키마 완료 후 시작):
1. `apps/web/src/pages/{Name}/index.tsx` React 페이지 구현
   - TanStack Query (`useQuery`, `useMutation`) 사용
   - CSS Modules 스타일링
   - 로딩/에러/빈 상태 처리
2. `apps/web/src/App.tsx` 라우터에 `/{name}` 등록
3. `apps/web/src/pages/Home/index.tsx` PROJECTS 배열에 카드 추가

## 에이전트 팀 구성

```
Phase 1: Schema Agent (단독)
         ↓ 완료 후
Phase 2: API Agent ─┐ (병렬)
         Frontend Agent ─┘
```

Phase 1이 완료된 후에만 Phase 2를 시작한다.
Phase 2의 두 에이전트는 같은 Zod 스키마를 입력으로 독립적으로 작업한다.
