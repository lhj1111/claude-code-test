# UI Overhaul — Design System Spec

## 문제
현재 UI가 "AI가 만든 것 같다"는 느낌. 원인:
- 사이언/퍼플 네온 그라데이션 = AI 대시보드 전형
- 과도한 glow/glassmorphism
- 모든 곳에 동일한 border-radius
- 차별성 없는 hover 효과

## 디자인 방향: Warm Terminal

"터미널의 기능적 명확함 + 따뜻한 색감 + 의도적 비대칭"

---

## 1. Color Palette

### Dark Theme (default)
```
--bg:            #111110        // 순수 검정 아닌 따뜻한 차콜
--bg-2:          #1a1918        // 약간 밝은 표면
--surface:       #1e1d1c        // 카드 배경 (반투명 X, 솔리드)
--surface2:      #252423        // 입력 필드, 배지
--surface-solid: #1e1d1c
--header-bg:     #111110ee

--border:        #2a2928        // 미묘한 경계
--border-bright: #3a3938        // 강조 경계

--accent:        #e8825c        // 테라코타 오렌지 (메인 액센트)
--accent2:       #7c9a6e        // 올리브 그린 (보조 액센트)
--accent-dim:    #e8825c15
--accent2-dim:   #7c9a6e15

--text:          #c8c4bd        // 따뜻한 회색
--text-muted:    #706b63        // 낮은 대비 보조 텍스트
--text-bright:   #ede9e3        // 밝은 텍스트

--green:         #7c9a6e        // 올리브 계열
--green-dim:     #7c9a6e15
--blue:          #6b8aad        // 차분한 블루
--blue-dim:      #6b8aad15
--purple:        #9a7cb8        // 차분한 퍼플
--purple-dim:    #9a7cb815
--yellow:        #c4a24e        // 머스타드
--yellow-dim:    #c4a24e15
--red:           #c75f5f        // 차분한 레드
--red-dim:       #c75f5f15
```

### Light Theme
```
--bg:            #f5f0eb        // 따뜻한 아이보리
--bg-2:          #ebe5de
--surface:       #ffffff
--surface2:      #f0ebe4
--header-bg:     #f5f0ebee
--border:        #ddd6cc
--border-bright: #c8bfb3
--accent:        #c2663e        // 더 진한 테라코타
--accent2:       #5a7a4c
--text:          #3d3a36
--text-muted:    #8a847b
--text-bright:   #1a1918
```

### 핵심 원칙
- 네온/형광색 완전 제거
- 그라데이션 최소화 (단색 위주)
- glow 효과 제거 (box-shadow는 구조적 음영만)

---

## 2. Typography

```
--font-display: 'IBM Plex Mono', 'Geist Mono', monospace
--font-body: 'IBM Plex Sans', 'Inter', system-ui, sans-serif

// 크기 (fluid)
--text-xs:   clamp(0.65rem, 0.6rem + 0.25vw, 0.72rem)
--text-sm:   clamp(0.75rem, 0.7rem + 0.25vw, 0.82rem)
--text-base: clamp(0.82rem, 0.78rem + 0.2vw, 0.9rem)
--text-lg:   clamp(1rem, 0.9rem + 0.5vw, 1.2rem)
--text-xl:   clamp(1.3rem, 1.1rem + 1vw, 1.8rem)
--text-2xl:  clamp(1.8rem, 1.4rem + 2vw, 2.8rem)
```

### 사용 규칙
- 제목: `font-display`, weight 600, letter-spacing -0.02em
- 본문: `font-body`, weight 400
- 라벨/배지: `font-display`, weight 500, UPPERCASE, letter-spacing 0.06em
- 숫자/데이터: `font-display`, weight 700

---

## 3. Spacing & Layout

```
기본 단위: 4px
--space-1: 4px
--space-2: 8px  
--space-3: 12px
--space-4: 16px
--space-6: 24px
--space-8: 32px
--space-12: 48px
--space-16: 64px

페이지 max-width: 840px
페이지 패딩: space-8 (32px) 좌우, space-12 (48px) 상단
```

---

## 4. Border Radius

```
--radius-none: 0        // 기본 — 대부분의 요소
--radius-sm: 3px        // 배지, 태그, 인라인 요소
--radius-md: 6px        // 카드, 버튼
--radius-lg: 8px        // 모달, 팝오버
--radius-full: 9999px   // 펄스 닷, 아바타
```

