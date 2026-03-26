---
description: 보안 / 성능 / UX 3가지 관점을 병렬 검토 후 리포트 생성
argument-hint: <feature-name>
---

# /review

기능을 보안/성능/UX 3가지 관점에서 병렬 검토합니다.

## 사용법
```
/review <feature-name>
```
예시: `/review todo`

## 에이전트 팀 구성 (3개 병렬)

### Security Agent
검토 파일:
- `apps/api/src/routes/{name}/index.ts`
- `packages/shared/src/schemas/{name}.ts`

검토 항목:
- 입력 검증 누락 (Zod 스키마 vs 실제 사용)
- SQL Injection (Prisma raw query 사용 여부)
- 인증/인가 미적용 엔드포인트
- 민감 데이터 노출 (응답에 불필요한 필드)
- CORS 설정 적절성

### Performance Agent
검토 파일:
- `apps/api/src/routes/{name}/index.ts`
- `apps/web/src/pages/{Name}/index.tsx`

검토 항목:
- Prisma N+1 쿼리 (include/select 최적화)
- TanStack Query staleTime / cacheTime 설정
- 불필요한 리렌더 (useMemo/useCallback 누락)
- 번들 크기 (불필요한 import)
- DB 인덱스 누락 (자주 조회되는 필드)

### UX Agent
검토 파일:
- `apps/web/src/pages/{Name}/index.tsx`
- `apps/web/src/pages/{Name}/{Name}.module.css`

검토 항목:
- 로딩 상태 처리 (skeleton / spinner)
- 에러 상태 처리 (에러 메시지 표시)
- 빈 상태(empty state) 처리
- 접근성 (aria 속성, 키보드 접근, focus-visible)
- 모바일 반응형 (미디어쿼리)
- 폼 유효성 검사 피드백

## 출력 형식

각 에이전트가 완료되면 다음 형식으로 리포트:

```
## 🔴 Critical (즉시 수정)
## 🟡 Warning (권장 수정)
## 🟢 Good (잘 된 점)
```

## 리뷰 완료 후 다음 단계

- 🔴 Critical 항목 → `/fix-bug <항목 설명>` 으로 즉시 수정
- 🟡 Warning 항목 → 우선순위 판단 후 수정 계획 수립
- 🟢 전체 양호 → 다음 기능 개발 진행
