# Dashboard, Animations & About Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the portfolio into a 4-tab dashboard, fix lottie animations, fix the post-login session redirect, and rewrite the about page to match the site's dark amber design.

**Architecture:** All dashboard state lives in one server-rendered EJS template at `/portfolio`. Tab switching is pure client-side JS (no page reloads). Watchlist data is fetched server-side alongside holdings so the Watchlist tab has data on first paint. The about page drops Tailwind + Bootstrap and uses only `theme.css` + a rebuilt `about.css`.

**Tech Stack:** Node.js/Express, EJS, Supabase (postgres), Chart.js, vanilla JS, CSS custom properties via `theme.css`.

## Global Constraints

- All CSS uses variables from `public/css/theme.css` — never hardcode colours
- No Tailwind, no Bootstrap on pages that don't already use it (about page, home page)
- `scriptSrc` CSP whitelist: `'self'`, `'unsafe-inline'`, `cdn.jsdelivr.net`, `cdnjs.cloudflare.com` — no `unpkg.com`
- `imgSrc` CSP whitelist: `'self'`, `data:`, `assets.coingecko.com`, `coin-images.coingecko.com` — no external placeholder services
- Animations use the existing `public/js/observer.js` IntersectionObserver — add `class="animate-in"` to trigger
- Commits must not include `Co-Authored-By` tags
- Test runner: `npm test` (Jest + Supertest against test Supabase project)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `views/index.ejs` | Modify | Swap lottie CDN URL |
| `routes/auth.js` | Modify | Wrap login + register redirects in `req.session.save()` |
| `views/partials/header.ejs` | Modify | Add Dashboard nav link in logged-in block |
| `routes/portfolio.js` | Modify | `GET /portfolio` also fetches watchlist data |
| `public/css/portfolio.css` | Modify | Add tab nav, analytics, onboarding card, watchlist-inline styles |
| `views/portfolio/dashboard.ejs` | Rewrite | 4-tab layout: Overview, Holdings, Analytics, Watchlist |
| `views/partials/about.ejs` | Rewrite | Remove Tailwind/Bootstrap, match dark amber design |
| `public/css/about.css` | Rewrite | Clean layout using theme.css tokens only |
| `tests/integration/auth.test.js` | Modify | Add test: POST /login redirects to /portfolio |
| `tests/integration/portfolio.test.js` | Modify | Add test: GET /portfolio includes watchlist data |

---

## Task 1: Fix Lottie Animations

**Files:**
- Modify: `views/index.ejs:178`

**Interfaces:**
- Produces: `<lottie-player>` elements render `blockchain.json` and `network.json` from `/animations/`

- [ ] **Step 1: Replace the CDN script tag**

Open `views/index.ejs`. Find line 178 and replace:

```html
<script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>
```

with:

```html
<script src="https://cdn.jsdelivr.net/npm/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>
```

- [ ] **Step 2: Verify the two lottie usages are correct**

Confirm these two blocks in `views/index.ejs` reference the correct local paths (no change needed, just verify):

```html
<!-- hero section -->
<lottie-player src="/animations/blockchain.json" background="transparent" speed="1"
  style="width:500px;height:500px;" loop autoplay></lottie-player>

<!-- features section -->
<lottie-player src="/animations/network.json" background="transparent" speed="1"
  style="width:400px;height:400px;" loop autoplay></lottie-player>
```

- [ ] **Step 3: Commit**

```bash
git add views/index.ejs
git commit -m "fix: swap lottie CDN from unpkg to jsdelivr to satisfy CSP"
```

---

## Task 2: Fix Post-Login Session Redirect

**Files:**
- Modify: `routes/auth.js`
- Modify: `tests/integration/auth.test.js`

**Interfaces:**
- Produces: `POST /auth/login` → `302 /portfolio` after session is guaranteed flushed to PostgreSQL

- [ ] **Step 1: Write the failing test**