### 핵심 원칙
- 큰 border-radius(12-16px) 완전 제거 — AI느낌의 주범
- 직선적이고 구조적인 느낌
- 카드: 6px (현재 12-16px에서 축소)

---

## 5. Shadows & Effects

```
--shadow: 0 1px 3px rgba(0,0,0,0.12)      // 미세한 구조적 음영만
--shadow-sm: 0 1px 2px rgba(0,0,0,0.08)

// 제거 대상:
- glow-accent, glow-accent2 완전 제거
- backdrop-filter: blur() 제거
- body::before 배경 radial-gradient glow 제거
- 네온 box-shadow 제거
```

---

## 6. Component Patterns

### 카드
```css
border: 1px solid var(--border);
border-radius: var(--radius-md);     /* 6px */
background: var(--surface);          /* 솔리드, 반투명 X */
/* glow 없음, glassmorphism 없음 */
```

### 카드 hover
```css
border-color: var(--accent);
/* transform: none — 뜨는 효과 제거 */
/* glow 없음, shadow 변경 없음 */
```

### 버튼
```css
padding: 6px 14px;
border-radius: var(--radius-sm);     /* 3px */
font-family: var(--font-display);
font-size: var(--text-sm);
font-weight: 500;
text-transform: uppercase;
letter-spacing: 0.04em;
```

### 배지
```css
padding: 2px 6px;
border-radius: var(--radius-sm);     /* 3px */
font-size: var(--text-xs);
font-family: var(--font-display);
border: 1px solid;
```

### 입력 필드
```css
border-radius: var(--radius-sm);     /* 3px */
border: 1px solid var(--border);
/* focus: border-color 변경만, glow ring 제거 */
```

---

## 7. Motion

```
--dur-fast: 0.1s
--dur-normal: 0.15s

// 이징: 단순하게
--ease: ease

// 규칙:
- hover 색상 전환만: 0.15s ease
- translateY, scale 등 변형 애니메이션 제거
- fadeUp 입장 애니메이션 제거 (즉시 렌더)
- pulse-glow 제거
```

---

## 8. Key Visual Differentiators (AI느낌 탈피)

1. **따뜻한 색감**: 테라코타 + 올리브 + 머스타드 = 네온 사이언/퍼플의 정반대
2. **직선적 형태**: 3-6px radius, 네오 브루탈리즘에서 차용
3. **모노스페이스 헤딩**: 터미널/엔지니어 감성, 곡선적 산세리프 대신
4. **glow/glass 완전 제거**: 솔리드 표면, 구조적 음영만
5. **비대칭 레이아웃**: 모든 걸 2×2 그리드에 넣지 않기 — 의도적 밀도 차이

---

## 9. Home 페이지 구조 (리디자인)

```
┌──────────────────────────────────────────┐
│  HEADER (기존 Layout 유지)               │
├──────────────────────────────────────────┤
│                                          │
│  .lab                                    │
│    큰 제목 (모노, 2xl)                    │
│    한줄 설명 (muted)                      │
│                                          │
│  ┌─ APP GRID ──────────────────────────┐ │
│  │                                     │ │
│  │  [Todo]     [Note]      [DataViz]   │ │ 3열
│  │   큰 타일    큰 타일      큰 타일     │ │
│  │                                     │ │
│  │  [YouTube Summary]                  │ │ 1열 wide
│  │   와이드 카드                         │ │
│  │                                     │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─ SYSTEM INFO ───────────────────────┐ │
│  │  tech tags (인라인) · arch nodes     │ │
│  └─────────────────────────────────────┘ │
│                                          │
└──────────────────────────────────────────┘
```

### 앱 카드 내부
```
┌─────────────────────────┐
│ ICON   Title            │
│                         │
│ 한줄 설명                 │
│                         │
│ 12 items           →    │ stat + 화살표
└─────────────────────────┘
```

- 상단 3개는 동일 크기 (1fr 1fr 1fr)
- 하단 YouTube Summary는 전체 너비 (wide card) — 비대칭
- 카드 높이: min-height 180px
- glow blob 제거 — 대신 좌측 3px 컬러 보더
