# 날씨 앱 요구사항 정의서

> 작성일: 2026-03-17
> 작성자: PM Agent
> 기술 스택: React + Hono + PostgreSQL (모노레포 기반)

---

## 1. 타겟 사용자

| 구분 | 설명 |
|------|------|
| 주 사용자 | 일상에서 날씨 정보를 빠르게 확인하고 싶은 일반 사용자 |
| 부 사용자 | 여행, 출장 등으로 여러 지역의 날씨를 비교해야 하는 사용자 |
| 사용 환경 | 데스크탑 웹 브라우저 (모바일 반응형 지원) |
| 사용 빈도 | 하루 1~3회, 주로 외출 전 또는 일정 계획 시 |

---

## 2. 핵심 기능

### F1. 현재 날씨 조회
- 선택한 위치의 현재 기온, 체감 온도, 습도, 풍속, 날씨 상태(맑음/흐림/비 등)를 표시
- 날씨 상태에 맞는 아이콘 또는 일러스트 제공
- 최종 업데이트 시각 표시

### F2. 주간 예보 (7일)
- 향후 7일간의 일별 최고/최저 기온, 날씨 상태, 강수 확률 표시
- 리스트 또는 카드 형태의 UI로 한눈에 비교 가능
- 특정 날짜 클릭 시 시간대별 상세 예보 확인

### F3. 위치 검색
- 도시명 또는 지역명으로 검색하여 날씨 조회
- 자동완성(autocomplete) 지원으로 빠른 검색 경험 제공
- 최근 검색 기록 표시 (최대 10개)

### F4. 즐겨찾기 위치 관리
- 자주 확인하는 위치를 즐겨찾기로 저장 (DB 저장)
- 즐겨찾기 목록에서 각 위치의 현재 날씨 요약 표시
- 즐겨찾기 추가/삭제/순서 변경 가능
- 사용자별 최대 10개 위치 저장

### F5. 날씨 알림 설정
- 특정 조건(기온 임계값, 강수 예보 등) 발생 시 알림 설정
- 알림 조건: 기온 상한/하한, 강수 확률 임계값, 특정 날씨 상태
- 알림 목록 관리 (활성/비활성 토글, 삭제)
- 알림 이력 조회

### F6. 시간별 예보
- 현재 시점부터 48시간 이내의 시간별 기온, 강수 확률, 풍속 표시
- 간단한 차트 또는 타임라인 형태의 시각화

### F7. 대시보드 (홈)
- 기본 위치의 현재 날씨 + 즐겨찾기 위치 요약을 한 화면에 표시
- Hub 카드 형태로 각 기능 페이지로 빠르게 이동 가능

---

## 3. 비기능 요구사항

### 3.1 성능
- 페이지 초기 로드: 2초 이내 (LCP 기준)
- API 응답 시간: 500ms 이내 (외부 날씨 API 캐싱 적용)
- 외부 API 응답 캐싱: 동일 위치 요청은 10분간 서버 캐시 활용
- TanStack Query의 staleTime/gcTime 설정으로 클라이언트 측 불필요한 재요청 방지

### 3.2 보안
- 외부 날씨 API 키는 서버 사이드에서만 사용 (클라이언트 노출 금지)
- 사용자 입력값(검색어, 알림 조건 등)은 Zod 스키마로 서버/클라이언트 양측 유효성 검증
- SQL Injection 방지: Prisma ORM 사용으로 파라미터화된 쿼리 보장
- XSS 방지: React의 기본 이스케이핑 + 사용자 입력 sanitize

### 3.3 접근성
- WCAG 2.1 AA 수준 준수
- 키보드 네비게이션 완전 지원
- 스크린 리더 호환: 날씨 아이콘에 적절한 alt 텍스트, ARIA 라벨 제공
- 색상 대비 비율 4.5:1 이상 유지
- 반응형 레이아웃: 모바일(360px) ~ 데스크탑(1440px) 지원

### 3.4 안정성
- 외부 날씨 API 장애 시 캐시된 데이터로 폴백 표시 + 사용자에게 안내 메시지
- API 에러 응답은 프로젝트 컨벤션에 맞는 `{ error: { message, code } }` 형식 준수

---

## 4. 기술 스택 가정

이 프로젝트는 기존 모노레포(`claude-code-test`) 구조를 그대로 활용합니다.

| 레이어 | 기술 | 용도 |
|--------|------|------|
| Frontend | React 18 + Vite + TypeScript | SPA, 날씨 정보 표시 UI |
| Routing | React Router v6 | 페이지 간 이동 |
| Server State | TanStack Query v5 | API 데이터 캐싱 및 동기화 |
| Backend | Node.js + Hono | REST API 서버, 외부 날씨 API 프록시 |
| ORM | Prisma | 즐겨찾기, 알림 등 사용자 데이터 관리 |
| Validation | Zod (shared 패키지) | 프론트↔백 공유 스키마 |
| DB | PostgreSQL 16 | 즐겨찾기 위치, 알림 설정, 알림 이력 저장 |
| 외부 API | OpenWeatherMap 또는 동등 서비스 | 실제 날씨 데이터 소스 |
| 인프라 | Docker Compose | PostgreSQL 컨테이너 |

---

## 5. 데이터 모델 (초안)

### FavoriteLocation
- `id` (UUID, PK)
- `name` (도시/지역명)
- `latitude` (위도)
- `longitude` (경도)
- `sortOrder` (정렬 순서)
- `createdAt`, `updatedAt`

### WeatherAlert
- `id` (UUID, PK)
- `locationName` (위치명)
- `latitude`, `longitude`
- `conditionType` (TEMP_HIGH, TEMP_LOW, RAIN_PROB, WEATHER_STATUS)
- `threshold` (임계값)
- `isActive` (활성 여부)
- `createdAt`, `updatedAt`

### AlertHistory
- `id` (UUID, PK)
- `alertId` (FK → WeatherAlert)
- `triggeredAt` (발생 시각)
- `message` (알림 메시지)
- `createdAt`, `updatedAt`

---

## 6. API 엔드포인트 (초안)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/weather/current?lat={}&lon={}` | 현재 날씨 조회 |
| GET | `/api/weather/forecast?lat={}&lon={}&days=7` | 주간/시간별 예보 |
| GET | `/api/locations/search?q={}` | 위치 검색 (자동완성) |
| GET | `/api/favorites` | 즐겨찾기 목록 |
| POST | `/api/favorites` | 즐겨찾기 추가 |
| DELETE | `/api/favorites/:id` | 즐겨찾기 삭제 |
| PATCH | `/api/favorites/:id` | 즐겨찾기 수정 (순서 등) |
| GET | `/api/alerts` | 알림 목록 |
| POST | `/api/alerts` | 알림 생성 |
| PATCH | `/api/alerts/:id` | 알림 수정 (활성/비활성) |
| DELETE | `/api/alerts/:id` | 알림 삭제 |
| GET | `/api/alerts/:id/history` | 알림 이력 조회 |

---

## 7. 페이지 구성

| 페이지 | 경로 | 설명 |
|--------|------|------|
| Home (Dashboard) | `/` | 기본 위치 날씨 + 즐겨찾기 요약 + Hub 카드 |
| Current Weather | `/weather` | 현재 날씨 상세 |
| Forecast | `/forecast` | 주간 예보 + 시간별 예보 |
| Search | `/search` | 위치 검색 |
| Favorites | `/favorites` | 즐겨찾기 관리 |
| Alerts | `/alerts` | 알림 설정 및 이력 |
