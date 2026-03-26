# YouTube Summary 설계 문서

> 생성일: 2026-03-20 | 상태: DRAFT

---

## 1. 개요

- **목적**: 유튜브 링크를 입력하면 AI가 영상 내용을 자동 요약해주는 개인 생산성 도구
- **핵심 사용자**: 개인 (나 혼자 쓰는 도구)
- **해결 문제**: 긴 영상을 끝까지 볼 시간이 없고, 요약 결과를 저장해서 나중에 다시 찾고 싶다
- **성공 기준**: 요약을 저장하고 키워드/카테고리로 검색할 수 있으면 성공
- **MVP 범위**:
  - URL 입력 → AI 요약 생성 (진행 상태 표시)
  - 요약 목록 조회
  - 카테고리 필터 + 키워드 검색
  - 메모 작성/수정
- **Phase 2**: 수출 (PDF/클립보드)

---

## 2. 데이터 모델 (ERD)

### Prisma 스키마 초안

```prisma
enum SummaryCategory {
  TECH
  ECONOMY
  ENTERTAINMENT
  EDUCATION
  OTHER
}

enum SummaryStatus {
  PENDING     // 요청 접수됨
  PROCESSING  // AI 요약 중
  DONE        // 완료
  ERROR       // 실패 (자막 없음 등)
}

model Summary {
  id        String          @id @default(uuid())
  url       String
  title     String          @default("")
  summary   String          @default("") @db.Text
  memo      String          @default("") @db.Text
  category  SummaryCategory @default(OTHER)
  status    SummaryStatus   @default(PENDING)
  errorMsg  String?
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  @@index([category])
  @@index([status])
  @@index([createdAt(sort: Desc)])
}
```

### 텍스트 ERD

```
Summary (단일 엔티티, 관계 없음)
  id, url, title, summary, memo
  category (TECH|ECONOMY|ENTERTAINMENT|EDUCATION|OTHER)
  status (PENDING → PROCESSING → DONE | ERROR)
```

### 인덱스 전략

- `category`: 카테고리 필터링이 자주 발생
- `status`: 진행 중인 요약 조회 시 필요
- `createdAt DESC`: 기본 목록 정렬 (최신순)

---

## 3. API 명세

### 엔드포인트 표

| Method | Path | 설명 | 요청 | 응답 |
|--------|------|------|------|------|
| GET | `/api/summaries` | 목록 조회 (필터/검색) | `?category=TECH&q=검색어` | `{ data: Summary[] }` |
| POST | `/api/summaries` | URL 제출 → 요약 시작 | `CreateSummarySchema` | `{ data: Summary }` 201 |
| GET | `/api/summaries/:id` | 단일 조회 (폴링용) | - | `{ data: Summary }` |
| PATCH | `/api/summaries/:id` | 메모 수정 | `UpdateSummarySchema` | `{ data: Summary }` |
| DELETE | `/api/summaries/:id` | 삭제 | - | 204 |

### Zod 스키마 초안

```ts
// packages/shared/src/schemas/youtube-summary.ts

export const SummaryCategorySchema = z.enum([
  'TECH', 'ECONOMY', 'ENTERTAINMENT', 'EDUCATION', 'OTHER'
])

export const SummaryStatusSchema = z.enum([
  'PENDING', 'PROCESSING', 'DONE', 'ERROR'
])

export const SummarySchema = z.object({
  id:        z.string().uuid(),
  url:       z.string().url(),
  title:     z.string(),
  summary:   z.string(),
  memo:      z.string(),
  category:  SummaryCategorySchema,
  status:    SummaryStatusSchema,
  errorMsg:  z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const CreateSummarySchema = z.object({
  url:      z.string().url({ message: '유효한 유튜브 URL을 입력해주세요' }),
  category: SummaryCategorySchema.default('OTHER'),
})

export const UpdateSummarySchema = z.object({
  memo: z.string(),
})

export type Summary = z.infer<typeof SummarySchema>
export type CreateSummary = z.infer<typeof CreateSummarySchema>
export type UpdateSummary = z.infer<typeof UpdateSummarySchema>
export type SummaryCategory = z.infer<typeof SummaryCategorySchema>
export type SummaryStatus = z.infer<typeof SummaryStatusSchema>
```

### 에러 케이스

