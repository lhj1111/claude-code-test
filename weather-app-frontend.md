# Weather App - Frontend UI 컴포넌트 설계

## 1. 페이지 구성

| 페이지 | 경로 | 설명 |
|--------|------|------|
| Home (Hub) | `/` | 기존 프로젝트 허브에 Weather 카드 추가 |
| Weather Home | `/weather` | 현재 위치 날씨 + 검색 입력 + 즐겨찾기 요약 |
| Search | `/weather/search?q=` | 도시 검색 결과 리스트 |
| Detail | `/weather/:cityId` | 특정 도시의 상세 날씨 (현재 + 시간별 + 주간) |
| Favorites | `/weather/favorites` | 즐겨찾기 도시 목록 + 각 도시 현재 날씨 |

---

## 2. 라우터 등록 (App.tsx)

```tsx
import Weather from './pages/Weather/index.tsx'
import WeatherSearch from './pages/Weather/Search.tsx'
import WeatherDetail from './pages/Weather/Detail.tsx'
import WeatherFavorites from './pages/Weather/Favorites.tsx'

// Layout children에 추가
{ path: 'weather', element: <Weather /> },
{ path: 'weather/search', element: <WeatherSearch /> },
{ path: 'weather/:cityId', element: <WeatherDetail /> },
{ path: 'weather/favorites', element: <WeatherFavorites /> },
```

---

## 3. 컴포넌트 트리

```
pages/Weather/
├── index.tsx                  # Weather Home 페이지
├── Search.tsx                 # 검색 결과 페이지
├── Detail.tsx                 # 도시 상세 페이지
├── Favorites.tsx              # 즐겨찾기 페이지
├── Weather.module.css         # 공통 스타일
├── components/
│   ├── SearchBar.tsx          # 도시 검색 입력
│   ├── CurrentWeather.tsx     # 현재 날씨 카드 (온도, 아이콘, 설명)
│   ├── HourlyForecast.tsx     # 시간별 예보 (가로 스크롤)
│   ├── DailyForecast.tsx      # 주간 예보 리스트
│   ├── WeatherDetail.tsx      # 상세 정보 (습도, 풍속, 체감온도 등)
│   ├── CityCard.tsx           # 도시 요약 카드 (즐겨찾기/검색 결과에서 사용)
│   └── FavoriteButton.tsx     # 즐겨찾기 토글 버튼
```

### 계층 구조

```
<Layout>
  └── <Weather>                          # /weather
  │     ├── <SearchBar />
  │     ├── <CurrentWeather />           # 현재 위치 or 기본 도시
  │     ├── <HourlyForecast />
  │     └── <CityCard />[]               # 즐겨찾기 요약 (최대 3개)
  │
  └── <WeatherSearch>                    # /weather/search
  │     ├── <SearchBar />
  │     └── <CityCard />[]               # 검색 결과 리스트
  │
  └── <WeatherDetail>                    # /weather/:cityId
  │     ├── <FavoriteButton />
  │     ├── <CurrentWeather />
  │     ├── <HourlyForecast />
  │     ├── <DailyForecast />
  │     └── <WeatherDetailInfo />
  │
  └── <WeatherFavorites>                 # /weather/favorites
        ├── <SearchBar />
        └── <CityCard />[]               # 즐겨찾기 전체 목록
```

---

## 4. TypeScript Props 인터페이스

```tsx
// --- 데이터 타입 (shared 스키마에서 infer) ---

interface City {
  id: string
  name: string
  country: string
  lat: number
  lon: number
}

interface WeatherCurrent {
  temp: number
  feelsLike: number
  humidity: number
  windSpeed: number
  description: string
  icon: string          // 날씨 아이콘 코드
  updatedAt: string
}

interface HourlyItem {
  hour: string          // ISO datetime
  temp: number
  icon: string
  pop: number           // 강수 확률 (0-1)
}

interface DailyItem {
  date: string          // ISO date
  tempMin: number
  tempMax: number
  icon: string
  description: string
  pop: number
}

interface Favorite {
  id: string
  cityId: string
  city: City
  createdAt: string
  updatedAt: string
}

// --- 컴포넌트 Props ---

interface SearchBarProps {
  defaultValue?: string
  onSearch: (query: string) => void
  placeholder?: string
}

interface CurrentWeatherProps {
  city: City
  weather: WeatherCurrent
}

interface HourlyForecastProps {
  hours: HourlyItem[]   // 최대 24개
}

interface DailyForecastProps {
  days: DailyItem[]     // 최대 7개
}

interface WeatherDetailInfoProps {
  weather: WeatherCurrent
}

interface CityCardProps {
  city: City
  weather?: WeatherCurrent  // 로딩 중이면 undefined
  isFavorite: boolean
  onToggleFavorite: (cityId: string) => void
}

interface FavoriteButtonProps {
  cityId: string
  isFavorite: boolean
  onToggle: (cityId: string) => void
}
```

---

## 5. TanStack Query 데이터 페칭 훅 설계

프로젝트 컨벤션에 따라 API 호출 함수는 페이지 파일 상단에 정의하고, TanStack Query 훅을 사용합니다.

