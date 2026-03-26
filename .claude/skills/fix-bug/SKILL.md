---
description: 레이어 자동 분석 후 관련 에이전트로 버그 수정 (frontend / backend / db)
argument-hint: <버그 설명>
---

# /fix-bug

레이어 자동 분석 후 관련 에이전트로 버그를 수정합니다.

## 사용법
```
/fix-bug <버그 설명>
```
예시: `/fix-bug 투두 삭제 후 목록이 갱신 안 됨`

---

## 작업 지침

1. **버그 분석**: 문제가 발생하는 레이어를 먼저 파악한다.
   - 프론트엔드 (React, UI, API 호출) → `frontend` 에이전트
   - 백엔드 (API 라우트, 응답 형식, 검증) → `backend` 에이전트
   - 데이터베이스 (스키마, 쿼리, 마이그레이션) → `db` 에이전트
   - 복합 레이어 → 관련 에이전트들 협업

2. **관련 파일 확인**:
   - 에러 메시지나 스택 트레이스에서 파일 경로 추출
   - 프로젝트 루트: `/mnt/d/Dev/claude-code-test`

3. **수정 범위**:
   - 버그 수정에 필요한 최소한의 변경만 수행
   - 관련 없는 코드 리팩토링 금지

4. **레이어별 담당 경로**:
   - Frontend: `apps/web/src/`
   - Backend: `apps/api/src/`, `packages/shared/src/`
   - DB: `apps/api/prisma/`

5. **검증**:
   - Frontend: `pnpm --filter web typecheck`
   - Backend: `pnpm --filter api build`
   - 수정 후 관련 동작 수동 확인

버그 설명이 없으면 사용자에게 구체적인 증상, 에러 메시지, 재현 방법을 물어본다.