| 상황 | HTTP | code |
|------|------|------|
| 요약 없음 | 404 | NOT_FOUND |
| URL 유효성 오류 | 422 | VALIDATION_ERROR |
| 유튜브 자막 없는 영상 | 200 (status: ERROR) | - (errorMsg에 사유 기록) |
| AI 호출 실패 | 200 (status: ERROR) | - |

> 자막 없음/AI 실패는 HTTP 에러가 아니라 Summary.status = ERROR로 표현한다.
> 이렇게 해야 프론트엔드가 폴링 결과로 실패를 인식할 수 있다.

---

## 4. 화면 설계

### 페이지 목록

| 페이지 | 라우트 | 설명 |
|--------|--------|------|
| YoutubeSummaryPage | `/youtube-summary` | 목록(좌) + 사이드패널(우) 레이아웃 |

### 컴포넌트 트리

```
YoutubeSummaryPage
├── SummaryForm          # URL 입력 + 카테고리 선택 + 제출 버튼
├── SearchBar            # 키워드 검색 입력
├── CategoryFilter       # 전체/TECH/ECONOMY/ENTERTAINMENT/EDUCATION/OTHER 탭
├── SummaryList          # 좌측 목록
│   └── SummaryItem      # 제목, 카테고리 뱃지, 상태 아이콘, 날짜
└── SummaryDetail        # 우측 사이드패널 (선택된 항목이 없으면 안내 문구)
    ├── SummaryHeader    # 제목, 유튜브 링크, 카테고리
    ├── StatusIndicator  # PENDING/PROCESSING: 진행 바 + 애니메이션
    ├── SummaryContent   # DONE: 요약 텍스트 (마크다운 렌더링 고려)
    ├── ErrorMessage     # ERROR: 실패 사유 표시
    └── MemoEditor       # 메모 textarea + 저장 버튼
```

### 상태 관리 명세

| 상태 | 타입 | 관리 |
|------|------|------|
| 요약 목록 | `Summary[]` | `useQuery(['summaries', {category, q}])` |
| 선택된 요약 상세 | `Summary` | `useQuery(['summary', id], { refetchInterval })` |
| 폴링 활성화 여부 | 자동 | status가 PENDING/PROCESSING일 때 2초마다 refetch |
| 생성 뮤테이션 | - | `useMutation` → onSuccess 시 목록 invalidate |
| 메모 수정 뮤테이션 | - | `useMutation` (낙관적 업데이트) |
| 삭제 뮤테이션 | - | `useMutation` → onSuccess 시 selectedId 초기화 |
| 선택된 항목 ID | `string \| null` | `useState` |
| 검색어 | `string` | `useState` (디바운스 300ms) |
| 카테고리 필터 | `SummaryCategory \| 'ALL'` | `useState` |

### UX 처리 체크리스트

- [ ] 로딩 상태: 목록 스켈레톤, 사이드패널 스피너
- [ ] PENDING/PROCESSING: 진행 바 + "AI가 요약 중입니다..." 텍스트
- [ ] ERROR 상태: 빨간 아이콘 + errorMsg 표시 + 재시도 버튼 (선택)
- [ ] 빈 상태: 목록 비어있을 때 "첫 번째 영상을 요약해보세요" CTA
- [ ] 사이드패널 미선택: "영상을 선택하세요" 안내
- [ ] 모바일: 목록 전체 너비, 선택 시 상세 오버레이
- [ ] URL 중복 제출 방지: 제출 후 버튼 비활성화
- [ ] 메모 자동저장 또는 명시적 저장 버튼 (명시적 권장 — 실수 방지)

---

## 5. 구현 Phase 계획

### Phase 1 — MVP

**db 에이전트**
- [ ] `packages/shared/src/schemas/youtube-summary.ts` 작성 (Zod 스키마)
- [ ] `packages/shared/src/index.ts` re-export 추가
- [ ] `apps/api/prisma/schema.prisma`에 enum + Summary 모델 추가
- [ ] `pnpm db:migrate` 실행 (`add-youtube-summary`)

**backend 에이전트**
- [ ] `apps/api/src/routes/youtube-summary/index.ts` 구현
  - GET `/api/summaries` (category, q 쿼리 파라미터 지원)
  - POST `/api/summaries` → DB에 PENDING 저장 후 즉시 반환, 비동기 요약 시작
  - GET `/api/summaries/:id`
  - PATCH `/api/summaries/:id` (memo만 수정)
  - DELETE `/api/summaries/:id`
