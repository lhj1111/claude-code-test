# Claude Code 활용 가이드

이 프로젝트에서 Claude Code의 기능을 조합하는 방법.

---

## 구조 한눈에 보기

```
새 기능 아이디어
  │
  ├─ /new-feature (Skill)      ← 스캐폴딩 자동화
  │      │
  │      ├─ Phase 1: Schema Agent (단독)  → Zod 스키마 + Prisma 모델
  │      └─ Phase 2: API Agent ─┐ (병렬)
  │                 Frontend Agent ─┘
  │
  └─ /review (Skill)           ← 보안/성능/UX 병렬 리뷰
```

---

## 1. CLAUDE.md — 프로젝트 컨텍스트

모든 세션에 자동 로드. 직접 호출 불필요. 기술 스택, 디렉토리 구조, API·DB 컨벤션, 새 기능 추가 흐름 포함.

---

## 2. Skills — 슬래시 커맨드

### `/new-feature <name> — <설명>`

새 기능을 풀스택으로 스캐폴딩.

```
/new-feature bookmark — URL 북마크 저장 기능
/new-feature expense — 지출 내역 관리
/new-feature note — 마크다운 메모장
```

**내부 동작 (3단계)**:

```
Phase 1 — Schema Agent (혼자, 먼저 완료)
  packages/shared/src/schemas/{name}.ts  ← Zod 스키마
  apps/api/prisma/schema.prisma          ← Prisma 모델 추가

Phase 2 — API Agent + Frontend Agent (동시 병렬)
  API Agent:
    apps/api/src/routes/{name}/index.ts  ← Hono 라우트 (CRUD)
    apps/api/src/routes/index.ts         ← 라우트 등록

  Frontend Agent:
    apps/web/src/pages/{Name}/index.tsx  ← React 페이지
    apps/web/src/App.tsx                 ← 라우터 등록
    apps/web/src/pages/Home/index.tsx    ← Hub 카드 추가
```

Phase 1이 끝난 후에만 Phase 2 시작. Zod 스키마가 API 계약이므로 먼저 확정해야 함.

---

### `/db-migrate <migration-name>`

Prisma 마이그레이션 생성 + 실행.

```
/db-migrate add-bookmark-table
/db-migrate add-priority-to-expense
```

전제 조건: `docker compose up -d` 로 PostgreSQL 실행 중이어야 함.

---

### `/review <feature-name>`

기능을 보안/성능/UX 3가지 관점으로 병렬 검토.

```
/review todo
/review bookmark
```

**내부 동작** — Subagent 3개 동시 실행:

| Agent | 검토 대상 | 주요 항목 |
|-------|---------|---------|
| Security | `routes/{name}`, `schemas/{name}` | 입력 검증, 인증 누락, 민감 데이터 노출 |
| Performance | `routes/{name}`, `pages/{Name}` | N+1 쿼리, TanStack Query 설정, 리렌더 |
| UX | `pages/{Name}`, `{Name}.module.css` | 로딩/에러/빈 상태, 접근성, 모바일 |

출력: 🔴 즉시 수정 / 🟡 개선 권장 / 🟢 양호

---

### `/design <name> — <설명>`

요구사항 인터뷰 → 설계 문서 생성.

```
/design youtube-summary — YouTube 영상 자동 요약 앱
/design expense-tracker — 지출 내역 관리 앱
```

**내부 동작**:
1. 인터뷰 3단계 진행 (도메인 → 데이터 → 화면)
2. `.claude/designs/{name}.md` 설계 문서 자동 생성 (ERD + API + 화면 명세)
3. 사용자 확인 후 `/new-feature {name}` 으로 구현 시작

---

### `/fix-bug <설명>`

레이어 자동 분석 후 관련 에이전트로 버그 수정.

```
/fix-bug 투두 삭제 후 목록이 갱신 안 됨
/fix-bug POST /api/notes 422 오류
```

**내부 동작**:
1. 버그 설명에서 관련 파일/레이어 자동 분석
2. frontend / backend / db 중 해당 에이전트에 위임
3. 수정 완료 후 TypeScript 빌드 검증

---

### `/add-component <name> — <설명>`

frontend 에이전트 단독 — React 컴포넌트/페이지 추가.

```
/add-component SearchBar — 글로벌 검색 입력 컴포넌트
/add-component DarkModeToggle — 다크/라이트 모드 토글
```

