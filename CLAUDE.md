# Claude Code Test Lab

Node.js + React + PostgreSQL 풀스택 모노레포.
새 기능(페이지 + API)을 추가하는 방식으로 성장한다.

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | React 18 + Vite + TypeScript |
| Routing | React Router v6 |
| Server State | TanStack Query v5 |
| Backend | Node.js + Hono |
| ORM | Prisma |
| Validation | Zod (shared) |
| DB | PostgreSQL 16 |
| 패키지 관리 | pnpm workspaces |
| 인프라 | Docker Compose (DB only) |

---

## 디렉토리 구조

```
claude-code-test/
├── apps/
│   ├── web/                    # React + Vite (포트 5173)
│   │   └── src/
│   │       ├── pages/          # 각 기능 페이지
│   │       ├── components/     # 공통 컴포넌트
│   │       ├── contexts/       # React Context (Toast 등)
│   │       └── hooks/          # 공통 커스텀 훅
│   └── api/                    # Hono API 서버 (포트 3000)
│       ├── prisma/
│       │   └── schema.prisma
│       └── src/
│           ├── routes/         # 기능별 라우트
│           └── db/             # Prisma 클라이언트
├── packages/
│   └── shared/                 # 프론트↔백 공유 Zod 스키마
├── docker-compose.yml          # PostgreSQL
├── pnpm-workspace.yaml
└── package.json                # root scripts
```

---

## 로컬 실행

```bash
# 최초 설정 (최초 1회)
pnpm install
docker compose up -d
pnpm db:migrate

# 개발 서버 (web :5173 + api :3000 동시 실행)
pnpm dev
```

---

## Design-First 흐름 (복잡한 기능 권장)

**스킬 사용**: `/design <name> — <설명>`

1. 인터뷰 3단계 진행 (도메인 → 데이터 → 화면)
2. `.claude/designs/{name}.md` 설계 문서 자동 생성
3. 사용자 확인 후 `/new-feature {name}` 으로 구현 시작

---

## 새 기능 추가 흐름

**스킬 사용**: `/new-feature <name> — <설명>`

**수동**:
1. `packages/shared/src/schemas/{name}.ts` — Zod 스키마 (API 계약)
2. `apps/api/prisma/schema.prisma` — Prisma 모델 추가
3. `pnpm db:migrate` — 마이그레이션 실행
4. `apps/api/src/routes/{name}/index.ts` — Hono 라우트
5. `apps/api/src/routes/index.ts` — 라우트 등록
6. `apps/web/src/pages/{Name}/index.tsx` — React 페이지
7. `apps/web/src/App.tsx` — 라우터 등록
8. `apps/web/src/pages/Home/index.tsx` — Hub 카드 추가

---

## 컨벤션

### API
- 엔드포인트: `/api/{resource}` (복수 명사, kebab-case)
- 응답 형식:
  ```ts
  { data: T }                                          // 성공
  { error: { message: string, code: string } }         // 실패
  ```
- HTTP 코드: 200 GET/PATCH · 201 POST · 204 DELETE · 404 없음 · 422 유효성 오류

### DB (Prisma)
- 모델명: PascalCase 단수 (예: `Todo`)
- 필드명: camelCase
- 모든 모델: `id` (uuid) · `createdAt` · `updatedAt` 필수

### Frontend
- 페이지: `apps/web/src/pages/{Name}/index.tsx`
- 서버 데이터: TanStack Query (`useQuery`, `useMutation`)
- 스타일: CSS Modules (`{Name}.module.css`)
- API 호출 함수는 페이지 파일 상단에 정의

### Shared
- 새 기능 Zod 스키마 → `packages/shared/src/schemas/{name}.ts`
- `packages/shared/src/index.ts` 에서 re-export 필수

---

전체 워크플로우 가이드: **GUIDE.md** 참조

---

## 에이전트 (`.claude/agents/`)

역할별 서브에이전트. `@에이전트명`으로 명시 호출하거나 Claude가 자동 위임한다.

| 에이전트 | 담당 경로 | 역할 |
|----------|-----------|------|
| `team-lead` | 전체 | 태스크 분배, 에이전트 조율, 통합 검증 |
| `frontend` | `apps/web/src/` | React 페이지/컴포넌트, TanStack Query, CSS Modules |
| `backend` | `apps/api/src/`, `packages/shared/src/` | Hono 라우트, Zod 스키마, API 응답 형식 |
| `db` | `apps/api/prisma/` | Prisma 스키마 설계, 마이그레이션 실행 |
| `tester` | 읽기/실행 전용 | API curl 테스트, TypeScript 빌드 검증, 결과 보고 |

**호출 방법**:
```
@frontend 새 페이지 만들어줘
@backend /api/products 엔드포인트 추가해줘
@db User 모델 추가해줘
```