Open `tests/integration/auth.test.js`. Add this test inside the existing `describe('POST /auth/login', ...)` block (add the describe block if it doesn't exist yet):

```js
describe('POST /auth/login', () => {
  test('redirects to /portfolio on valid credentials', async () => {
    const user = await createTestUser({ email: 'test-login-redirect@example.com', password: 'password123' });
    const res = await request(app)
      .post('/auth/login')
      .type('form')
      .send({ email: user.email, password: 'password123' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/portfolio');
  });

  test('returns 200 with error on invalid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .type('form')
      .send({ email: 'nobody@example.com', password: 'wrong' });
    expect(res.status).toBe(200);
    expect(res.text).toContain('Invalid email or password');
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npm test -- --testPathPattern=auth
```

Expected: the redirect test fails — `Expected: 302, Received: 200` or the location header is missing. (The test Supabase environment uses in-memory sessions so the current code may actually pass here — if it passes, skip to Step 3 and the fix is purely for production Vercel behaviour.)

- [ ] **Step 3: Wrap the login redirect in session.save()**

In `routes/auth.js`, replace the success block of `POST /auth/login` (the two lines after `req.session.user = ...`):

```js
// BEFORE
req.session.user = { id: user.id, name: user.name, email: user.email };
res.redirect('/portfolio');
```

```js
// AFTER
req.session.user = { id: user.id, name: user.name, email: user.email };
req.session.save((err) => {
  if (err) {
    logger.error(`Session save error on login: ${err}`);
    return res.render('auth/login', { error: 'Login failed. Please try again.', success: null });
  }
  res.redirect('/portfolio');
});
```

- [ ] **Step 4: Wrap the register redirect in session.save()**

In `routes/auth.js`, replace the final line of the `POST /auth/register` success path:

```js
// BEFORE
res.redirect('/auth/login?registered=true');
```

```js
// AFTER — register doesn't set a session, but save() ensures any flash state is flushed
req.session.save((err) => {
  if (err) logger.error(`Session save error on register: ${err}`);
  res.redirect('/auth/login?registered=true');
});
```

- [ ] **Step 5: Run the tests**

```bash
npm test -- --testPathPattern=auth
```

Expected: all auth tests pass.

- [ ] **Step 6: Commit**

```bash
git add routes/auth.js tests/integration/auth.test.js
git commit -m "fix: wrap login and register redirects in session.save() for Vercel serverless"
```

---

## Task 3: Add Dashboard Nav Link

**Files:**
- Modify: `views/partials/header.ejs`

**Interfaces:**
- Produces: logged-in nav renders `Home | Markets | About | Dashboard`

- [ ] **Step 1: Add the Dashboard link**

Open `views/partials/header.ejs`. Inside the `<% if (typeof user !== 'undefined' && user) { %>` block in `<ul class="nav-links">`, add the Dashboard link after About:

```html
<ul class="nav-links">
  <li><a href="/" class="nav-link">Home</a></li>
  <% if (typeof user !== 'undefined' && user) { %>
    <li><a href="/portfolio" class="nav-link">Dashboard</a></li>
  <% } %>
  <li><a href="/markets" class="nav-link">Market</a></li>
  <li><a href="/about" class="nav-link">About</a></li>
</ul>
```

The Dashboard link should appear between Home and Market when logged in:

```html
<ul class="nav-links">
  <li><a href="/" class="nav-link">Home</a></li>
  <li><a href="/markets" class="nav-link">Market</a></li>
  <li><a href="/about" class="nav-link">About</a></li>
  <% if (typeof user !== 'undefined' && user) { %>
    <li><a href="/portfolio" class="nav-link">Dashboard</a></li>
  <% } %>
</ul>
```

- [ ] **Step 2: Commit**

```bash
git add views/partials/header.ejs
git commit -m "feat: add Dashboard nav link for authenticated users"
```

---

## Task 4: Update GET /portfolio Route to Include Watchlist Data

**Files:**
- Modify: `routes/portfolio.js`
- Modify: `tests/integration/portfolio.test.js`

**Interfaces:**
- Produces: `res.render('portfolio/dashboard', { holdings, totalValue, totalInvested, totalProfitLoss, totalProfitLossPercent, watchlist })`
- `watchlist` is an array of objects with shape: `{ id, coinId, name, symbol, image, currentPrice, priceChange24h, priceChange7d, marketCap, volume24h }`

- [ ] **Step 1: Write the failing test**

Open `tests/integration/portfolio.test.js`. Add inside the existing `describe('GET /portfolio', ...)` block:

```js
test('renders page with watchlist data available', async () => {
  await createTestWatchlistCoin(testUser.id, { coin_id: 'ethereum', symbol: 'ETH', name: 'Ethereum' });
  const res = await agent.get('/portfolio');
  expect(res.status).toBe(200);
  // The rendered page must contain the watchlist coin name somewhere in the HTML
  expect(res.text).toContain('Ethereum');
});
```

Import `createTestWatchlistCoin` at the top of the file if it isn't already:

```js
const { testSupabase, createTestUser, cleanTestUsers, createTestHolding, createTestWatchlistCoin } = require('../helpers/db');
```

Also add to the `afterEach` cleanup:

```js
afterEach(async () => {
  await testSupabase.from('portfolio_holdings').delete().eq('user_id', testUser.id);
  await testSupabase.from('watchlist').delete().eq('user_id', testUser.id);
  await cleanTestUsers();
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npm test -- --testPathPattern=portfolio
```

Expected: FAIL — the page renders but doesn't contain the watchlist coin name.

- [ ] **Step 3: Update GET /portfolio in routes/portfolio.js**

Replace the entire `router.get('/', ...)` handler with this version that also fetches watchlist data:

```js
router.get('/', isAuthenticated, async (req, res) => {
  const userId = req.session.user.id;

  // Fetch holdings and watchlist in parallel
  const [holdingsResult, watchlistResult] = await Promise.all([
    supabase.from('portfolio_holdings').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('watchlist').select('*').eq('user_id', userId).order('added_at', { ascending: true })
  ]);

  if (holdingsResult.error) {
    logger.error(`Portfolio holdings fetch failed: ${holdingsResult.error.message}`);
    return res.status(500).send('Failed to load portfolio');
  }
  if (watchlistResult.error) {
    logger.error(`Watchlist fetch failed: ${watchlistResult.error.message}`);
    return res.status(500).send('Failed to load portfolio');
  }

  const holdings = holdingsResult.data;
  const watchlistCoins = watchlistResult.data;

  // Fetch live prices for holdings and watchlist in parallel
  const holdingCoinIds = holdings.map(h => h.coin_id);
  const watchlistCoinIds = watchlistCoins.map(c => c.coin_id);

  const [prices, coinDataMap] = await Promise.all([
    fetchCurrentPrices(holdingCoinIds),
    fetchWatchlistData(watchlistCoinIds)
  ]);

  // Enrich holdings
  let totalValue = 0;
  let totalInvested = 0;

  const holdingsWithPrices = holdings.map(holding => {
    const currentPrice = prices[holding.coin_id]?.usd || Number(holding.purchase_price);
    const priceChange24h = prices[holding.coin_id]?.usd_24h_change || 0;
    const currentValue = Number(holding.quantity) * currentPrice;
    const investedValue = Number(holding.quantity) * Number(holding.purchase_price);
    const profitLoss = currentValue - investedValue;
    const profitLossPercent = ((currentPrice - Number(holding.purchase_price)) / Number(holding.purchase_price)) * 100;

    totalValue += currentValue;
    totalInvested += investedValue;

    return {
      ...holding,
      coinId: holding.coin_id,
      purchasePrice: Number(holding.purchase_price),
      purchaseDate: holding.purchase_date,
      currentPrice,
      priceChange24h,
      currentValue,
      investedValue,
      profitLoss,
      profitLossPercent
    };
  });

  const totalProfitLoss = totalValue - totalInvested;
  const totalProfitLossPercent = totalInvested > 0 ? ((totalProfitLoss / totalInvested) * 100) : 0;

  // Enrich watchlist
  const watchlist = watchlistCoins.map(coin => {
    const data = coinDataMap.get(coin.coin_id);
    return {
      ...coin,
      coinId: coin.coin_id,
      currentPrice: data?.current_price || null,
      priceChange24h: data?.price_change_percentage_24h || 0,
      priceChange7d: data?.price_change_percentage_7d_in_currency || 0,
      marketCap: data?.market_cap || null,
      volume24h: data?.total_volume || null,
      image: data?.image || coin.image
    };
  });

  res.render('portfolio/dashboard', {
    user: req.session.user,
    holdings: holdingsWithPrices,
    totalValue,
    totalInvested,
    totalProfitLoss,
    totalProfitLossPercent,
    watchlist
  });
});
```

- [ ] **Step 4: Run the tests**

```bash
npm test -- --testPathPattern=portfolio
```

Expected: all portfolio tests pass including the new watchlist one.

- [ ] **Step 5: Commit**

```bash
git add routes/portfolio.js tests/integration/portfolio.test.js
git commit -m "feat: fetch watchlist data in GET /portfolio for dashboard watchlist tab"
```

---

## Task 5: Dashboard Tab CSS

**Files:**
- Modify: `public/css/portfolio.css`

**Interfaces:**
- Produces: CSS classes consumed by Tasks 6–8: `.tab-nav`, `.tab-btn`, `.tab-btn.active`, `.tab-panel`, `.tab-panel.active`, `.onboarding-card`, `.analytics-grid`, `.analytics-chart-card`, `.perf-cards`, `.perf-card`, `.perf-card.best`, `.perf-card.worst`, `.watchlist-inline-grid`, `.watchlist-inline-card`, `.wl-price-up`, `.wl-price-down`, `.empty-tab-msg`, `.charts-grid`

- [ ] **Step 1: Append tab and analytics styles to portfolio.css**

Open `public/css/portfolio.css` and append the following block at the end of the file:

```css
/* ── Tab Navigation ─────────────────────────────── */
.tab-nav {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 32px;
  overflow-x: auto;
  scrollbar-width: none;
}
.tab-nav::-webkit-scrollbar { display: none; }

.tab-btn {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--muted-foreground);
  padding: 12px 24px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  margin-bottom: -1px;
  transition: color 0.2s, border-color 0.2s;
  font-family: var(--font-sans);
}
.tab-btn:hover { color: var(--foreground); }
.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.tab-panel { display: none; }
.tab-panel.active { display: block; }

/* ── Onboarding Card (empty state) ──────────────── */
.onboarding-card {
  text-align: center;
  padding: 80px 40px;
  background: var(--card);
  border-radius: 16px;
  border: 1px solid var(--border);
  margin: 40px auto;
  max-width: 480px;
}
.onboarding-card .onboard-icon {
  width: 64px;
  height: 64px;
  color: var(--primary);
  margin: 0 auto 20px;
}
.onboarding-card h3 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--foreground);
}
.onboarding-card p {
  color: var(--muted-foreground);
  font-size: 0.95rem;
  margin-bottom: 28px;
}

/* ── Charts Grid (Overview tab) ─────────────────── */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 28px;
}
@media (max-width: 768px) {
  .charts-grid { grid-template-columns: 1fr; }
}

/* ── Analytics Tab ───────────────────────────────── */
.analytics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}
@media (max-width: 768px) {
  .analytics-grid { grid-template-columns: 1fr; }
}

.analytics-chart-card {
  background: var(--card);
  border-radius: 12px;
  border: 1px solid var(--border);
  padding: 24px;
}
.analytics-chart-card h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted-foreground);
  margin-bottom: 20px;
}

.perf-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 24px;
}
.perf-card {
  background: var(--card);
  border-radius: 12px;
  border: 1px solid var(--border);
  padding: 20px 24px;
}
.perf-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted-foreground);
  margin-bottom: 8px;
}
.perf-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 4px;
}
.perf-value {
  font-size: 1.5rem;
  font-weight: 700;
}
.perf-card.best .perf-value { color: #22c55e; }
.perf-card.worst .perf-value { color: #ef4444; }

.empty-tab-msg {
  text-align: center;
  padding: 60px 20px;
  color: var(--muted-foreground);
  font-size: 0.95rem;
}

/* ── Watchlist Inline Tab ────────────────────────── */
.watchlist-tab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.watchlist-tab-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--foreground);
}

.watchlist-inline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.watchlist-inline-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: border-color 0.2s, transform 0.2s;
}
.watchlist-inline-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
}
.wl-coin-logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}
.wl-coin-logo-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary);
}
.wl-coin-info { flex: 1; min-width: 0; }
.wl-coin-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.wl-coin-symbol {
  font-size: 0.75rem;
  color: var(--muted-foreground);
  text-transform: uppercase;
}
.wl-coin-price {
  text-align: right;
}
.wl-price-val {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--foreground);
}
.wl-price-change {
  font-size: 0.75rem;
  font-weight: 500;
}
.wl-price-up { color: #22c55e; }
.wl-price-down { color: #ef4444; }

.wl-remove-btn {
  background: none;
  border: none;
  color: var(--muted-foreground);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s;
  flex-shrink: 0;
}
.wl-remove-btn:hover { color: #ef4444; }
```

- [ ] **Step 2: Commit**

```bash
git add public/css/portfolio.css
git commit -m "feat: add tab nav, analytics, onboarding, and watchlist-inline CSS"
```

---

## Task 6: Rebuild dashboard.ejs — Tab Skeleton, Overview Tab, Holdings Tab

**Files:**
- Rewrite: `views/portfolio/dashboard.ejs`

**Interfaces:**
- Consumes: `holdings[]`, `totalValue`, `totalInvested`, `totalProfitLoss`, `totalProfitLossPercent`, `watchlist[]` from server (Task 4)
- Consumes: CSS classes from Task 5
- Produces: tab skeleton + Overview tab (summary cards + charts + empty onboarding) + Holdings tab (table + coin-search add modal + edit modal)

- [ ] **Step 1: Replace dashboard.ejs with the full 4-tab template**

Replace the entire contents of `views/portfolio/dashboard.ejs` with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - CryptoPulse</title>
  <link rel="stylesheet" href="/css/theme.css">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="/css/other.css">
  <link rel="stylesheet" href="/css/portfolio.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <%- include('../partials/header') %>

  <div class="portfolio-container">

    <!-- Page header -->
    <div class="portfolio-header">
      <div>
        <h1>Dashboard</h1>
        <p>Track and manage your cryptocurrency portfolio</p>
      </div>
      <button class="btn-add-holding" id="btnAddHolding">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Holding
      </button>
    </div>

    <!-- Tab Navigation -->
    <nav class="tab-nav" role="tablist">
      <button class="tab-btn active" data-tab="overview" role="tab">Overview</button>
      <button class="tab-btn" data-tab="holdings" role="tab">Holdings</button>
      <button class="tab-btn" data-tab="analytics" role="tab">Analytics</button>
      <button class="tab-btn" data-tab="watchlist" role="tab">Watchlist</button>
    </nav>

    <!-- ══════════════ OVERVIEW TAB ══════════════ -->
    <div class="tab-panel active" id="panel-overview">

      <% if (holdings.length === 0) { %>
        <div class="onboarding-card animate-in">
          <svg class="onboard-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>Add your first coin to start tracking</h3>
          <p>Add a cryptocurrency holding to see your portfolio value, profit/loss, and analytics.</p>
          <button class="btn-add-holding" id="btnOnboardAdd">Add Holding →</button>
        </div>

      <% } else { %>

        <!-- Summary Cards -->
        <div class="summary-cards animate-in">
          <div class="summary-card">
            <div class="summary-label">Portfolio Value</div>
            <div class="summary-value">$<%= totalValue.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2}) %></div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Total Invested</div>
            <div class="summary-value">$<%= totalInvested.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2}) %></div>
          </div>
          <div class="summary-card <%= totalProfitLoss >= 0 ? 'profit' : 'loss' %>">
            <div class="summary-label">Profit / Loss</div>
            <div class="summary-value">
              <%= totalProfitLoss >= 0 ? '+' : '' %>$<%= Math.abs(totalProfitLoss).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2}) %>
            </div>
          </div>
          <div class="summary-card <%= totalProfitLossPercent >= 0 ? 'profit' : 'loss' %>">
            <div class="summary-label">Return</div>
            <div class="summary-value">
              <%= totalProfitLossPercent >= 0 ? '+' : '' %><%= totalProfitLossPercent.toFixed(2) %>%
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="charts-grid animate-in" style="transition-delay:0.1s">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Allocation</h3>
            </div>
            <div class="chart-body">
              <canvas id="allocationChart"></canvas>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Performance</h3>
              <div class="time-filters">
                <button class="time-btn active" data-period="7d">7D</button>
                <button class="time-btn" data-period="30d">30D</button>
                <button class="time-btn" data-period="90d">90D</button>
              </div>
            </div>
            <div class="chart-body">
              <canvas id="performanceChart"></canvas>
            </div>
          </div>
        </div>

      <% } %>
    </div><!-- /overview -->

    <!-- ══════════════ HOLDINGS TAB ══════════════ -->
    <div class="tab-panel" id="panel-holdings">

      <% if (holdings.length === 0) { %>
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3>No Holdings Yet</h3>
          <p>Add your first cryptocurrency to start tracking your portfolio.</p>
          <button class="btn-add-holding" id="btnHoldingsAdd">Add Your First Holding</button>
        </div>
      <% } else { %>
        <div class="table-responsive">
          <table class="holdings-table">
            <thead>
              <tr>
                <th>Coin</th>
                <th>Quantity</th>
                <th>Avg Buy Price</th>
                <th>Current Price</th>
                <th>Value</th>
                <th>P/L ($)</th>
                <th>P/L (%)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <% holdings.forEach(holding => { %>
                <tr data-id="<%= holding.id %>">
                  <td>
                    <div class="coin-info">
                      <img src="<%= holding.image %>" alt="<%= holding.name %>" class="coin-icon"
                        onerror="this.style.display='none'">
                      <div>
                        <div class="coin-name"><%= holding.name %></div>
                        <div class="coin-symbol"><%= holding.symbol %></div>
                      </div>
                    </div>
                  </td>
                  <td><%= Number(holding.quantity).toLocaleString('en-US', {maximumFractionDigits:8}) %></td>
                  <td>$<%= holding.purchasePrice.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2}) %></td>
                  <td>
                    <div>$<%= holding.currentPrice.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2}) %></div>
                    <div class="price-change <%= holding.priceChange24h >= 0 ? 'positive' : 'negative' %>">
                      <%= holding.priceChange24h >= 0 ? '+' : '' %><%= holding.priceChange24h.toFixed(2) %>%
                    </div>
                  </td>
                  <td>$<%= holding.currentValue.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2}) %></td>
                  <td class="<%= holding.profitLoss >= 0 ? 'profit' : 'loss' %>">
                    <%= holding.profitLoss >= 0 ? '+' : '' %>$<%= Math.abs(holding.profitLoss).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2}) %>
                  </td>
                  <td class="<%= holding.profitLossPercent >= 0 ? 'profit' : 'loss' %>">
                    <%= holding.profitLossPercent >= 0 ? '+' : '' %><%= holding.profitLossPercent.toFixed(2) %>%
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn-action btn-edit"
                        onclick="openEditModal(<%= JSON.stringify(holding).replace(/"/g, '&quot;') %>)" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                          stroke-linejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button class="btn-action btn-delete" onclick="deleteHolding(<%= holding.id %>)"
                        title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                          stroke-linejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path
                            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
                          </path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              <% }) %>
            </tbody>
          </table>
        </div>
      <% } %>
    </div><!-- /holdings -->

    <!-- ══════════════ ANALYTICS TAB ══════════════ -->
    <div class="tab-panel" id="panel-analytics">
      <% if (holdings.length === 0) { %>
        <p class="empty-tab-msg">Add holdings in the Holdings tab to see analytics.</p>
      <% } else { %>
        <div class="analytics-grid">
          <div class="analytics-chart-card">
            <h3>P/L by Coin</h3>
            <canvas id="plBarChart"></canvas>
          </div>
          <div class="analytics-chart-card">
            <h3>Allocation</h3>
            <canvas id="analyticsDonut"></canvas>
          </div>
        </div>
        <div class="perf-cards">
          <%
            const best = holdings.reduce((a, b) => a.profitLossPercent > b.profitLossPercent ? a : b);
            const worst = holdings.reduce((a, b) => a.profitLossPercent < b.profitLossPercent ? a : b);
          %>
          <div class="perf-card best">
            <div class="perf-label">Best Performer</div>
            <div class="perf-name"><%= best.name %> (<%= best.symbol %>)</div>
            <div class="perf-value">+<%= best.profitLossPercent.toFixed(2) %>%</div>
          </div>
          <div class="perf-card worst">
            <div class="perf-label">Worst Performer</div>
            <div class="perf-name"><%= worst.name %> (<%= worst.symbol %>)</div>
            <div class="perf-value"><%= worst.profitLossPercent.toFixed(2) %>%</div>
          </div>
        </div>
      <% } %>
    </div><!-- /analytics -->

    <!-- ══════════════ WATCHLIST TAB ══════════════ -->
    <div class="tab-panel" id="panel-watchlist">
      <div class="watchlist-tab-header">
        <h2>My Watchlist</h2>
        <button class="btn-add-holding" id="btnAddWatchlist">+ Add Coin</button>
      </div>

      <% if (watchlist.length === 0) { %>
        <p class="empty-tab-msg">No coins in your watchlist yet. Add one above.</p>
      <% } else { %>
        <div class="watchlist-inline-grid">
          <% watchlist.forEach(coin => { %>
            <div class="watchlist-inline-card" data-coin-id="<%= coin.coinId %>">
              <% if (coin.image) { %>
                <img src="<%= coin.image %>" alt="<%= coin.name %>" class="wl-coin-logo"
                  onerror="this.style.display='none'">
              <% } else { %>
                <div class="wl-coin-logo-placeholder"><%= coin.symbol.charAt(0) %></div>
              <% } %>
              <div class="wl-coin-info">
                <div class="wl-coin-name"><%= coin.name %></div>
                <div class="wl-coin-symbol"><%= coin.symbol %></div>
              </div>
              <div class="wl-coin-price">
                <div class="wl-price-val">
                  <% if (coin.currentPrice) { %>
                    $<%= coin.currentPrice.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2}) %>
                  <% } else { %>
                    —
                  <% } %>
                </div>
                <div class="wl-price-change <%= coin.priceChange24h >= 0 ? 'wl-price-up' : 'wl-price-down' %>">
                  <%= coin.priceChange24h >= 0 ? '+' : '' %><%= coin.priceChange24h.toFixed(2) %>%
                </div>
              </div>
              <button class="wl-remove-btn" onclick="removeWatchlistCoin('<%= coin.coinId %>')" title="Remove">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          <% }) %>
        </div>
      <% } %>
    </div><!-- /watchlist -->

  </div><!-- /portfolio-container -->

  <!-- ══════════════ ADD HOLDING MODAL ══════════════ -->
  <div class="modal-overlay" id="addModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Add Holding</h2>
        <button class="modal-close" onclick="closeAddModal()">×</button>
      </div>
      <form id="addHoldingForm">

        <!-- Coin Search -->
        <div class="form-group" style="position:relative">
          <label class="form-label">Coin</label>
          <input type="text" id="coinSearch" class="form-input" placeholder="Search Bitcoin, ETH…"
            autocomplete="off">
          <div id="coinSearchResults" class="coin-search-dropdown" style="display:none"></div>
          <div id="selectedCoinDisplay" class="selected-coin-display" style="display:none"></div>
          <input type="hidden" id="coinId" name="coinId">
          <input type="hidden" id="coinSymbol" name="symbol">
          <input type="hidden" id="coinName" name="name">
          <input type="hidden" id="coinImage" name="image">
        </div>

        <div class="form-group">
          <label class="form-label">Quantity</label>
          <input type="number" name="quantity" class="form-input" placeholder="0.00" step="any" min="0.000001" required>
        </div>
        <div class="form-group">
          <label class="form-label">Purchase Price (USD)</label>
          <input type="number" name="purchasePrice" class="form-input" placeholder="0.00" step="any" min="0.01" required>
        </div>
        <div class="form-group">
          <label class="form-label">Purchase Date <span style="color:var(--muted-foreground);font-weight:400">(optional)</span></label>
          <input type="date" name="purchaseDate" class="form-input">
        </div>

        <div id="addFormError" class="form-error" style="display:none"></div>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" onclick="closeAddModal()">Cancel</button>
          <button type="submit" class="btn-submit">Add Holding</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ══════════════ EDIT HOLDING MODAL ══════════════ -->
  <div class="modal-overlay" id="editModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Edit Holding</h2>
        <button class="modal-close" onclick="closeEditModal()">×</button>
      </div>
      <form id="editHoldingForm">
        <input type="hidden" id="editHoldingId">
        <div class="form-group">
          <label class="form-label">Coin</label>
          <div id="editCoinDisplay" class="form-input" style="opacity:0.7;cursor:default"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Quantity</label>
          <input type="number" id="editQuantity" name="quantity" class="form-input" step="any" min="0.000001" required>
        </div>
        <div class="form-group">
          <label class="form-label">Purchase Price (USD)</label>
          <input type="number" id="editPurchasePrice" name="purchasePrice" class="form-input" step="any" min="0.01" required>
        </div>
        <div class="form-group">
          <label class="form-label">Purchase Date</label>
          <input type="date" id="editPurchaseDate" name="purchaseDate" class="form-input">
        </div>
        <div id="editFormError" class="form-error" style="display:none"></div>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" onclick="closeEditModal()">Cancel</button>
          <button type="submit" class="btn-submit">Save Changes</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ══════════════ ADD WATCHLIST MODAL ══════════════ -->
  <div class="modal-overlay" id="watchlistModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Add to Watchlist</h2>
        <button class="modal-close" onclick="closeWatchlistModal()">×</button>
      </div>
      <div class="form-group" style="position:relative">
        <label class="form-label">Search Coin</label>
        <input type="text" id="wlCoinSearch" class="form-input" placeholder="Search Bitcoin, ETH…"
          autocomplete="off">
        <div id="wlCoinSearchResults" class="coin-search-dropdown" style="display:none"></div>
        <div id="wlSelectedCoinDisplay" class="selected-coin-display" style="display:none"></div>
        <input type="hidden" id="wlCoinId">
        <input type="hidden" id="wlCoinSymbol">
        <input type="hidden" id="wlCoinName">
        <input type="hidden" id="wlCoinImage">
      </div>
      <div id="wlFormError" class="form-error" style="display:none"></div>
      <div class="modal-actions">
        <button type="button" class="btn-cancel" onclick="closeWatchlistModal()">Cancel</button>
        <button type="button" class="btn-submit" onclick="submitWatchlistAdd()">Add to Watchlist</button>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="modalBackdrop" onclick="closeAllModals()"></div>

  <!-- ══════════════ SCRIPTS ══════════════ -->
  <script>
    // ── Tab switching ─────────────────────────────
    const VALID_TABS = ['overview', 'holdings', 'analytics', 'watchlist'];

    function switchTab(tabId) {
      if (!VALID_TABS.includes(tabId)) tabId = 'overview';
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('panel-' + tabId).classList.add('active');
      document.querySelector('[data-tab="' + tabId + '"]').classList.add('active');
      history.replaceState(null, '', '#' + tabId);
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Activate tab from URL hash on load
    const initialTab = location.hash.slice(1);
    switchTab(VALID_TABS.includes(initialTab) ? initialTab : 'overview');

    // ── Add/Edit modal helpers ─────────────────────
    function openAddModal() {
      resetAddForm();
      document.getElementById('addModal').classList.add('active');
      document.getElementById('modalBackdrop').classList.add('active');
    }
    function closeAddModal() {
      document.getElementById('addModal').classList.remove('active');
      document.getElementById('modalBackdrop').classList.remove('active');
    }
    function openEditModal(holding) {
      document.getElementById('editHoldingId').value = holding.id;
      document.getElementById('editCoinDisplay').textContent = holding.name + ' (' + holding.symbol + ')';
      document.getElementById('editQuantity').value = holding.quantity;
      document.getElementById('editPurchasePrice').value = holding.purchasePrice;
      document.getElementById('editPurchaseDate').value = holding.purchaseDate || '';
      document.getElementById('editFormError').style.display = 'none';
      document.getElementById('editModal').classList.add('active');
      document.getElementById('modalBackdrop').classList.add('active');
    }
    function closeEditModal() {
      document.getElementById('editModal').classList.remove('active');
      document.getElementById('modalBackdrop').classList.remove('active');
    }
    function openWatchlistModal() {
      resetWatchlistForm();
      document.getElementById('watchlistModal').classList.add('active');
      document.getElementById('modalBackdrop').classList.add('active');
    }
    function closeWatchlistModal() {
      document.getElementById('watchlistModal').classList.remove('active');
      document.getElementById('modalBackdrop').classList.remove('active');
    }
    function closeAllModals() {
      closeAddModal(); closeEditModal(); closeWatchlistModal();
    }

    // Wire up all "Add Holding" buttons
    ['btnAddHolding', 'btnOnboardAdd', 'btnHoldingsAdd'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => { switchTab('holdings'); openAddModal(); });
    });
    document.getElementById('btnAddWatchlist').addEventListener('click', openWatchlistModal);

    // ── Coin search (shared for Add + Watchlist modal) ──
    let marketCoins = [];

    async function loadMarketCoins() {
      if (marketCoins.length > 0) return;
      try {
        const res = await fetch('/api/markets');
        marketCoins = await res.json();
      } catch (e) {
        console.error('Failed to load market coins', e);
      }
    }

    function filterCoins(query) {
      const q = query.toLowerCase().trim();
      if (!q) return [];
      return marketCoins.filter(c =>
        c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
      ).slice(0, 8);
    }

    function buildCoinDropdown(coins, onSelect) {
      const ul = document.createElement('ul');
      ul.style.cssText = 'list-style:none;margin:0;padding:0';
      coins.forEach(coin => {
        const li = document.createElement('li');
        li.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border)';
        li.innerHTML =
          '<img src="' + coin.image + '" alt="" style="width:24px;height:24px;border-radius:50%">' +
          '<span style="font-weight:600;font-size:.9rem">' + coin.name + '</span>' +
          '<span style="color:var(--muted-foreground);font-size:.8rem;margin-left:auto">' + coin.symbol.toUpperCase() + '</span>';
        li.addEventListener('mouseenter', () => li.style.background = 'var(--muted)');
        li.addEventListener('mouseleave', () => li.style.background = '');
        li.addEventListener('click', () => onSelect(coin));
        ul.appendChild(li);
      });
      return ul;
    }

    function wireSearchInput(inputId, resultsId, displayId, hiddenIds, onSelect) {
      const input = document.getElementById(inputId);
      const results = document.getElementById(resultsId);
      const display = document.getElementById(displayId);

      input.addEventListener('focus', loadMarketCoins);
      input.addEventListener('input', () => {
        const coins = filterCoins(input.value);
        results.innerHTML = '';
        if (!coins.length) { results.style.display = 'none'; return; }
        results.appendChild(buildCoinDropdown(coins, coin => {
          document.getElementById(hiddenIds.coinId).value = coin.id;
          document.getElementById(hiddenIds.symbol).value = coin.symbol;
          document.getElementById(hiddenIds.name).value = coin.name;
          document.getElementById(hiddenIds.image).value = coin.image;
          display.innerHTML =
            '<img src="' + coin.image + '" alt="" style="width:20px;height:20px;border-radius:50%;margin-right:8px">' +
            '<strong>' + coin.name + '</strong> <span style="color:var(--muted-foreground);margin-left:6px">' + coin.symbol.toUpperCase() + '</span>';
          display.style.display = 'flex';
          input.style.display = 'none';
          results.style.display = 'none';
          if (onSelect) onSelect(coin);
        }));
        results.style.display = 'block';
      });
    }

    function resetAddForm() {
      document.getElementById('addHoldingForm').reset();
      document.getElementById('coinSearch').style.display = '';
      document.getElementById('selectedCoinDisplay').style.display = 'none';
      document.getElementById('coinSearchResults').style.display = 'none';
      document.getElementById('coinId').value = '';
      document.getElementById('addFormError').style.display = 'none';
    }

    function resetWatchlistForm() {
      document.getElementById('wlCoinSearch').value = '';
      document.getElementById('wlCoinSearch').style.display = '';
      document.getElementById('wlSelectedCoinDisplay').style.display = 'none';
      document.getElementById('wlCoinSearchResults').style.display = 'none';
      document.getElementById('wlCoinId').value = '';
      document.getElementById('wlFormError').style.display = 'none';
    }

    wireSearchInput('coinSearch', 'coinSearchResults', 'selectedCoinDisplay',
      { coinId: 'coinId', symbol: 'coinSymbol', name: 'coinName', image: 'coinImage' });

    wireSearchInput('wlCoinSearch', 'wlCoinSearchResults', 'wlSelectedCoinDisplay',
      { coinId: 'wlCoinId', symbol: 'wlCoinSymbol', name: 'wlCoinName', image: 'wlCoinImage' });

    // ── Add Holding submit ─────────────────────────
    document.getElementById('addHoldingForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('addFormError');
      errEl.style.display = 'none';

      if (!document.getElementById('coinId').value) {
        errEl.textContent = 'Please select a coin from the search results.';
        errEl.style.display = 'block';
        return;
      }

      const form = e.target;
      const body = {
        coinId: document.getElementById('coinId').value,
        symbol: document.getElementById('coinSymbol').value,
        name: document.getElementById('coinName').value,
        image: document.getElementById('coinImage').value,
        quantity: form.quantity.value,
        purchasePrice: form.purchasePrice.value,
        purchaseDate: form.purchaseDate.value || undefined
      };

      try {
        const res = await fetch('/portfolio/holdings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add holding');
        closeAddModal();
        location.reload();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      }
    });

    // ── Edit Holding submit ────────────────────────
    document.getElementById('editHoldingForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('editFormError');
      errEl.style.display = 'none';
      const id = document.getElementById('editHoldingId').value;
      const body = {
        quantity: document.getElementById('editQuantity').value,
        purchasePrice: document.getElementById('editPurchasePrice').value,
        purchaseDate: document.getElementById('editPurchaseDate').value || undefined
      };
      try {
        const res = await fetch('/portfolio/holdings/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update holding');
        closeEditModal();
        location.reload();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      }
    });

    // ── Delete Holding ─────────────────────────────
    async function deleteHolding(id) {
      if (!confirm('Remove this holding from your portfolio?')) return;
      try {
        const res = await fetch('/portfolio/holdings/' + id, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        location.reload();
      } catch (err) {
        alert(err.message);
      }
    }

    // ── Watchlist add/remove ───────────────────────
    async function submitWatchlistAdd() {
      const errEl = document.getElementById('wlFormError');
      errEl.style.display = 'none';
      const coinId = document.getElementById('wlCoinId').value;
      if (!coinId) {
        errEl.textContent = 'Please select a coin.';
        errEl.style.display = 'block';
        return;
      }
      try {
        const res = await fetch('/portfolio/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coinId,
            symbol: document.getElementById('wlCoinSymbol').value,
            name: document.getElementById('wlCoinName').value,
            image: document.getElementById('wlCoinImage').value
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add to watchlist');
        closeWatchlistModal();
        location.reload();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      }
    }

    async function removeWatchlistCoin(coinId) {
      if (!confirm('Remove from watchlist?')) return;
      try {
        const res = await fetch('/portfolio/watchlist/' + coinId, { method: 'DELETE' });
        if (!res.ok) throw new Error('Remove failed');
        location.reload();
      } catch (err) {
        alert(err.message);
      }
    }

    // ── Coin search dropdown styles (injected once) ─
    const style = document.createElement('style');
    style.textContent = `
      .coin-search-dropdown {
        position:absolute; top:100%; left:0; right:0; z-index:200;
        background:var(--card); border:1px solid var(--border);
        border-radius:8px; max-height:240px; overflow-y:auto;
        box-shadow:0 8px 24px rgba(0,0,0,0.3);
      }
      .selected-coin-display {
        display:flex; align-items:center;
        padding:10px 14px; background:var(--muted);
        border-radius:8px; font-size:.9rem; cursor:pointer;
      }
    `;
    document.head.appendChild(style);

    // ── Charts (only when holdings exist) ──────────
    <% if (holdings.length > 0) { %>
    const holdingsData = <%- JSON.stringify(holdings) %>;

    // Allocation pie (Overview)
    new Chart(document.getElementById('allocationChart'), {
      type: 'doughnut',
      data: {
        labels: holdingsData.map(h => h.symbol),
        datasets: [{
          data: holdingsData.map(h => h.currentValue),
          backgroundColor: [
            '#f59e0b','#f97316','#ef4444','#8b5cf6',
            '#3b82f6','#10b981','#06b6d4','#ec4899'
          ].slice(0, holdingsData.length),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: 'var(--foreground)', padding: 12 } },
          tooltip: {
            callbacks: {
              label: ctx => ' $' + ctx.raw.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})
            }
          }
        }
      }
    });

    // Performance line (Overview) — simulated
    const performanceCtx = document.getElementById('performanceChart').getContext('2d');
    let performanceChart;

    function generateMockPerformanceData(days) {
      const labels = [], data = [];
      const totalInvested = <%= totalInvested %>;
      const totalValue = <%= totalValue %>;
      let value = totalInvested * (1 - (totalValue - totalInvested) / totalInvested * 0.3);
      const volatility = 0.03;
      for (let i = days; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', { month:'short', day:'numeric' }));
        value = value + (totalValue - value) * 0.1 + (Math.random() - 0.48) * value * volatility;
        data.push(Math.max(0, value));
      }
      data[data.length - 1] = totalValue;
      return { labels, data };
    }

    function updatePerformanceChart(period) {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const { labels, data } = generateMockPerformanceData(days);
      if (performanceChart) performanceChart.destroy();
      const gradient = performanceCtx.createLinearGradient(0, 0, 0, 280);
      gradient.addColorStop(0, 'rgba(245,158,11,0.3)');
      gradient.addColorStop(1, 'rgba(245,158,11,0)');
      performanceChart = new Chart(performanceCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            data,
            borderColor: '#f59e0b',
            backgroundColor: gradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: 'index' },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => '$' + ctx.raw.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})
              }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: 'var(--muted-foreground)' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'var(--muted-foreground)', callback: v => '$' + v.toLocaleString() } }
          }
        }
      });
    }

    updatePerformanceChart('7d');
    document.querySelectorAll('.time-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        updatePerformanceChart(this.dataset.period);
      });
    });

    // P/L bar chart (Analytics)
    new Chart(document.getElementById('plBarChart'), {
      type: 'bar',
      data: {
        labels: holdingsData.map(h => h.symbol),
        datasets: [{
          label: 'P/L %',
          data: holdingsData.map(h => parseFloat(h.profitLossPercent.toFixed(2))),
          backgroundColor: holdingsData.map(h => h.profitLossPercent >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'),
          borderColor: holdingsData.map(h => h.profitLossPercent >= 0 ? 'rgb(34,197,94)' : 'rgb(239,68,68)'),
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { callback: v => v + '%', color: 'var(--muted-foreground)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: 'var(--muted-foreground)' }, grid: { display: false } }
        }
      }
    });

    // Allocation donut (Analytics)
    new Chart(document.getElementById('analyticsDonut'), {
      type: 'doughnut',
      data: {
        labels: holdingsData.map(h => h.name),
        datasets: [{
          data: holdingsData.map(h => h.currentValue),
          backgroundColor: [
            '#f59e0b','#f97316','#ef4444','#8b5cf6',
            '#3b82f6','#10b981','#06b6d4','#ec4899'
          ].slice(0, holdingsData.length),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: 'var(--foreground)', padding: 10, boxWidth: 12 } }
        }
      }
    });
    <% } %>
  </script>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="/js/observer.js"></script>
</body>
</html>
```

- [ ] **Step 2: Add `.coin-search-dropdown` to the modal CSS already in portfolio.css**

In `public/css/portfolio.css`, find the existing `.modal-overlay` / `.modal-content` styles and verify the modal `z-index` is higher than the dropdown (`z-index:200` for dropdown, so modal should be `z-index:1000`+). No change needed if the existing values already satisfy this.

- [ ] **Step 3: Run the full test suite**

```bash
npm test
```

Expected: 39+ tests pass. The template renders server-side, so tests that do `GET /portfolio` and check for HTML content will pass as long as the EJS variables (`holdings`, `watchlist`, etc.) are present from Task 4.

- [ ] **Step 4: Commit**

```bash
git add views/portfolio/dashboard.ejs public/css/portfolio.css
git commit -m "feat: rebuild dashboard into 4-tab layout with coin search and watchlist inline"
```

---

## Task 7: Rewrite About Page

**Files:**
- Rewrite: `views/partials/about.ejs`
- Rewrite: `public/css/about.css`

**Interfaces:**
- Produces: about page that loads only `theme.css` + `about.css` + `other.css` — no Tailwind CDN, no Bootstrap, no external image services

- [ ] **Step 1: Rewrite about.css**

Replace the entire contents of `public/css/about.css`:

```css
/* about.css — uses theme.css tokens exclusively */

.about-hero {
  text-align: center;
  padding: 80px 24px 60px;
}
.about-hero h1 {
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 800;
  color: var(--foreground);
  margin-bottom: 16px;
  line-height: 1.15;
}
.about-hero h1 .accent { color: var(--primary); }
.about-hero p {
  font-size: 1.1rem;
  color: var(--muted-foreground);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.7;
}

.about-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px 64px;
}

