# CryptiPulse Frontend Redesign — Design Spec

**Date:** 2026-06-17  
**Status:** Approved  
**Scope:** Full frontend visual overhaul — design system, home page restructure, Markets full redesign, all other pages themed

---

## 1. Design System

### Theme File: `public/css/theme.css`

Single source of truth for all design tokens. All `.dark` values placed directly in `:root` (dark mode only — no toggle, no light mode).

```css
:root {
  --card: #262626;
  --ring: #f59e0b;
  --input: #404040;
  --muted: #262626;
  --accent: #92400e;
  --border: #404040;
  --chart-1: #fbbf24;
  --chart-2: #d97706;
  --chart-3: #92400e;
  --chart-4: #b45309;
  --chart-5: #92400e;
  --popover: #262626;
  --primary: #f59e0b;
  --sidebar: #0f0f0f;
  --secondary: #262626;
  --background: #171717;
  --foreground: #e5e5e5;
  --destructive: #ef4444;
  --sidebar-ring: #f59e0b;
  --sidebar-accent: #92400e;
  --sidebar-border: #404040;
  --card-foreground: #e5e5e5;
  --sidebar-primary: #f59e0b;
  --muted-foreground: #a3a3a3;
  --accent-foreground: #fde68a;
  --popover-foreground: #e5e5e5;
  --primary-foreground: #000000;
  --sidebar-foreground: #e5e5e5;
  --secondary-foreground: #e5e5e5;
  --destructive-foreground: #ffffff;
  --sidebar-accent-foreground: #fde68a;
  --sidebar-primary-foreground: #ffffff;
  --radius: 0.375rem;
  --font-sans: Inter, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  /* Price change semantic tokens */
  --color-up: #22c55e;
  --color-down: #ef4444;
}
```

**Font:** Inter loaded from Google Fonts, applied globally via `font-family: var(--font-sans)`.  
**`@theme inline` block:** Dropped — Tailwind-only, not used in this EJS/plain-CSS stack.

### All Existing CSS Files Updated

Every hardcoded hex color in `styles.css`, `markets.css`, `portfolio.css`, `watchlist.css`, `auth.css`, `other.css`, `chart.css`, `about.css` replaced with the appropriate CSS variable. File structure stays the same — only values change.

---

## 2. Animation System

All scroll-triggered animations use **Intersection Observer + CSS transitions** (no Framer Motion — this is not a React project).

### Standard Entrance Animation
```css
.animate-in {
  filter: blur(4px);
  transform: translateY(-8px);
  opacity: 0;
  transition: filter 0.8s ease, transform 0.8s ease, opacity 0.8s ease;
}
.animate-in.visible {
  filter: blur(0);
  transform: translateY(0);
  opacity: 1;
}
```

A single `observer.js` script applies `IntersectionObserver` to all `.animate-in` elements, adding `.visible` when they enter the viewport. Stagger delays applied via inline `transition-delay` on each element.

---

## 3. Navbar (`views/partials/header.ejs`)

**Layout:** Logo far left — nav links center-left — auth buttons far right.

```
[🟡 CryptoPulse logo + text]    Home  Dashboard  Market  About    [Login]  [Sign Up]
```

- Background: `var(--sidebar)` (`#0f0f0f`) with `1px solid var(--border)` bottom
- Logo: existing `cryptologo1.png` + "Crypto" in `var(--primary)` + "Pulse" in `var(--muted-foreground)`
- Nav links: `var(--foreground)`, hover → `var(--primary)`, active → amber underline `2px solid var(--primary)`
- **Login:** outlined button — `border: 1px solid var(--primary)`, `color: var(--primary)`, transparent bg
- **Sign Up:** filled button — `background: var(--primary)`, `color: var(--primary-foreground)` (black)
- Logged-in state: replaces Login/Sign Up with user avatar dropdown (existing behavior, restyled)
- Bootstrap kept only for the dropdown JS behaviour; nav layout converted to plain flexbox CSS

---

## 4. Home Page (`views/index.ejs`)

Full structural rebuild. Sections in order:

### 4.1 Hero
- **Layout:** 2-column grid — text left (55%), blockchain Lottie animation right (45%)
- **Background:** `var(--background)` with a radial amber glow: `radial-gradient(ellipse 60% 50% at 70% 50%, rgba(245,158,11,0.12), transparent)`
- **"CryptoPulse" heading:** blur+fade entrance animation on page load (not scroll-triggered) — "Crypto" animates first (delay 0), "Pulse" follows (delay 0.15s)
- **Subheading:** "Real-time data on 20,000+ cryptocurrencies. For Traders, Developers & Enterprises."
- **Buttons:** [Get Started →] (filled amber) | [View Markets] (outlined amber)
- **Lottie:** `blockchain.json`, 500×500, existing `<lottie-player>` setup retained

