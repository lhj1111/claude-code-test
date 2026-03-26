# Weather App - Backend API Design

## Overview

날씨 앱 백엔드 API 설계 문서. Hono + Prisma + Zod 기반으로 프로젝트 컨벤션을 따른다.
외부 날씨 API(OpenWeatherMap)를 연동하여 위치 기반 날씨 정보를 제공한다.

---

## 1. API Endpoints

Base path: `/api/weather`, `/api/locations`, `/api/favorites`

### Locations (위치 검색)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/locations/search?q={query}` | 도시명으로 위치 검색 |
| GET | `/api/locations/:id` | 저장된 위치 상세 조회 |

### Weather (날씨 조회)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/weather/current?lat={lat}&lon={lon}` | 현재 날씨 조회 |
| GET | `/api/weather/forecast?lat={lat}&lon={lon}&days={days}` | 일기 예보 조회 (기본 5일) |

### Favorites (즐겨찾기)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/favorites` | 즐겨찾기 목록 조회 |
| POST | `/api/favorites` | 즐겨찾기 추가 |
| DELETE | `/api/favorites/:id` | 즐겨찾기 삭제 |

---

## 2. Request / Response Schemas

### GET `/api/locations/search?q=Seoul`

**Response 200:**
```json
{
  "data": [
    {
      "name": "Seoul",
      "country": "KR",
      "state": "Seoul",
      "lat": 37.5665,
      "lon": 126.978
    }
  ]
}
```

### GET `/api/weather/current?lat=37.5665&lon=126.978`

**Response 200:**
```json
{
  "data": {
    "lat": 37.5665,
    "lon": 126.978,
    "locationName": "Seoul",
    "temperature": 12.5,
    "feelsLike": 10.2,
    "humidity": 65,
    "windSpeed": 3.5,
    "description": "clear sky",
    "icon": "01d",
    "cachedAt": "2026-03-17T12:00:00.000Z"
  }
}
```

### GET `/api/weather/forecast?lat=37.5665&lon=126.978&days=5`

**Response 200:**
```json
{
  "data": {
    "lat": 37.5665,
    "lon": 126.978,
    "locationName": "Seoul",
    "daily": [
      {
        "date": "2026-03-17",
        "tempMin": 5.0,
        "tempMax": 14.0,
        "humidity": 60,
        "description": "clear sky",
        "icon": "01d"
      }
    ],
    "cachedAt": "2026-03-17T12:00:00.000Z"
  }
}
```

### POST `/api/favorites`

**Request:**
```json
{
  "name": "Seoul",
  "country": "KR",
  "lat": 37.5665,
  "lon": 126.978
}
```

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Seoul",
    "country": "KR",
    "lat": 37.5665,
    "lon": 126.978,
    "createdAt": "2026-03-17T12:00:00.000Z",
    "updatedAt": "2026-03-17T12:00:00.000Z"
  }
}
```

### DELETE `/api/favorites/:id`

**Response 204:** (no body)

### Error Responses

```json
{
  "error": {
    "message": "Location not found",
    "code": "NOT_FOUND"
  }
}
```

| HTTP Code | Usage |
|-----------|-------|
| 200 | GET 성공 |
| 201 | POST 생성 성공 |
| 204 | DELETE 성공 |
| 404 | 리소스 없음 |
| 422 | 유효성 검증 실패 |
| 502 | 외부 API 호출 실패 |

---

## 3. Prisma Models

`apps/api/prisma/schema.prisma` 에 추가:

```prisma
model Favorite {
  id        String   @id @default(uuid())
  name      String
  country   String
  lat       Float
  lon       Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([lat, lon])
}

model WeatherCache {
  id           String   @id @default(uuid())
  lat          Float
  lon          Float
  type         String   // "current" | "forecast"
  data         Json     // 외부 API 응답을 JSON으로 저장
  expiresAt    DateTime // 캐시 만료 시각
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([lat, lon, type])
  @@index([expiresAt])
}
```

**설계 결정:**
- `Favorite`: 사용자가 즐겨찾기한 위치. `lat + lon` 유니크 제약으로 중복 방지.
- `WeatherCache`: 외부 API 응답을 캐싱하여 rate limit 절약. `expiresAt`으로 TTL 관리 (current: 10분, forecast: 30분).
- 위치 검색(`/api/locations/search`)은 외부 API를 직접 호출하므로 별도 모델 불필요.

---

## 4. Zod Schemas (shared package)

`packages/shared/src/schemas/weather.ts`:

```ts
import { z } from 'zod'

// --- Location ---