.about-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 40px;
  margin-bottom: 24px;
}

.about-section-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--foreground);
  margin-bottom: 12px;
}
.about-section-sub {
  font-size: 1rem;
  color: var(--muted-foreground);
  line-height: 1.7;
  margin-bottom: 0;
}

/* Problem / Solution two-column */
.about-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}
@media (max-width: 700px) {
  .about-two-col { grid-template-columns: 1fr; }
}
.about-two-col .about-card { margin-bottom: 0; }
.about-col-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--primary);
  font-weight: 600;
  margin-bottom: 12px;
}

/* Features grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-top: 32px;
}
.feature-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 28px 24px;
  transition: border-color 0.2s, transform 0.2s;
}
.feature-card:hover {
  border-color: var(--primary);
  transform: translateY(-3px);
}
.feature-icon {
  width: 44px;
  height: 44px;
  color: var(--primary);
  margin-bottom: 16px;
}
.feature-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 8px;
}
.feature-card p {
  font-size: 0.875rem;
  color: var(--muted-foreground);
  line-height: 1.6;
  margin: 0;
}

/* Tech stack grid */
.tech-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 32px;
}
@media (max-width: 600px) {
  .tech-grid { grid-template-columns: 1fr; }
}
.tech-col h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--primary);
  font-weight: 600;
  margin-bottom: 16px;
}
.tech-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.tech-list li {
  font-size: 0.9rem;
  color: var(--muted-foreground);
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 8px;
}
.tech-list li:last-child { border-bottom: none; }
.tech-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
  flex-shrink: 0;
}