### 4.2 Stats Section
- **Layout:** 6 cards in a horizontal row, responsive wrap to 3×2 on mobile
- **Card style:** `var(--card)` bg, `var(--border)` border, `var(--radius)` corners, amber glow on hover
- **Number:** large, `var(--primary)` color, count-up animation (0 → final value) triggered by IntersectionObserver
- **Label:** `var(--muted-foreground)` text below the number
- **Stats:** 10B+ API Calls | 70+ Endpoints | 10+ Years Data | 200+ Networks | 2000+ NFTs | 30+ Marketplaces
- **Entrance:** `.animate-in` class, staggered delays 0.1s apart

### 4.3 Features Section
- **Layout:** 2-column grid — network Lottie left (45%), feature bullets right (55%)
- **Lottie:** `network.json`, 400×400
- **Bullets:** 5 items, each prefixed with amber `✦` icon
  1. Multi-chain coverage — Bitcoin, Ethereum, BNB, Solana and 200+ more
  2. Real-time prices — live data updated every 60 seconds
  3. Historical data — 10+ years of OHLCV records
  4. NFT floor prices — 2,000+ collections across 30+ marketplaces
  5. Enterprise-grade uptime — built for high-volume API usage
- **Entrance:** section animates in with blur+fade on scroll

### 4.4 Testimonials Section
- **Layout:** 2 rows of cards in infinite horizontal marquee
  - Row 1 scrolls left
  - Row 2 scrolls right
  - Pauses on hover (`animation-play-state: paused`)
- **Card:** `var(--card)` bg, `var(--border)` border, avatar initial circle in amber, name + role, star rating (5 amber stars), quote in `var(--muted-foreground)`
- **Content:** 8 mock testimonials (fictional traders/developers), duplicated to fill the loop
- **Section heading:** "What Our Users Say" — animate-in on scroll

### 4.5 Why Us Section
- **Layout:** 2 columns side by side, full-width section
- **Left card — "Others":** `var(--card)` bg, `var(--destructive)` ✗ marks, `var(--muted-foreground)` text
  - ✗ Delayed or cached price data
  - ✗ Cluttered, hard-to-navigate UI
  - ✗ No built-in portfolio tracking
  - ✗ Key features behind paywalls
  - ✗ No watchlist functionality
- **Right card — "CryptoPulse":** `var(--card)` bg, `2px solid var(--primary)` border, amber glow, `var(--color-up)` ✓ marks, `var(--foreground)` text
  - ✓ Real-time prices, updated live
  - ✓ Clean, intuitive dashboard
  - ✓ Full portfolio tracking built in
  - ✓ Free data access, no paywalls
  - ✓ Custom watchlists for any coin
- **Entrance:** both cards animate in with blur+fade, right card with slight delay