- [ ] `apps/api/src/routes/youtube-summary/summarizer.ts` — AI 요약 로직
  - `youtube-transcript` 패키지로 자막 추출
  - `@anthropic-ai/sdk` 로 Claude API 호출
  - Summary 상태 업데이트 (PROCESSING → DONE | ERROR)
- [ ] `apps/api/src/routes/index.ts`에 라우트 등록
- [ ] `apps/api/package.json`에 패키지 추가: `youtube-transcript`, `@anthropic-ai/sdk`

**frontend 에이전트**
- [ ] `apps/web/src/pages/YoutubeSummary/index.tsx` 구현
- [ ] `apps/web/src/pages/YoutubeSummary/YoutubeSummary.module.css`
- [ ] `apps/web/src/App.tsx`에 `/youtube-summary` 라우트 등록
- [ ] `apps/web/src/pages/Home/index.tsx`에 Hub 카드 추가
  - icon: `Youtube` (lucide-react)
  - color: `'red'`
  - desc: `'AI 요약 · 카테고리 · 검색 · 메모'`

### Phase 2 — 확장

- [ ] 수출: 요약 내용 클립보드 복사 버튼
- [ ] 수출: PDF 다운로드 (`react-to-pdf` 또는 `jsPDF`)
- [ ] 요약 재생성: 다른 스타일(짧게/상세히) 선택 재요청

---

## 6. 기술적 결정 사항 (ADR)

| 결정 | 선택 | 이유 |
|------|------|------|
| 비동기 처리 방식 | POST → PENDING 즉시 반환 + 프론트 폴링 | WebSocket/SSE는 MVP 오버엔지니어링. 폴링(2초)으로 충분 |
| YouTube 자막 추출 | `youtube-transcript` npm 패키지 | API Key 불필요, 구현 단순 |
| AI 요약 | Claude API (`@anthropic-ai/sdk`) | 프로젝트 기술 스택과 일관성 |
| 자막 없는 영상 처리 | HTTP 200 + `status: ERROR` | 폴링 흐름을 깨지 않고 실패 표현 가능 |
| 검색 방식 | PostgreSQL LIKE 검색 | MVP 규모에서 full-text search 불필요 |
| 카테고리 | DB enum | 고정 목록, 타입 안전성 확보 |
| 메모 저장 | 명시적 저장 버튼 | 자동저장은 의도치 않은 덮어쓰기 위험 |

---

## 7. 에이전트별 구현 주의사항

**db 에이전트에게**
- `SummaryCategory`, `SummaryStatus`는 Prisma enum으로 정의할 것
- `summary`, `memo` 필드는 `@db.Text`로 선언 (긴 텍스트)
- `errorMsg`는 nullable String (`String?`)
- 인덱스 3개 반드시 추가: `category`, `status`, `createdAt(sort: Desc)`

**backend 에이전트에게**
- `POST /api/summaries`는 즉시 PENDING 레코드를 반환하고, 비동기로 `summarize()` 함수 호출할 것
  ```ts
  // 비동기 실행 (await 없음)
  summarize(summary.id, body.url).catch(console.error)
  return c.json({ data: summary }, 201)
  ```
- `summarize()` 함수는 별도 파일 `summarizer.ts`로 분리
- `GET /api/summaries` 검색은 `title LIKE %q%` OR `summary LIKE %q%`
- `PATCH`는 `memo` 필드만 수정 가능 (category, url 등 변경 불가)
- `ANTHROPIC_API_KEY` 환경변수 필요 — `apps/api/.env`에 추가 안내
- `youtube-transcript` 사용 시 자막 없는 영상은 catch 후 `status: ERROR`, `errorMsg` 설정

**frontend 에이전트에게**
- 사이드패널 레이아웃: CSS Grid `1fr 2fr` (목록 : 상세)
- 폴링 구현:
  ```ts
  useQuery({
    queryKey: ['summary', selectedId],
    queryFn: () => fetchSummary(selectedId),
    refetchInterval: (data) =>
      data?.status === 'PENDING' || data?.status === 'PROCESSING' ? 2000 : false,
  })
  ```
- 검색어 디바운스 300ms 적용 (`useEffect` + `setTimeout`)
- `SummaryItem`에서 status별 아이콘: ⏳ PENDING, 🔄 PROCESSING, ✅ DONE, ❌ ERROR
- Hub 카드에 `summaryCount` stat 추가 (`fetchCount('/api/summaries')`)
- lucide-react에 `Youtube` 아이콘 없을 경우 `Play` 아이콘으로 대체