/* Creator card */
.creator-card {
  display: flex;
  align-items: center;
  gap: 32px;
}
@media (max-width: 600px) {
  .creator-card { flex-direction: column; text-align: center; }
}
.creator-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: var(--muted);
  border: 2px solid var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--primary);
  flex-shrink: 0;
}
.creator-name {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--foreground);
  margin-bottom: 4px;
}
.creator-role {
  font-size: 0.875rem;
  color: var(--primary);
  font-weight: 500;
  margin-bottom: 12px;
}
.creator-bio {
  font-size: 0.9rem;
  color: var(--muted-foreground);
  line-height: 1.7;
  margin-bottom: 16px;
}
.creator-links {
  display: flex;
  gap: 12px;
}
@media (max-width: 600px) {
  .creator-links { justify-content: center; }
}
.creator-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--muted-foreground);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  transition: border-color 0.2s, color 0.2s;
}
.creator-link:hover {
  border-color: var(--primary);
  color: var(--primary);
}
.creator-link svg { flex-shrink: 0; }
```

- [ ] **Step 2: Rewrite about.ejs**

Replace the entire contents of `views/partials/about.ejs`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About — CryptoPulse</title>
  <link rel="stylesheet" href="/css/theme.css">
  <link rel="stylesheet" href="/css/other.css">
  <link rel="stylesheet" href="/css/about.css">
</head>
<body>
  <%- include('header') %>

  <!-- Hero -->
  <section class="about-hero animate-in">
    <h1><span class="accent">Crypto</span>Pulse</h1>
    <p>Empowering investors with a real-time, comprehensive view of the cryptocurrency market to foster informed and confident decision-making.</p>
  </section>

  <div class="about-section">

    <!-- Problem / Solution -->
    <div class="about-two-col animate-in">
      <div class="about-card">
        <div class="about-col-label">The Challenge</div>
        <h2 class="about-section-title">The market is overwhelming</h2>
        <p class="about-section-sub">Crypto prices move fast, data is scattered across dozens of sources, and it's hard to see what actually matters. Most tools are either too complex or too shallow.</p>
      </div>
      <div class="about-card">
        <div class="about-col-label">Our Solution</div>
        <h2 class="about-section-title">One clean dashboard</h2>
        <p class="about-section-sub">CryptoPulse pulls live data from trusted sources into a single interface. Real-time prices, portfolio tracking, and clear charts — so you can focus on decisions, not data wrangling.</p>
      </div>
    </div>

    <!-- Features -->
    <div class="animate-in" style="transition-delay:0.05s">
      <h2 class="about-section-title">Key Features</h2>
      <p class="about-section-sub">A suite of tools built for the modern crypto investor.</p>
      <div class="features-grid">
        <div class="feature-card animate-in" style="transition-delay:0.05s">
          <svg class="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h3>Real-Time Market Data</h3>
          <p>Live prices for thousands of coins, updated every 60 seconds from CoinGecko.</p>
        </div>
        <div class="feature-card animate-in" style="transition-delay:0.1s">
          <svg class="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3>Portfolio Dashboard</h3>
          <p>Track all your holdings, total value, profit/loss, and allocation in one place.</p>
        </div>
        <div class="feature-card animate-in" style="transition-delay:0.15s">
          <svg class="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3>Analytics</h3>
          <p>Visualise P/L per coin, allocation breakdown, and your best and worst performers.</p>
        </div>
        <div class="feature-card animate-in" style="transition-delay:0.2s">
          <svg class="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <h3>Watchlist</h3>
          <p>Track coins you don't own yet. Monitor price and 24h change at a glance.</p>
        </div>
      </div>
    </div>

    <!-- Tech Stack -->
    <div class="about-card animate-in" style="transition-delay:0.05s;margin-top:48px">
      <h2 class="about-section-title">Technology Stack</h2>
      <p class="about-section-sub">Built with a modern, production-grade stack.</p>
      <div class="tech-grid">
        <div class="tech-col">
          <h3>Frontend</h3>
          <ul class="tech-list">
            <li><span class="tech-dot"></span>EJS templating</li>
            <li><span class="tech-dot"></span>Vanilla JS + CSS custom properties</li>
            <li><span class="tech-dot"></span>Chart.js</li>
            <li><span class="tech-dot"></span>Lottie animations</li>
          </ul>
        </div>
        <div class="tech-col">
          <h3>Backend</h3>
          <ul class="tech-list">
            <li><span class="tech-dot"></span>Node.js &amp; Express</li>
            <li><span class="tech-dot"></span>Supabase (PostgreSQL)</li>
            <li><span class="tech-dot"></span>bcryptjs + express-session</li>
            <li><span class="tech-dot"></span>Winston logging + Sentry</li>
          </ul>
        </div>
        <div class="tech-col">
          <h3>Infrastructure</h3>
          <ul class="tech-list">
            <li><span class="tech-dot"></span>Vercel (serverless)</li>
            <li><span class="tech-dot"></span>GitHub Actions CI/CD</li>
            <li><span class="tech-dot"></span>Jest + Supertest (39 tests)</li>
            <li><span class="tech-dot"></span>CoinGecko API</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Creator -->
    <div class="about-card animate-in" style="transition-delay:0.05s;margin-top:24px" id="contact">
      <div class="creator-card">
        <div class="creator-avatar">V</div>
        <div>
          <div class="creator-name">Vedant Wagh</div>
          <div class="creator-role">Full-Stack Developer · Music Production Enthusiast</div>
          <p class="creator-bio">Passionate developer fascinated by decentralised tech and financial markets. CryptoPulse is where web development meets the potential of cryptocurrency.</p>
          <div class="creator-links">
            <a href="https://github.com/Emp1500" class="creator-link" target="_blank" rel="noopener">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.338 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clip-rule="evenodd" />
              </svg>
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/vedantwagh15" class="creator-link" target="_blank" rel="noopener">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>

  </div><!-- /about-section -->

  <%- include('footer') %>
  <script src="/js/observer.js"></script>
</body>
</html>
```

