---
description: frontend 에이전트 단독 — React 컴포넌트 또는 페이지 추가
argument-hint: <Name> — <설명>
---

# /add-component

frontend 에이전트 단독으로 React 컴포넌트 또는 페이지를 추가합니다.

## 사용법
```
/add-component <Name> — <설명>
```
예시: `/add-component SearchBar — 글로벌 검색 입력 컴포넌트`

---

## 작업 지침 (frontend 에이전트 단독 실행)

### 컴포넌트 추가 (`components/`)
1. `apps/web/src/components/{Name}.tsx` 생성
2. 필요시 `apps/web/src/components/{Name}.module.css` 생성
3. props 타입은 파일 상단에 인터페이스로 정의

### 페이지 추가 (`pages/`)
1. `apps/web/src/pages/{Name}/index.tsx` 생성
2. `apps/web/src/pages/{Name}/{Name}.module.css` 생성
3. `apps/web/src/App.tsx`에 라우트 등록:
   ```tsx
   <Route path="/{name}" element={<{Name}Page />} />
   ```
4. `apps/web/src/pages/Home/index.tsx`에 Hub 카드 추가:
   ```tsx
   <Link to="/{name}" className={styles.card}>
     <h2>{Feature Name}</h2>
     <p>{설명}</p>
   </Link>
   ```

### 컨벤션
- TypeScript strict 모드 준수
- CSS Modules 사용 (인라인 스타일 금지)
- TanStack Query로 서버 상태 관리 (`useQuery`, `useMutation`)
- API 호출 함수는 페이지 파일 상단에 정의

### API 연동이 필요한 경우
- 기존 API가 없으면 `/add-endpoint` 스킬로 먼저 엔드포인트 추가
- 공유 타입은 `@repo/shared`에서 import:
  ```tsx
  import type { {Resource} } from '@repo/shared';
  ```

### 프로젝트 루트
`/mnt/d/Dev/claude-code-test`

### 검증
```bash
pnpm --filter web typecheck
```

컴포넌트/페이지 이름이나 목적이 불명확하면 사용자에게 확인한다.
