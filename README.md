# Handoff: NewLaunch Forecaster (新盘预言家)

## Overview
NewLaunch Forecaster is a Singapore-focused property prediction platform for pre-TOP ("未TOP") new-launch condos. It quantifies launch heat, developer cost, and macro planning signals to produce post-TOP price-movement forecasts, entry-timing guidance, and holding strategy recommendations — eliminating the "盲盒" (blind-box) effect of buying off-plan.

The MVP covers four end-to-end flows: **Dashboard → Launched Projects list → Upcoming Launches list → Project Detail** (with 4 analytical tabs) and a **Progressive Payment Scheme (PPS) Calculator**.

## About the Design Files
The files in this bundle are **design references created in HTML** — interactive prototypes demonstrating intended look, layout, and behavior. **They are not production code.** The task is to **recreate these designs in the target codebase's environment** (likely React + TypeScript given the JSX structure) using the project's established patterns, routing library, component framework, and data-fetching layer.

The HTML prototype uses inline Babel-transpiled JSX with plain `window` globals for simplicity — in production this should be replaced with proper ES modules, typed props, a real router (React Router / TanStack Router), and API-fed data instead of the static `data.js` mock.

## Fidelity
**Mid-to-high fidelity.** Colors, typography, spacing, semantic tokens, component structures, and interaction flows are final. Photography and map visuals are represented as hatched "IMG / PLOT / HERO" placeholder stubs — production should swap these for real project renders, satellite imagery, and interactive maps (Mapbox / Google Maps). All numeric data (PSF, sell-through, forecasts, land rates) is plausible stub data; production pulls from URA Caveats, developer S&P filings, BCA, and URA Master Plan feeds.

## Design System — Rayum
The entire UI is built on the **Rayum design system** (see `styles/colors_and_type.css`). Use its semantic tokens in production rather than hard-coded values.

### Color tokens
- **Primary (brand / bullish green):** `--primary-40: #70FC8E`, `--primary-70: #39A550`, `--primary-80: #2B873F` (success/outperform foreground), `--primary-100: #07200C`
- **Secondary (accent blue):** `--secondary-50: #3765F6`
- **Neutrals:** `--gray-10 #F6F7F9` → `--gray-100 #0A0D11`
- **Support:** warning `#F07000` (neutral forecast / medium risk), error `#E53E3E` (underperform / bearish)
- **Semantic:** `--bg-default`, `--bg-muted`, `--fg-default`, `--fg-muted`, `--border-muted-card`, etc.

### Verdict color mapping
- `outperform` / bullish → `#2B873F` (green)
- `neutral` / horizontal → `#C85D00` (orange)
- `underperform` / bearish → `#C32B2B` (red)
- `watch` / informational → `#3765F6` (blue)

### Typography
- **Inter** (body/UI 14–18px), **Inter Display** (headings 28px+), **Inter Text** (micro ≤14px), **Roboto Mono** (numeric/PSF/percentage figures)
- Headlines: `font-weight: 700`, letter-spacing `-0.3px` to `-0.6px`
- Numbers are **always mono** (Roboto Mono) with `letter-spacing: -0.4px` on larger values
- Bilingual labels: English primary at full size, Chinese secondary at `0.72em` with `color: var(--fg-muted)` and `font-weight: 400`

### Spacing / radius / shadow
- Space scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 px
- Radii: sm 4 / md 8 / lg 16 / xl 24 / full 9999
- Shadows: `--shadow-xs` on cards, `--shadow-lg` on floating panels

## Screens

### 1. Shell (Sidebar + Topbar)
- **Sidebar** (width 256, sticky, `bg-default`, right border `border-muted`)
  - Logo block (30×30 square with gradient diamond) + "NewLaunch Forecaster · 新盘预言家" + "MVP" badge
  - Market pulse mini card (green dot + "OCR Index +4.2%" + "URA Caveats · updated 2m ago")
  - Nav items with bilingual labels + lucide icons: Dashboard, Launched Projects (count badge 42), Upcoming Launches (count 18), Watchlist, Developer Track Record, PPS Calculator, URA Master Plan, Settings
  - Active item: `bg: var(--gray-100)`, white text, 600 weight
- **Topbar** (sticky, 20px vertical padding, border-bottom)
  - Title (22px / 700 / tracking -0.6px) with secondary Chinese at 15px / 500 / muted
  - Subtitle 13px muted
  - Persona segmented control (Investor / HDB Upgrader / First-time Buyer) — pill-style, active = white bg + xs shadow
  - Search input (240px, muted bg)
  - Language toggle (EN / EN · 中)
  - Avatar