### Query Keys

```tsx
const weatherKeys = {
  all:        ['weather'] as const,
  current:    (cityId: string) => ['weather', 'current', cityId] as const,
  hourly:     (cityId: string) => ['weather', 'hourly', cityId] as const,
  daily:      (cityId: string) => ['weather', 'daily', cityId] as const,
  search:     (query: string)  => ['weather', 'search', query] as const,
  favorites:  ()               => ['weather', 'favorites'] as const,
}
```

### API 호출 함수 (페이지 상단 정의)

```tsx
const API = '/api/weather'

// 도시 검색
async function searchCities(query: string): Promise<City[]> {
  const res = await fetch(`${API}/cities?q=${encodeURIComponent(query)}`)
  const json = await res.json()
  return json.data
}

// 현재 날씨
async function fetchCurrentWeather(cityId: string): Promise<WeatherCurrent> {
  const res = await fetch(`${API}/cities/${cityId}/current`)
  const json = await res.json()
  return json.data
}

// 시간별 예보
async function fetchHourlyForecast(cityId: string): Promise<HourlyItem[]> {
  const res = await fetch(`${API}/cities/${cityId}/hourly`)
  const json = await res.json()
  return json.data
}

// 주간 예보
async function fetchDailyForecast(cityId: string): Promise<DailyItem[]> {
  const res = await fetch(`${API}/cities/${cityId}/daily`)
  const json = await res.json()
  return json.data
}

// 즐겨찾기 목록
async function fetchFavorites(): Promise<Favorite[]> {
  const res = await fetch(`${API}/favorites`)
  const json = await res.json()
  return json.data
}

// 즐겨찾기 추가
async function addFavorite(cityId: string): Promise<Favorite> {
  const res = await fetch(`${API}/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cityId }),
  })
  const json = await res.json()
  return json.data
}

// 즐겨찾기 삭제
async function removeFavorite(favoriteId: string): Promise<void> {
  await fetch(`${API}/favorites/${favoriteId}`, { method: 'DELETE' })
}
```

### Query / Mutation 사용 패턴

```tsx
// 검색 페이지 (Search.tsx)
const [searchParams] = useSearchParams()
const query = searchParams.get('q') ?? ''

const { data: cities = [], isLoading } = useQuery({
  queryKey: weatherKeys.search(query),
  queryFn: () => searchCities(query),
  enabled: query.length >= 2,
})

// 상세 페이지 (Detail.tsx)
const { cityId } = useParams<{ cityId: string }>()

const { data: current, isLoading: loadingCurrent } = useQuery({
  queryKey: weatherKeys.current(cityId!),
  queryFn: () => fetchCurrentWeather(cityId!),
  staleTime: 5 * 60 * 1000,  // 5분간 캐시 유지
})

const { data: hourly = [] } = useQuery({
  queryKey: weatherKeys.hourly(cityId!),
  queryFn: () => fetchHourlyForecast(cityId!),
  staleTime: 10 * 60 * 1000,
})

const { data: daily = [] } = useQuery({
  queryKey: weatherKeys.daily(cityId!),
  queryFn: () => fetchDailyForecast(cityId!),
  staleTime: 30 * 60 * 1000,
})

// 즐겨찾기 mutation
const qc = useQueryClient()

const addFavMut = useMutation({
  mutationFn: addFavorite,
  onSuccess: () => qc.invalidateQueries({ queryKey: weatherKeys.favorites() }),
})

const removeFavMut = useMutation({
  mutationFn: removeFavorite,
  onSuccess: () => qc.invalidateQueries({ queryKey: weatherKeys.favorites() }),
})
```

---

## 6. CSS Modules 스타일 구조

```
pages/Weather/
├── Weather.module.css          # Weather Home 페이지 스타일
├── Search.module.css           # 검색 결과 페이지 스타일
├── Detail.module.css           # 상세 페이지 스타일
├── Favorites.module.css        # 즐겨찾기 페이지 스타일
└── components/
    ├── SearchBar.module.css
    ├── CurrentWeather.module.css
    ├── HourlyForecast.module.css
    ├── DailyForecast.module.css
    ├── WeatherDetail.module.css
    ├── CityCard.module.css
    └── FavoriteButton.module.css
```

### 디자인 토큰 (기존 프로젝트 스타일과 일관성 유지)

```css
/* Weather.module.css 공통 변수 */
.page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
}

/* 카드 베이스 스타일 */
.card {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px;
  padding: 1rem;
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
```

### 반응형 브레이크포인트

```css
/* 모바일 우선 접근 */
@media (min-width: 640px)  { /* sm: 2열 그리드 */ }
@media (min-width: 1024px) { /* lg: 3열 그리드 */ }
```

---

## 7. Hub 카드 등록 (Home/index.tsx)

```tsx
// PROJECTS 배열에 추가
{
  to: '/weather',
  icon: '\u26c5',
  title: 'Weather',
  desc: '도시별 현재 날씨, 시간별/주간 예보를 확인하고 즐겨찾기로 관리합니다.',
  tags: ['React', 'Node.js', 'PostgreSQL'],
  done: true,
},
```