- [ ] **Step 3: Run the test suite**

```bash
npm test
```

Expected: all tests still pass (about page has no server-side logic or tests).

- [ ] **Step 4: Commit**

```bash
git add views/partials/about.ejs public/css/about.css
git commit -m "feat: rewrite about page — remove Tailwind/Bootstrap, match dark amber design"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|-----------------|-----------|
| Lottie CDN swap | Task 1 |
| `req.session.save()` on login + register | Task 2 |
| Dashboard nav link (logged-in) | Task 3 |
| GET /portfolio returns watchlist data | Task 4 |
| Tab nav CSS | Task 5 |
| Overview tab: summary cards + charts + onboarding empty state | Task 6 |
| Holdings tab: table + coin search add modal + edit/delete | Task 6 |
| Analytics tab: P/L bar + allocation donut + best/worst | Task 6 |
| Watchlist tab: inline coin cards + add/remove | Task 6 |
| About page: remove Tailwind/Bootstrap, match dark amber design | Task 7 |
| Tests for login redirect and watchlist data in GET /portfolio | Tasks 2 & 4 |

**Placeholder scan:** No TBDs. All code blocks are complete.

**Type consistency:**
- `holdings[].profitLossPercent` — used in Task 4 route and Task 6 template — consistent ✓
- `watchlist[].coinId` — set in Task 4 route, referenced in Task 6 template `removeWatchlistCoin(coin.coinId)` — consistent ✓
- `fetchWatchlistData` helper — already exists in `routes/portfolio.js`, called in Task 4's updated route — consistent ✓