### 2. Dashboard
Padding 24, 16 gap between rows.
- **Persona briefing bar** — 2-column card: left shows personalized copy based on persona; right shows "change persona from top bar" hint with muted left background
- **KPI strip** — 4 cards: OCR East Avg PSF ($2,284 / +4.2% QoQ), Tracked Launches (42/18), Avg Day-1 Sell-through (54% / -6pt YoY), Supply pipeline (21,480 units)
- **Headline forecast row** (2fr 1fr grid)
  - Left: Vela Bay card with hand-drawn SVG price trajectory chart (see Chart spec below) + 4 metrics (TOP uplift, Fair PSF range, Rental yield, Confidence)
  - Right: "Forecaster AI" card — dark (`--gray-100` bg), white text, green accents, persona-dependent copy, est. 3-yr IRR chip, "See full analysis" brand CTA
- **Watchlist + Regional heat** (2fr 1fr)
  - Watchlist rows: 44px image stub + name/developer + PSF + forecast + verdict tag + chevron (clickable → project detail)
  - Regional heat: horizontal bars for OCR East/West/North, RCR, CCR with call counts and bar fills
- **Footer:** data sources strip (`--gray-10` bg, 11px muted text): URA Caveats, URA Master Plan, HDB Resale, S&P filings, BCA construction cost index

### 3. Projects List (Launched / Upcoming)
- **Filter bar card** — search input (280px) + Region select + Tenure select + Sort select
- **Count line** — "N projects · 已开盘/待开盘"
- **Table card** with `--gray-10` header row (10px uppercase 700 letter-spacing 0.08em muted)
  - **Launched columns:** Project, Region, TOP, Units, Avg PSF, Day-1 % (mini bar + number), Fair range, Forecast (colored +%), Verdict tag, chevron
  - **Upcoming columns:** Project, Region, Developer, Preview, TOP, Units, Land PSF, Fair PSF, Entry (40×22 score chip + tag), chevron
  - Rows hover → `bg: var(--gray-10)`, cursor pointer, border-bottom `border-muted`

### 4. Project Detail
- **Breadcrumb row** — Back button + "Launched Projects › [Name]"
- **Hero card** (2-col: 320px hero stub + info panel)
  - Tag row: verdict + tenure + unit count + TOP date
  - Name (28px / 700 / -0.6px) + Chinese sub + district · developer
  - 4 metrics inline: Launch PSF, Current avg PSF (with delta), Day-1 sell-through, Predicted TOP uplift
- **Tabs**: Prediction · PSF & Fair Value · Tenants & Yield · Developer (underline-style; active = 700 + dark border-bottom)
- **Prediction tab**: chart card (2fr) + attribution card (1fr, 6 weighted bars with +/- pt contributions) + highlights strip (3-col, colored left-border callouts tinted by tone)
- **PSF tab**: Fair PSF build-up (land + build + 15% margin + 20% margin stacked bars with summary row comparing fair vs. actual launch) + unit-mix card (stacked color bar + legend table) + nearby resale 4-card comparison grid
- **Tenants tab**: Tenant profile stub + rental outlook 4-metric grid (yield, vacancy, breakeven rent, competing supply) + catchment 3-card row (Transit / Schools / Master Plan)
- **Developer tab**: track-record table (Project / Year / Uplift / Quality stars) + reputation signals (4 progress bars)

### 5. PPS Calculator
- **Dark header card** (`--gray-100` bg, white text, green calculator icon)
- **2-col layout**: Inputs card (5 sliders: price $800k–$5M, LTV 25–75%, rate 1.5–6%, tenure 10–35yr, build 30–60mo; 4-metric summary grid) | Stages card (SVG cumulative cashflow chart with TOP marker + 10-row milestone table)
- **Milestones:** 5% Booking → 15% S&P → 10% Foundation → 10% Concrete → 5% Brick → 5% Roof → 5% Finishes → 5% Carpark → 25% TOP → 15% CSC

## Key Component: Hand-drawn SVG Prediction Chart
Located in `src/Dashboard.jsx` (`PredictionChart`). Production should likely migrate to Recharts/Visx but preserve:
- 6 time stops: Launch, +1yr, Mid-build, **TOP (emphasized)**, +3yr, +5yr
- Confidence band (low/high polygon, tinted by verdict color)
- Mid line (2.5px stroke, verdict color)
- Dashed low/high rails at 55% opacity
- "TODAY" pill marker (dark gray) at x=0.10 with vertical dashed line
- "TOP" pill marker (verdict color) at x=0.55 below the axis
- End-of-chart "+X%" label pill
- Y-axis ticks at 5 levels, mono font, `$N,NNN` formatting
- X-axis time-stop labels below chart