### 4.6 Footer (`views/partials/footer.ejs`)
- **Layout:** 3-column grid — logo+copyright left (1/3), 4-column link grid right (2/3)
- **Top border:** `1px solid var(--border)` with a blurred radial glow line centered at the top
- **Logo column:** CryptoPulse logo + "© 2026 CryptoPulse. All rights reserved." in `var(--muted-foreground)`
- **Link columns:** Product | Company | Resources | Social Links
  - Product: Features (#features), Markets (/markets), Portfolio (/portfolio), Graphs (/graphs)
  - Company: About (/about), Privacy Policy (#), Terms of Service (#)
  - Resources: Help (#), Changelog (#)
  - Social Links: Facebook, Instagram, Youtube, LinkedIn (with SVG icons from Lucide CDN)
- **Link style:** `var(--muted-foreground)`, hover → `var(--foreground)`, 0.3s transition
- **Entrance:** each column animates in with blur+fade, staggered 0.1s per column
- **Social icons:** Lucide SVG icons inlined directly as `<svg>` strings in the EJS template (no CDN dependency)

---

## 5. Markets Page (`views/partials/markets.ejs`)

Full structural rebuild.

### 5.1 Page Header
- Title "Markets" in `var(--foreground)`, large
- Live search input (right-aligned): filters table rows in real-time via JS
- Input style: `var(--input)` bg, `var(--border)` border, amber focus ring

### 5.2 Trending Cards (Top 3)
- 3 cards in a horizontal row showing the top 3 coins by 24h volume
- **Card:** `var(--card)` bg, `var(--border)` border, amber glow on hover, `border-radius: var(--radius)`
- **Card content:** 🔥 "Trending" badge (amber), coin logo (32px circle), coin name + symbol, current price in `var(--foreground)`, 24h% change badge (green/red)
- **Entrance:** 3 cards animate in with blur+fade, staggered 0.1s apart

### 5.3 Market Table
- Columns: `#` (rank) | Coin (logo + name + symbol) | Price | 24h% | Market Cap | Volume
- **Header row:** `var(--muted-foreground)` text, `var(--border)` bottom border, sticky on scroll
- **Data rows:** `var(--background)` base, alternating `var(--card)` for even rows, hover → amber left border `2px`
- **% change badges:** inline pill — green (`var(--color-up)`) bg at 15% opacity + text for positive, red for negative
- **Coin cell:** 32px circular logo + bold name + muted symbol below
- **Populated by:** existing `markets.js` fetch from CoinGecko API — markup updated, JS data binding updated to match new HTML structure
- **Search:** filters visible rows live without re-fetching
- **Entrance:** table animates in as a unit with blur+fade on load

---

## 6. Auth Pages (`views/auth/login.ejs`, `views/auth/register.ejs`)

### Layout
Centered card on `var(--background)` page background.

```
Page bg: #171717
  └── Card: #262626, border: var(--border), border-radius: 12px, max-width: 420px
        ├── CryptoPulse logo + title
        ├── Form fields (staggered blur+fade, each with 0.1s delay increment)
        └── Submit button (amber filled)
```

- **Inputs:** `var(--input)` bg, `var(--border)` border, amber focus ring (`box-shadow: 0 0 0 3px rgba(245,158,11,0.2)`)
- **Submit button:** `var(--primary)` bg, `var(--primary-foreground)` text, hover darkens to `#d97706`
- **Links:** `var(--primary)` color, hover underline
- **Error alerts:** `var(--destructive)` border at 30% opacity, matching bg tint
- **Entrance:** entire card fades+blurs in on page load; form fields stagger in sequentially

---

## 7. Portfolio Dashboard (`views/portfolio/dashboard.ejs`)

No structural changes. Updates:
- All hardcoded colors → CSS variables
- Summary cards, holdings table, analytics cards, modal: all get `.animate-in` class
- Blur+fade entrance triggered by IntersectionObserver on page load
- Chart colors updated to use `--chart-1` through `--chart-5`
- Green P/L → `var(--color-up)`, red P/L → `var(--color-down)`

---

## 8. Watchlist Page (`views/portfolio/watchlist.ejs`)

No structural changes. Same updates as Portfolio:
- All hardcoded colors → CSS variables
- Watchlist table, empty state, action buttons: `.animate-in` added
- Change badges use `var(--color-up)` / `var(--color-down)`

---

## 9. File Changes Summary

| File | Change Type |
|------|-------------|
| `public/css/theme.css` | **NEW** — design token file |
| `public/js/observer.js` | **NEW** — IntersectionObserver animation script |
| `views/partials/header.ejs` | **REBUILD** — new nav layout |
| `views/partials/footer.ejs` | **REBUILD** — 4-column animated footer |
| `views/index.ejs` | **REBUILD** — all 6 sections |
| `views/partials/markets.ejs` | **REBUILD** — cards + table layout |
| `views/auth/login.ejs` | **UPDATE** — themed, animated |
| `views/auth/register.ejs` | **UPDATE** — themed, animated |
| `views/portfolio/dashboard.ejs` | **UPDATE** — tokens + animations |
| `views/portfolio/watchlist.ejs` | **UPDATE** — tokens + animations |
| `public/css/styles.css` | **UPDATE** — hardcoded colors → variables |
| `public/css/markets.css` | **UPDATE** — hardcoded colors → variables |
| `public/css/portfolio.css` | **UPDATE** — hardcoded colors → variables |
| `public/css/watchlist.css` | **UPDATE** — hardcoded colors → variables |
| `public/css/auth.css` | **UPDATE** — hardcoded colors → variables |
| `public/css/other.css` | **UPDATE** — hardcoded colors → variables, fix 100px padding bug |
| `public/css/about.css` | **UPDATE** — hardcoded colors → variables |
| `public/css/chart.css` | **UPDATE** — hardcoded colors → variables |

---

## 10. Out of Scope

- No light mode toggle
- No changes to backend routes, API calls, or session logic
- No changes to Portfolio/Watchlist page structure or functionality
- No new pages added
- `@theme inline` Tailwind block not used
