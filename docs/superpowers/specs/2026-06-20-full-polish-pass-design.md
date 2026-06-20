# CryptiPulse — Full Frontend Polish Pass
**Date:** 2026-06-20  
**Scope:** All pages — visual quality + UX consistency  
**Goal:** Both capstone showcase quality AND feature completeness (watchlist prices fixed)  
**Stack:** Node.js / Express / EJS / vanilla CSS / Bootstrap 5 / Chart.js

---

## Design System

### Color Tokens (changes to `theme.css`)

| Token | Old Value | New Value | Reason |
|-------|-----------|-----------|--------|
| `--radius` | `0.375rem` | `0.5rem` | More premium, less Bootstrap-generic |
| `--accent` | `#92400e` | `#8B5CF6` | Purple tech accent (fintech/crypto standard) |
| `--accent-foreground` | `#fde68a` | `#ffffff` | Contrast fix |
| `--border` | `#404040` | `#2a2a2a` | Subtler — cards stop looking boxed |
| `--card` | `#262626` | `#1e1e1e` | Deeper card, better elevation contrast vs bg |

### New Tokens (additions to `theme.css`)

```css
--glass-bg: rgba(255, 255, 255, 0.04);
--glass-border: rgba(255, 255, 255, 0.08);
--shadow-glow: 0 0 20px rgba(245, 158, 11, 0.12);
```

### Typography Addition

Add JetBrains Mono import to `theme.css` (currently referenced in `--font-mono` but not imported):

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
```

Apply `font-family: var(--font-mono)` to all price, percentage, volume, and market cap values across every page.

### Design Principles
- Glassmorphism: `backdrop-filter: blur(12–16px)` + `var(--glass-bg)` + `var(--glass-border)` for floating surfaces (header, auth card)
- Ambient glow: `var(--shadow-glow)` on featured/hovered cards
- Dual gradient background on key pages: amber radial top-right + purple radial bottom-left at 8–12% opacity
- Animations: 150–300ms ease-out for micro-interactions; existing `animate-in` scroll system kept
- No emoji icons — SVG only throughout

---

## Section 1 — Header / Nav

**File:** `views/partials/header.ejs` + `public/css/other.css` (nav styles)

### Changes
- **Glassmorphism bar:** `position: fixed`, `backdrop-filter: blur(12px)`, `background: rgba(23,23,23,0.8)`, `border-bottom: 1px solid var(--glass-border)`
- **Body offset:** Add `padding-top: 64px` to `body` in `theme.css` so content doesn't hide under fixed nav
- **Active state:** Current-page nav link gets `color: var(--primary)` + `2px` amber underline via `border-bottom`. Detect active route by comparing `req.path` to link href — pass `currentPath` from each route handler, or use a simple JS `window.location.pathname` check on the client.
- **Mobile hamburger:** Hidden nav links on `< 768px`. Hamburger button (three-line SVG icon) toggles a `nav-open` class. Drawer slides down with `max-height` transition.
- **Auth buttons:** Login → ghost border style (`border: 1px solid var(--border)`, transparent bg). Sign Up → filled amber pill (`background: var(--primary)`, `border-radius: 999px`).

---

## Section 2 — Markets Page

**Files:** `views/partials/markets.ejs`, `public/css/markets.css`, `public/js/markets.js`, `app.js`

### Backend change
Add `sparkline=true&price_change_percentage=24h` to the CoinGecko `/coins/markets` API call in `markets.js` (client-side fetch). The `sparkline_in_7d.price` array is returned per coin.

### Category filter tabs
Above the table, render pill tabs: **All | Layer 1 | DeFi | Stablecoins | Meme**

Coin-to-category mapping defined as a JS object in `markets.js`:
```js
const CATEGORIES = {
  'bitcoin': 'layer1', 'ethereum': 'layer1', 'solana': 'layer1', ...
  'uniswap': 'defi', 'aave': 'defi', ...
  'tether': 'stablecoin', 'usd-coin': 'stablecoin', ...
  'dogecoin': 'meme', 'shiba-inu': 'meme', ...
}
```
Active tab filters `#market-data-body` rows client-side. Amber active pill, glass inactive pills.

### Trending cards
Each card displays:
- Coin logo (`<img src="{image}" width="32" height="32">`)
- Coin name + symbol
- Price in JetBrains Mono
- 24h % badge with ▲/▼ SVG arrow + green/red color
- Mini sparkline: 7-day price array → normalize to 0–40px height range → render as inline SVG `<polyline>`. Color: green if last price > first price, red if lower.

### Table rows
- Column order: # | Coin (logo + name + symbol) | Price | 24h % | Market Cap | Volume
- Price, market cap, volume: JetBrains Mono
- 24h %: colored badge with arrow icon
- Market cap / volume: formatted with `formatLarge()` helper (`K/M/B` suffixes)
- Row hover: `background: var(--glass-bg)`

---

## Section 3 — Landing Page

**Files:** `views/index.ejs`, `public/css/styles.css`

### Hero
- Dual radial gradient: `radial-gradient(ellipse 50% 60% at 80% 20%, rgba(245,158,11,0.12), transparent), radial-gradient(ellipse 40% 50% at 20% 80%, rgba(139,92,246,0.08), transparent)`
- Sign Up CTA button: add `@keyframes shimmer` — a subtle white highlight sweep animation on load (runs once, 600ms)
- CTA button radius: `border-radius: 999px` (pill)