## Interactions & Behavior
- **Routing**: `dashboard | launched | upcoming | project | calculator | watchlist | developers | masterplan | settings` — currently stored in React state + localStorage. Use the target project's router.
- **Navigation**: clicking any project card/row/watchlist row → `openProject(id)` → sets `projectId` and routes to `project`. Detail "Back" returns to `launched` list.
- **Tab switching** on project detail — local state, instant swap.
- **Filter/sort** on list views — controlled selects + text input, recomputed via `useMemo`.
- **PPS sliders** — all inputs update milestone table and cashflow chart in real time.
- **Persona switcher** (Investor / Upgrader / First-timer) — rewrites Dashboard briefing bar + Forecaster AI card copy; intended to reweight forecast attribution in future.
- **Language toggle** (EN / EN · 中) — adds Chinese secondary labels across sidebar, topbar, cards, tables.
- **Tweaks panel** (floating bottom-right) — prototype-only, mirrors persona + language controls. Omit in production.

## State Management
Minimal in the mock — `useState` for route, projectId, persona, lang + `localStorage` for route/project persistence. Production needs:
- **Router state** (route, projectId as URL params)
- **User preferences** (persona, language) in user profile / Zustand / context
- **Project data** fetched per-list and per-detail from the forecasting API
- **Filter/sort state** — URL-synced query params preferred for shareable views
- **PPS calculator state** — local only, no persistence needed

## Data Model (see `src/data.js`)
```ts
type Project = {
  id: string;
  name: string; zhName: string;
  status: "launched" | "upcoming";
  district: string; zhDistrict: string;
  region: "OCR East" | "OCR West" | "OCR North" | "RCR" | "CCR";
  developer: string; zhDeveloper: string;
  launchDate: string; topDate: string;
  tenure: string; units: number;
  avgPsf?: number; launchPsf?: number;
  landRatePsf: number;
  day1Sold?: number; totalSold?: number;
  unitMix?: { type: string; zh: string; pct: number; psf: number }[];
  verdict: "outperform" | "neutral" | "underperform" | "watch" | "hot";
  verdictLabel: string; zhVerdictLabel: string;
  predictedUplift?: [number, number];   // [low%, high%]
  fairPsf: [number, number];
  rentalYield?: number; vacancyRisk?: "low" | "medium" | "high";
  premiumIndex?: number; competingSupply?: number;
  entryScore?: number;                   // upcoming only
  mrtDistance: string;
  schools?: string[];
  tenantProfile: string;
  highlights?: { tone: "success" | "warning" | "info"; en: string; zh: string }[];
};
```

## Files in this bundle
- `NewLaunch Forecaster.html` — root page, loads all scripts
- `src/data.js` — mock `PROJECTS` array (14 projects incl. Vela Bay, Tampines Pinery, Skye at Holland, The Orie, River Green, Parktown Residence, Penrith, Lyndenwoods, Lentor Central Residences, River Modern, + 4 upcoming)
- `src/primitives.jsx` — Icon, Button, Tag, Card, Bi, Avatar, Sparkline, Stub, Slider, Input, Tabs, Metric
- `src/Sidebar.jsx`, `src/Topbar.jsx` — shell chrome
- `src/Dashboard.jsx` — includes `PredictionChart` SVG
- `src/ProjectsList.jsx` — launched + upcoming table views
- `src/ProjectDetail.jsx` — 4-tab detail screen
- `src/Calculator.jsx` — PPS calculator + cashflow chart
- `src/GenericScreen.jsx` — placeholder screen shell
- `src/App.jsx` — root shell, routing, tweaks panel wiring
- `styles/colors_and_type.css` — Rayum design tokens (vendored)
- `styles/fonts/*.ttf` — Inter family
- `assets/logo-brandmark.svg`

## Workspace
Work on the `~/Downloads/Sideproject1/` folder on the developer's machine — unzip the handoff bundle there and implement in that directory.

## Notes for the implementer
- **Icons**: lucide-react in production (mock uses UMD).
- **i18n**: prototype uses inline conditionals; production should use i18next or next-intl with `en` + `zh-CN` namespaces.
- **Charts**: Hand-drawn SVG is intentional for the hero prediction chart — it keeps the verdict-tinted band and marker pills simple. Internal bars/rails can use a charting lib.
- **Accessibility**: prototype is not audited — add proper `aria-label`, keyboard focus rings on the persona segmented control and tab row, semantic `<nav>`/`<main>` landmarks.
- **Responsive**: fixed at `width=1320` viewport; production should add breakpoints for tablet (collapse sidebar, stack 2-col rows) and mobile (drawer nav, vertical KPIs).
