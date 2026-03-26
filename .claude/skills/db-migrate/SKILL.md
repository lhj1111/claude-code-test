---
description: Prisma 마이그레이션 생성 및 실행 (schema.prisma 변경 후 사용)
argument-hint: <migration-name>
---

# /db-migrate

Prisma 마이그레이션을 생성하고 실행합니다.

## 사용법
```
/db-migrate <migration-name>
```
예시: `/db-migrate add-bookmark-table`

## 실행 단계

1. `apps/api/prisma/schema.prisma` 현재 상태 확인
2. Docker PostgreSQL 실행 중인지 확인
   ```bash
   docker compose ps
   ```
3. 마이그레이션 생성 및 실행
   ```bash
   cd apps/api && npx prisma migrate dev --name <migration-name>
   ```
4. Prisma Client 재생성 (migrate dev가 자동으로 실행)
5. 영향받는 라우트 파일 타입 오류 확인

## 주의사항
- Docker가 실행 중이어야 함 (`docker compose up -d`)
- migration-name은 kebab-case로 작성 (예: `add-user-table`, `add-due-date-to-todo`)
- 스키마 변경 후 `pnpm --filter shared build` 로 shared 타입도 재빌드 필요한지 확인

## 실패 시 대응

마이그레이션 실패 시:
1. 오류 메시지 확인 (`Could not connect` → Docker 미실행)
2. Docker 재시작: `docker compose up -d`
3. 스키마 문법 오류 시: `apps/api/prisma/schema.prisma` 확인
4. 마이그레이션 초기화 필요 시: `pnpm --filter api db:migrate reset` (⚠️ 데이터 삭제)