### Stats bar
- All numbers: `font-family: var(--font-mono)`
- Count-up animation: on `IntersectionObserver` trigger (already wired in `observer.js`), animate number from 0 to final value over 1.2s using `requestAnimationFrame`

### Features section
- Replace any `✓` text characters with inline SVG checkmark icons (amber, 16×16)

### Testimonials
- Cards: add `border: 1px solid var(--glass-border)` on hover (lift effect)

### Why Us
- Competitor card: border switches to `var(--glass-border)` (currently `#404040`)
- `✓` and `✗` text icons → SVG check (green) and SVG x (red)

---

## Section 4 — Dashboard Page

**Files:** `views/dashboard.ejs`, `public/css/dashboard.css`, `app.js`

### Watchlist prices fix
In `app.js` GET `/dashboard` route:
1. Fetch user's watchlist coin IDs from Supabase
2. Top 10 coins already fetched from CoinGecko — use those prices for any watchlist coins in the top 10
3. For remaining watchlist coins: make one additional call to `/simple/price?ids=<ids>&vs_currencies=usd&include_24hr_change=true`
4. Pass merged price map to the EJS template
5. Template renders price + 24h % in JetBrains Mono with green/red badge (no more `--`)

### Chart polish
- Chart.js tooltip: custom `callbacks` to match dark theme — dark bg (`#1e1e1e`), amber title, white body, `font-family: JetBrains Mono`
- Grid lines: `color: rgba(255,255,255,0.05)` (barely visible)
- Line dataset: `borderColor: '#f59e0b'`, `backgroundColor` gradient fill from `rgba(245,158,11,0.15)` at top to `rgba(245,158,11,0)` at bottom

### Stat cards
- Numbers: JetBrains Mono
- Hover: `box-shadow: var(--shadow-glow)`

### Coin selector pills
- Inactive: `background: var(--glass-bg)`, `border: 1px solid var(--glass-border)`
- Active: `background: var(--primary)`, `color: #000`

---

## Section 5 — Auth Pages

**Files:** `views/auth/login.ejs`, `views/auth/register.ejs`, `public/css/auth.css`

### Page background
Add dual-gradient (same as hero) to auth page body so pages feel connected to the design language.

### Card
- `background: var(--glass-bg)`
- `backdrop-filter: blur(16px)`
- `border: 1px solid var(--glass-border)`
- `box-shadow: var(--shadow-glow)`

### Input fields
- Border: `var(--glass-border)` at rest
- Focus: `border-color: var(--primary)` + `box-shadow: 0 0 0 3px rgba(245,158,11,0.15)` ring
- Height: `44px` minimum (touch target rule)

### Submit button
- Ensure `cursor: pointer` is explicit
- Full-width amber filled, pill radius (`border-radius: 999px`)

### Password field
- Add show/hide toggle: eye SVG icon (Heroicons `eye` / `eye-slash`) absolutely positioned inside input wrapper
- Toggles `input[type]` between `password` and `text`

---

## Section 6 — Portfolio & About (Consistency Pass)

**Files:** `views/portfolio/dashboard.ejs`, `public/css/portfolio.css`, `views/partials/about.ejs`, `public/css/about.css`

### Portfolio
- Tab active indicator: amber `2px` underline (matches header nav — consistent language)
- All monetary values and percentages: JetBrains Mono
- Card borders: `var(--glass-border)` replacing any hardcoded `#404040`
- Holdings % badges: add ▲/▼ SVG arrows (same component as markets table)

### About
- Radius updates automatically via token change (no manual edits needed)
- Audit for any hardcoded `#404040` borders → replace with `var(--border)`

### Footer (`views/partials/footer.ejs`)
- Top border: `var(--border)` (auto-updates with token)
- Text: `var(--muted-foreground)`

---

## Files Changed Summary

| File | Type of change |
|------|---------------|
| `public/css/theme.css` | Token updates + JetBrains Mono import + glass variables |
| `views/partials/header.ejs` | Glassmorphism, mobile hamburger, auth button styles |
| `public/css/other.css` | Nav styles: fixed header, active state, hamburger drawer |
| `views/partials/markets.ejs` | Category filter tabs HTML |
| `public/css/markets.css` | Trending cards, sparkline, table row, filter tab styles |
| `public/js/markets.js` | Sparkline rendering, category filter logic, formatLarge(), arrow icons |
| `views/index.ejs` | SVG icon replacements |
| `public/css/styles.css` | Dual gradient hero, shimmer animation, count-up trigger, glass testimonial hover |
| `public/js/observer.js` (or inline) | Count-up animation on IntersectionObserver |
| `views/dashboard.ejs` | Watchlist price rendering, chart config |
| `public/css/dashboard.css` | Stat card glow, pill styles, chart tooltip |
| `app.js` | Watchlist price fetch logic in GET /dashboard |
| `views/auth/login.ejs` | Password toggle, input structure |
| `views/auth/register.ejs` | Password toggle, input structure |
| `public/css/auth.css` | Glass card, gradient bg, focus ring, pill button |
| `views/portfolio/dashboard.ejs` | Tab indicator update |
| `public/css/portfolio.css` | Mono numbers, glass borders, tab underline |
| `views/partials/footer.ejs` | Token-driven border/text |

---

## Out of Scope
- Price alerts (deferred)
- SSE / live price streaming (deferred)
- News feed (deferred)
- New routes or database schema changes (except watchlist price fetch in existing `/dashboard` route)