export const LocationSearchResultSchema = z.object({
  name: z.string(),
  country: z.string(),
  state: z.string().optional(),
  lat: z.number(),
  lon: z.number(),
})

export type LocationSearchResult = z.infer<typeof LocationSearchResultSchema>

// --- Current Weather ---

export const CurrentWeatherSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  locationName: z.string(),
  temperature: z.number(),
  feelsLike: z.number(),
  humidity: z.number(),
  windSpeed: z.number(),
  description: z.string(),
  icon: z.string(),
  cachedAt: z.string().datetime(),
})

export type CurrentWeather = z.infer<typeof CurrentWeatherSchema>

// --- Forecast ---

export const ForecastDaySchema = z.object({
  date: z.string(),
  tempMin: z.number(),
  tempMax: z.number(),
  humidity: z.number(),
  description: z.string(),
  icon: z.string(),
})

export const ForecastSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  locationName: z.string(),
  daily: z.array(ForecastDaySchema),
  cachedAt: z.string().datetime(),
})

export type ForecastDay = z.infer<typeof ForecastDaySchema>
export type Forecast = z.infer<typeof ForecastSchema>

// --- Query Params ---

export const WeatherQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
})

export const ForecastQuerySchema = WeatherQuerySchema.extend({
  days: z.coerce.number().int().min(1).max(7).default(5),
})

export const LocationSearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
})

// --- Favorites ---

export const FavoriteSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  country: z.string().min(1).max(10),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const CreateFavoriteSchema = z.object({
  name: z.string().min(1).max(200),
  country: z.string().min(1).max(10),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
})

export type Favorite = z.infer<typeof FavoriteSchema>
export type CreateFavorite = z.infer<typeof CreateFavoriteSchema>
```

`packages/shared/src/index.ts` 에 추가:
```ts
export * from './schemas/weather.js'
```

---

## 5. External Weather API Integration

### Provider: OpenWeatherMap

환경변수: `OPENWEATHER_API_KEY`

### API Calls

| 용도 | OpenWeatherMap Endpoint |
|------|------------------------|
| 위치 검색 | `GET /geo/1.0/direct?q={query}&limit=5&appid={key}` |
| 현재 날씨 | `GET /data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={key}` |
| 일기 예보 | `GET /data/2.5/forecast?lat={lat}&lon={lon}&units=metric&appid={key}` |

### Integration Architecture

```
apps/api/src/
├── routes/
│   ├── weather/
│   │   └── index.ts          # /api/weather/* 라우트
│   ├── locations/
│   │   └── index.ts          # /api/locations/* 라우트
│   └── favorites/
│       └── index.ts          # /api/favorites/* 라우트
├── services/
│   └── weather-api.ts        # OpenWeatherMap API 클라이언트
└── db/
    └── index.ts              # Prisma client (기존)
```

### `services/weather-api.ts` 구조

```ts
// OpenWeatherMap API 호출을 캡슐화하는 서비스 모듈

const BASE_URL = 'https://api.openweathermap.org'

export async function searchLocations(query: string): Promise<LocationSearchResult[]>
// -> GET /geo/1.0/direct

export async function fetchCurrentWeather(lat: number, lon: number): Promise<CurrentWeather>
// -> GET /data/2.5/weather
// -> WeatherCache에 캐싱 (TTL 10분)

export async function fetchForecast(lat: number, lon: number, days: number): Promise<Forecast>
// -> GET /data/2.5/forecast
// -> WeatherCache에 캐싱 (TTL 30분)
```

### Caching Strategy

1. 날씨 조회 요청 시 `WeatherCache` 테이블에서 `lat + lon + type` 으로 조회
2. `expiresAt > now()` 인 캐시가 있으면 캐시된 데이터 반환
3. 캐시가 없거나 만료되었으면 OpenWeatherMap API 호출 후 upsert
4. TTL: current = 10분, forecast = 30분

### Error Handling

- 외부 API 호출 실패 시 만료된 캐시라도 있으면 stale 데이터 반환 (graceful degradation)
- 캐시도 없으면 `502 Bad Gateway` + `{ error: { message: "Weather service unavailable", code: "EXTERNAL_API_ERROR" } }`

---

## 6. Route Registration

`apps/api/src/routes/index.ts` 에 추가:

```ts
import weather from './weather/index.js'
import locations from './locations/index.js'
import favorites from './favorites/index.js'

routes.route('/weather', weather)
routes.route('/locations', locations)
routes.route('/favorites', favorites)
```

---

## 7. Environment Variables

`.env` 에 추가:

```
OPENWEATHER_API_KEY=your_api_key_here
```
