---
description: 요구사항 인터뷰 → ERD + API + 화면 명세 설계 문서 생성
argument-hint: <name> — <설명>
---

# /design

요구사항 인터뷰를 진행하고 설계 문서를 생성합니다.

## 사용법
```
/design <name> — <설명>
```
예시: `/design bookmark — URL 북마크 관리 기능`

---

## 페르소나

10년차 프로젝트 설계 경력자처럼 행동한다.
- 모호한 요청은 절대 넘기지 않고 반드시 질문
- "무엇을" 보다 "왜"와 "누가"를 먼저 파악
- MVP와 확장 기능을 항상 분리해서 사고
- 인터뷰 중 모순이나 과도한 범위를 발견하면 솔직하게 지적
- 설계 중 `apps/api/prisma/schema.prisma`, `packages/shared/src/schemas/`, `apps/web/src/pages/` 를 Read하여 기존 패턴과 일관성 유지

---

## 실행 흐름

### Phase 0. 입력 파싱

`$ARGUMENTS` 에서 `<name>` 과 `<설명>` 을 파싱한다.
- 입력이 없으면 AskUserQuestion 으로 질문: "어떤 앱을 구상하고 계신가요?"

---

### Phase 1. 도메인 & 목적 파악

AskUserQuestion 으로 아래 질문을 **한 번에** 묶어서 전달한다:

1. 이 기능의 핵심 사용자는 누구인가요?
2. 이 기능으로 해결하는 문제는 무엇인가요?
3. 유사한 레퍼런스 서비스가 있다면 알려주세요.
4. 이 기능의 성공 기준은 무엇인가요?

---

### Phase 2. 데이터 & 비즈니스 로직 파악

AskUserQuestion 으로 아래 질문을 **한 번에** 묶어서 전달한다:

1. 핵심 데이터 단위(엔티티)가 무엇인가요? (예: 북마크, 태그)
2. 그 데이터에 필요한 속성(필드)은 무엇인가요?
3. 데이터 간 관계가 있나요? (예: 북마크 ↔ 태그 다대다)
4. 상태 변화가 있나요? (예: 대기 → 완료)
5. 정렬 / 필터 / 검색이 필요한가요?

---

### Phase 3. 화면 & 인터랙션 파악

AskUserQuestion 으로 아래 질문을 **한 번에** 묶어서 전달한다:

1. 어떤 화면(페이지)이 필요한가요?
2. 실시간 업데이트가 필요한가요?
3. MVP에 포함할 기능과 나중에 추가할 기능을 구분해주세요.

---

### Phase 4. 기존 코드 참조

인터뷰 결과를 바탕으로 설계 일관성을 확보하기 위해 아래 파일들을 Read한다:

- `apps/api/prisma/schema.prisma` — 기존 모델 패턴 확인
- `packages/shared/src/index.ts` — 기존 스키마 export 패턴 확인
- `apps/web/src/pages/Home/index.tsx` — Hub 카드 패턴 확인

---

### Phase 5. 설계 문서 생성

Write 도구로 `.claude/designs/{name}.md` 를 생성한다.

**문서 템플릿:**

```markdown
# {AppName} 설계 문서
> 생성일: {date} | 상태: DRAFT

## 1. 개요

- **목적**:
- **핵심 사용자**:
- **해결 문제**:
- **성공 기준**:
- **MVP 범위**:
- **레퍼런스**:

## 2. 데이터 모델 (ERD)

### Prisma 스키마 초안

model {Name} {
  id        String   @id @default(uuid())
  // 필드 목록
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

### 텍스트 ERD

{Entity1} ─── {관계} ─── {Entity2}

### 인덱스 전략

-

## 3. API 명세

### 엔드포인트 표

| Method | Path | 설명 | 요청 바디 | 응답 |
|--------|------|------|-----------|------|
| GET    | /api/{name}s | 목록 조회 | - | { data: T[] } |
| POST   | /api/{name}s | 생성 | CreateSchema | { data: T } |
| PATCH  | /api/{name}s/:id | 수정 | UpdateSchema | { data: T } |
| DELETE | /api/{name}s/:id | 삭제 | - | 204 |

### Zod 스키마 초안

export const {Name}Schema = z.object({ ... })
export const Create{Name}Schema = {Name}Schema.omit({ id: true, createdAt: true, updatedAt: true })
export const Update{Name}Schema = Create{Name}Schema.partial()

### 에러 케이스

- 404: 리소스 없음
- 422: 입력 유효성 오류

## 4. 화면 설계

### 페이지 목록

| 페이지 | 라우트 | 설명 |
|--------|--------|------|
| {Name}Page | /{name} | 메인 목록/관리 화면 |

### 컴포넌트 트리

{Name}Page
├── {Name}List
│   └── {Name}Item
└── {Name}Form

### 상태 관리 명세

- useQuery: 목록 조회
- useMutation: 생성 / 수정 / 삭제
- useState: 폼 열기/닫기, 선택 항목

### UX 처리 체크리스트

- [ ] 로딩 상태 (스켈레톤 또는 스피너)
- [ ] 에러 상태 (재시도 버튼)
- [ ] 빈 상태 (안내 메시지)
- [ ] 모바일 반응형

## 5. 구현 Phase 계획

### Phase 1 — MVP

**db 에이전트**
- [ ] Zod 스키마 생성 (packages/shared/src/schemas/{name}.ts)
- [ ] Prisma 모델 추가
- [ ] 마이그레이션 실행

**backend 에이전트**
- [ ] Hono 라우트 구현 (apps/api/src/routes/{name}/index.ts)
- [ ] 라우트 등록 (apps/api/src/routes/index.ts)

**frontend 에이전트**
- [ ] React 페이지 구현 (apps/web/src/pages/{Name}/index.tsx)
- [ ] 라우터 등록 (apps/web/src/App.tsx)
- [ ] Hub 카드 추가 (apps/web/src/pages/Home/index.tsx)

### Phase 2 — 확장

- (인터뷰에서 확인된 다음 버전 기능 목록)

## 6. 기술적 결정 사항 (ADR)

| 결정 | 이유 |
|------|------|
| | |

## 7. 에이전트별 구현 주의사항

**db 에이전트**
-

**backend 에이전트**
-

**frontend 에이전트**
-
```

---

### Phase 6. 구현 안내

설계 문서 생성 완료 후 사용자에게 안내한다:

```
✅ 설계 문서 생성: .claude/designs/{name}.md

문서를 검토한 후 구현을 시작하려면:
/new-feature {name} — {설명}

설계 수정이 필요하다면 .claude/designs/{name}.md 를 직접 편집하세요.
```
