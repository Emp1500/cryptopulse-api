# Dashboard Redesign & Animations Fix — Design Spec
**Date:** 2026-06-18  
**Status:** Approved

---

## Overview

Two scoped changes:

1. **Multi-tab Portfolio Dashboard** — Replace the single `/portfolio` page with a tabbed dashboard (Overview, Holdings, Analytics, Watchlist). Add a permanent "Dashboard" nav link in the navbar. Fix the post-login redirect session flush bug. Add coin-search autocomplete to the Add Holding flow.
2. **Lottie Animations Fix** — Swap the `unpkg.com` lottie-player CDN link (blocked by CSP) for `cdn.jsdelivr.net` (already whitelisted).

---

## 1. Navbar

### Logged-out state
```
Home  |  Markets  |  About  ||  Login   Sign Up
```

### Logged-in state
```
Home  |  Markets  |  About  |  Dashboard  ||  [Avatar dropdown → My Portfolio / Watchlist / Logout]
```

**Rules:**
- "Dashboard" nav link is present in the markup at all times but only rendered when `user` session exists (same pattern as today).
- Logged-out users who navigate to `/portfolio` are redirected to `/auth/login` by the existing `isAuthenticated` middleware — no change needed.
- The avatar dropdown keeps its current three items: My Portfolio, Watchlist, Logout.

**File:** `views/partials/header.ejs` — add `<li><a href="/portfolio" class="nav-link">Dashboard</a></li>` inside the `<% if (user) %>` block, after "About".

---

## 2. Multi-tab Dashboard (`/portfolio`)

### Tab structure

Four client-side tabs — switching tabs does **not** reload the page. Active tab tracked in a `data-tab` attribute; JS toggles `.tab-active` class.

| Tab | Route/anchor | Content |
|-----|-------------|---------|
| Overview | `#overview` | Summary cards + charts |
| Holdings | `#holdings` | Holdings table + Add/Edit/Delete |
| Analytics | `#analytics` | Per-coin P/L bar, allocation donut, best/worst cards |
| Watchlist | `#watchlist` | Existing watchlist content inlined |

URL hash updates on tab switch (`history.replaceState`) so direct links and back-button work.

### 2a. Overview tab

**Summary cards (top row):**
- Total Portfolio Value (current market value of all holdings)
- Total Invested (sum of quantity × purchase price per holding)
- Total P/L in $ with sign (Value − Invested)
- Total P/L % with sign

**Charts (below cards):**
- Allocation pie chart — % of portfolio by coin (existing chart.js pie, already in codebase)
- Performance line chart — mock simulated curve until real historical data is available (existing approach, already in codebase)

**Empty state (zero holdings):**
Single centred onboarding card:
```
[coin stack icon]
"Add your first coin to start tracking"
[Add Holding →] button — switches to Holdings tab and opens the Add modal
```

### 2b. Holdings tab

**Table columns:** Coin (logo + name + symbol) | Qty | Avg Buy Price | Current Price | Current Value | P/L ($) | P/L (%) | Actions (Edit / Delete)

**Add Holding modal — coin search flow:**
1. User types coin name or symbol into a search input.
2. Client filters the already-loaded `/api/markets` JSON (100 coins) by name/symbol match — no extra API call.
3. Dropdown shows matching coins (logo, name, symbol). User clicks to select.
4. Hidden fields `coinId`, `name`, `symbol` are populated automatically.
5. User enters Quantity and Purchase Price, optionally Purchase Date.
6. Submit → `POST /portfolio/holdings` (existing route, no server change needed).

**Edit / Delete:** Existing modal + `PUT /portfolio/holdings/:id` / `DELETE /portfolio/holdings/:id` — no change.

### 2c. Analytics tab

Three components:

| Component | Type | Data source |
|-----------|------|-------------|
| P/L by Coin | Horizontal bar chart (chart.js) | `holdings` array from server — bar per coin, green/red fill |
| Allocation | Donut chart (chart.js) | Same holdings array — % by current value |
| Best / Worst performers | Two summary cards | Top gain % and top loss % from holdings |

If holdings array is empty, show a single message: "Add holdings in the Holdings tab to see analytics."

### 2d. Watchlist tab

Renders the existing watchlist HTML inline (currently at `/portfolio/watchlist`). Two options:

- **Option W1 (chosen):** Server renders watchlist data into the same `/portfolio` template as a second data block. Tab content is hidden/shown by JS. No AJAX needed.
- ~~Option W2: AJAX fetch of `/portfolio/watchlist` HTML on tab click.~~ (Rejected — two round trips, harder to style consistently.)

Server-side: the `GET /portfolio` route fetches both holdings data AND watchlist data and passes both to the template.

---

## 3. Login Redirect Fix

**Root cause:** On Vercel serverless, `res.redirect()` sends the 302 before `connect-pg-simple` has finished writing the session to PostgreSQL. The browser follows the redirect before the session cookie is valid, so `isAuthenticated` at `/portfolio` finds no session and redirects back to login — a loop that looks like "nothing happened."

**Fix:** Wrap the redirect in `req.session.save()`:

```js
// routes/auth.js — POST /login success path
req.session.save((err) => {
  if (err) {
    logger.error('Session save error:', err);
    return res.render('auth/login', { error: 'Login failed. Please try again.', success: null });
  }
  res.redirect('/portfolio');
});
```

Same fix applied to `POST /register` which currently redirects to `/auth/login?registered=true`.

---

## 4. Lottie Animations Fix

**Root cause:** `views/index.ejs` loads lottie-player from `https://unpkg.com/...`. The helmet CSP `scriptSrc` whitelist contains `cdn.jsdelivr.net` and `cdnjs.cloudflare.com` but not `unpkg.com`. Browser blocks the script → `<lottie-player>` elements are unknown custom elements → animations never render.

**Fix:** Replace the script tag in `views/index.ejs`:

```html
<!-- Before -->
<script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>

<!-- After -->
<script src="https://cdn.jsdelivr.net/npm/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>
```

No CSP changes needed. The three animation files (`blockchain.json`, `coins.json`, `network.json`) are already in `/public/animations/` and served as static assets.

---

## 5. Files Changed

| File | Change |
|------|--------|
| `views/partials/header.ejs` | Add Dashboard nav link in logged-in block |
| `views/portfolio/dashboard.ejs` | Restructure into 4-tab layout; add coin search in Add modal; inline watchlist tab content |
| `views/portfolio/watchlist.ejs` | No change (still accessible directly at `/portfolio/watchlist`) |
| `routes/portfolio.js` | `GET /portfolio` fetches watchlist data in addition to holdings |
| `routes/auth.js` | Wrap both redirects in `req.session.save()` |
| `views/index.ejs` | Swap lottie CDN script tag |
| `public/css/portfolio.css` | Add tab nav styles, analytics section styles, onboarding card styles |

---

## 6. Out of Scope

- Real historical price data for the performance chart (stays mock/simulated)
- Price alerts
- CSV export
- Mobile-specific tab layout (tabs scroll horizontally on small screens — standard CSS overflow-x)
- Changes to the watchlist server route (`/portfolio/watchlist` still works as a standalone page)
