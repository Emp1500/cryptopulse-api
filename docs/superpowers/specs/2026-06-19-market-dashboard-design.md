# Market Dashboard Page — Design Spec
Date: 2026-06-19  
Status: Approved

## Overview

Add a new public "Dashboard" page at `/dashboard` with a Bloomberg-split layout: a big selectable coin chart on the left, global market stat cards on the right, and a two-column newspaper-style coin list below. The Dashboard nav link is always visible (no login required). No existing pages are modified except `header.ejs` (nav link addition) and `app.js` (new route).

## Route & Navigation

- **New route:** `GET /dashboard` in `app.js`
- **Renderer:** `views/dashboard.ejs`
- **Nav:** `views/partials/header.ejs` gets a permanent "Dashboard" link between Home and Market:
  ```
  Home | Dashboard | Market | About
  ```
- No login gate on this page.

## Page Layout (Top → Bottom)

### 1. Page Header
- Title: "Market Dashboard" using **Orbitron** font (loaded only on this page)
- Subtitle: "Live crypto data, updated every 60s"
- Pulsing amber "● LIVE" indicator dot (CSS keyframe animation)

### 2. Coin Selector Strip
- Pill buttons for 7 default coins: BTC · ETH · BNB · SOL · ADA · XRP · DOGE
- Coins sourced from the server-side top 10 passed via EJS (first 7 by market cap)
- Active state: amber fill `#f59e0b`, black text
- Inactive state: `#262626` background, amber border on hover
- Clicking a pill triggers chart reload for that coin

### 3. Bloomberg Split Row (two-column flex)

**Left column (65%) — Big Chart**
- Coin name + symbol + live price displayed above chart
- Pulsing green dot next to price = live indicator
- Chart.js area chart: amber line `#f59e0b`, gradient fill fading to transparent
- Time filter buttons below chart: 1D · 7D · 30D · 90D · 1Y
- On coin or period change: destroy existing chart, show spinner, fetch new data
- Error state: amber-tinted message + "Retry" button

**Right column (35%) — Global Market Stat Cards (2×2 grid)**
- Card 1: Total Market Cap
- Card 2: BTC Dominance (%)
- Card 3: 24h Total Volume
- Card 4: Active Cryptocurrencies count
- Each card: 3px amber left-border accent, muted label, large bold value
- Values animate count-up on page load
- Data source: `https://api.coingecko.com/api/v3/global` (client-side fetch on load)
- On fetch failure: cards display `--` (no broken layout)
- Refresh: every 60 seconds

### 4. Newspaper Coin List (two-column grid)

**Left column — "Top 10 Markets"**
- Server-side rendered from EJS data (top 10 coins passed from route)
- Columns: Rank · Logo · Name/Symbol · Price · 24h% · Market Cap
- Rank numbers in muted amber `#92400e`
- Alternating row shading `rgba(255,255,255,0.02)`
- Hover: amber 3px left-border slides in (150ms transition), subtle background lift

**Right column — "Your Watchlist" or "Trending Today"**
- If user is logged in AND has watchlist coins: show watchlist (server-side rendered)
- If user is not logged in OR watchlist is empty: show "Trending Today" — top 5 coins from the already-loaded top 10 data (no extra fetch)
- Same row style as Top 10 Markets column

## Data Sources & Flow

| Data | Source | When |
|------|--------|-------|
| Top 10 coins | `/api/markets` (server-side, existing 5-min cache) | Route render |
| Watchlist | DB query via existing portfolio logic | Route render, only if `req.session.user` |
| Global stats | CoinGecko `/global` | Client-side on load, refresh every 60s |
| Chart data | CoinGecko `/coins/{id}/market_chart` | Client-side on coin/period change |

## State Management (Client-side)

```js
let activeCoin = 'bitcoin';      // CoinGecko ID of selected coin
let activePeriod = '30';         // Days string: '1', '7', '30', '90', '365'
let chartInstance = null;        // Chart.js instance, destroyed before each redraw
```

## Error Handling

- **Global stats fail:** Cards show `--`, no layout shift
- **Chart fetch fail:** Chart area shows amber-tinted error + "Retry" button that re-calls the fetch function
- **CoinGecko down at route render:** Stale cache served (existing pattern in `app.js`)
- **Empty watchlist / logged out:** Right column falls back to Trending Today (top 5 from EJS data)

## Files Changed

| File | Type | Change |
|------|------|--------|
| `app.js` | Modified | Add `GET /dashboard` route with top 10 + watchlist fetch |
| `views/partials/header.ejs` | Modified | Add Dashboard nav link (always visible) |
| `views/dashboard.ejs` | New | Full page EJS template |
| `public/css/dashboard.css` | New | Page-specific styles |

## UI/UX Improvements (Applied Site-Wide via dashboard.css)

Per ui-ux-pro-max audit:
- `cursor: pointer` added to all interactive elements across the site (via shared `other.css` update)
- Nav link hover transitions set to 150ms (currently instant)
- Market page coin rows get matching amber-border hover treatment

## Design Tokens (Existing Theme — No Changes)

| Token | Value |
|-------|-------|
| `--background` | `#171717` |
| `--card` | `#262626` |
| `--border` | `#404040` |
| `--primary` | `#f59e0b` |
| `--foreground` | `#e5e5e5` |
| `--muted-foreground` | `#a3a3a3` |
| `--color-up` | `#22c55e` |
| `--color-down` | `#ef4444` |

## Constraints

- No new backend API routes needed
- No changes to `/portfolio`, `/markets`, `/graphs`, `/about`, or any auth flow
- Chart.js already loaded via CDN — no new dependencies
- Orbitron font loaded only in `dashboard.ejs` head, not globally