**내부 동작**:
- `apps/web/src/` 하위 파일만 수정
- 필요 시 `App.tsx` 라우터 등록, `Home/index.tsx` 카드 추가

---

### `/add-endpoint <path> — <설명>`

backend + db 에이전트 협업 — API 엔드포인트 추가.

```
/add-endpoint /api/tags — 태그 CRUD
/add-endpoint /api/users/:id/profile — 사용자 프로필 조회
```

**내부 동작**:
1. db 에이전트: Prisma 모델 추가 + 마이그레이션
2. backend 에이전트: Hono 라우트 구현 + 라우트 등록

---

## 3. Subagents — 단독 집중 작업

단일 세션 내 독립 컨텍스트로 실행. 결과만 메인으로 반환.

**적합한 경우**:
- 특정 파일만 수정하는 단순 작업
- 기술 조사 및 라이브러리 리서치
- 읽기 전용 분석 (버그 원인 파악 등)

**예시 — 기술 조사**:
```
Use a subagent to research: TanStack Query v5 vs SWR for this project.
Compare API, bundle size, and TypeScript support.
Report pros/cons without making any code changes.
```

**예시 — 특정 컴포넌트 개선**:
```
Use a subagent to improve the Todo kanban board in
apps/web/src/pages/Todo/index.tsx:
- 드래그 앤 드롭으로 카드 이동 (react-beautiful-dnd)
- 카드 클릭 시 상세 편집 모달
Only modify files inside apps/web/src/pages/Todo/.
```

---

## 4. Agent Teams — 병렬 개발

각 팀원이 독립적인 Claude Code 세션으로 실행.

**시작 방법** (외부 터미널, tmux 필요):
```bash
claude --teammate-mode split
```

> **주의**: VS Code 통합 터미널, Windows Terminal에서 지원 안 됨.
> WSL + tmux 환경 필요.

**적합한 경우**:
- 큰 기능을 API/Frontend 동시에 빠르게 개발할 때
- 버그 원인을 여러 가설로 병렬 조사할 때

**예시 — 풀스택 기능 병렬 개발**:
```
Create an agent team to build a "note" feature (마크다운 메모장).

- Teammate 1 (schema): packages/shared/src/schemas/note.ts 생성
  Note Zod 스키마, CreateNote, UpdateNote 타입 정의
  packages/shared/src/index.ts 에 re-export 추가

- Teammate 2 (api): apps/api/src/routes/note/ 구현
  Teammate 1의 스키마를 기반으로 Hono CRUD 라우트
  apps/api/prisma/schema.prisma 에 Note 모델 추가

- Teammate 3 (frontend): apps/web/src/pages/Note/ 구현
  Teammate 1의 스키마 타입 사용, TanStack Query, CSS Modules
  App.tsx 라우터 등록, Home 카드 추가
```

**파일 소유권 원칙** — 두 팀원이 같은 파일 수정 시 덮어쓰기 발생:

| 팀원 | 담당 파일 | 절대 금지 |
|------|----------|---------|
| schema | `packages/shared/src/schemas/{name}.ts` | 다른 스키마 파일 |
| api | `apps/api/src/routes/{name}/` | `apps/web/` 일체 |
| frontend | `apps/web/src/pages/{Name}/` | `apps/api/` 일체 |

---

## 로컬 실행 요약

```bash
# 최초 1회 설정
pnpm install
docker compose up -d
pnpm db:migrate

# 개발 (매번)
pnpm dev           # web :5173 + api :3000 동시 실행
```

---

## 빠른 참조

| 상황 | 사용할 것 |
|------|---------|
| 새 스킬 생성/개선 | skill-creator 플러그인 |
| 복잡한 기능 설계 먼저 | `/design` |
| 새 기능 추가 (풀스택) | `/new-feature` |
| DB 스키마 변경 후 마이그레이션 | `/db-migrate` |
| 코드 품질 점검 | `/review` |
| 특정 파일 분석/단순 작업 | Subagent |
| 큰 기능 빠른 병렬 개발 | Agent Team |
| 버그 수정 | `/fix-bug` |
| UI 컴포넌트/페이지만 추가 | `/add-component` |
| API 엔드포인트만 추가 | `/add-endpoint` |
| 버그 원인 병렬 조사 | Agent Team (read-only) |
