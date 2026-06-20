# Full Frontend Polish Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate every page of CryptiPulse to a polished, consistent fintech aesthetic while fixing the broken watchlist prices on the dashboard.

**Architecture:** Token-first — update `theme.css` once, the cascade does the heavy lifting. Then layer page-specific improvements on top, each self-contained. No new routes, no new dependencies.

**Tech Stack:** Node.js / Express / EJS / vanilla CSS / vanilla JS / Bootstrap 5 / Chart.js / Jest + Supertest

## Global Constraints

- No new npm packages
- Keep Bootstrap 5.3.3 for grid/dropdown only — do not override Bootstrap internals globally
- All SVG icons from inline SVG (Heroicons/Lucide stroke style, 2px stroke width) — no emojis as icons
- Font: Inter (headings/body already loaded), JetBrains Mono (prices/numbers — add import)
- Animation timing: 150–300ms ease-out for micro-interactions; existing `animate-in` scroll system unchanged
- Test suite: `npm test` (Jest, 40 tests) must pass after every task that touches server files
- Color tokens: all values from the design spec — do not invent new hex values

---

## File Map

| File | Task | Change |
|------|------|--------|
| `public/css/theme.css` | 1 | Token updates + JetBrains Mono import + glass/glow variables |
| `views/partials/header.ejs` | 2 | Glassmorphism bar, active nav state, mobile hamburger HTML |
| `public/css/other.css` | 2 | Fixed header styles, active indicator, hamburger drawer |
| `routes/api.js` | 3 | Add `sparkline: true` to `/api/markets` params |
| `public/js/markets.js` | 3 | `renderSparkline()`, `arrowSVG()`, category filter logic, upgraded cards + rows |
| `views/partials/markets.ejs` | 3 | Category filter tab HTML |
| `public/css/markets.css` | 3 | Sparkline cell, filter tab pills, trending card upgrade, mono prices |
| `views/index.ejs` | 4 | SVG check/x icons, `data-target`/`data-suffix` on stat numbers |
| `public/css/styles.css` | 4 | Dual gradient hero, shimmer animation, testimonial hover, glass Why card |
| `app.js` | 5 | Watchlist price fetch logic in GET `/dashboard` |
| `views/dashboard.ejs` | 5 | Watchlist price/change rendering, mono font on stat values |
| `public/css/dashboard.css` | 5 | Stat card glow on hover, glass coin-pill inactive style |
| `views/auth/login.ejs` | 6 | Password toggle button, input wrapper |
| `views/auth/register.ejs` | 6 | Password toggle button, input wrapper |
| `public/css/auth.css` | 6 | Glass card, dual gradient bg, focus ring, pill submit button |
| `public/css/portfolio.css` | 7 | Tab underline indicator, mono numbers, glass borders |
| `views/partials/footer.ejs` | 7 | Token-driven border/text (remove hardcoded values) |

---

## Task 1: Design Tokens

**Files:**
- Modify: `public/css/theme.css`

**Interfaces:**
- Produces: CSS custom properties `--glass-bg`, `--glass-border`, `--shadow-glow` consumed by Tasks 2–7; updated `--radius`, `--accent`, `--border`, `--card`

- [ ] **Step 1: Update `theme.css`**

Replace the entire file content with:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --card: #1e1e1e;
  --ring: #f59e0b;
  --input: #2a2a2a;
  --muted: #1e1e1e;
  --accent: #8B5CF6;
  --border: #2a2a2a;
  --chart-1: #fbbf24;
  --chart-2: #d97706;
  --chart-3: #92400e;
  --chart-4: #b45309;
  --chart-5: #92400e;
  --popover: #1e1e1e;
  --primary: #f59e0b;
  --sidebar: #0f0f0f;
  --secondary: #1e1e1e;
  --background: #171717;
  --foreground: #e5e5e5;
  --destructive: #ef4444;
  --sidebar-ring: #f59e0b;
  --sidebar-accent: #8B5CF6;
  --sidebar-border: #2a2a2a;
  --card-foreground: #e5e5e5;
  --sidebar-primary: #f59e0b;
  --muted-foreground: #a3a3a3;
  --accent-foreground: #ffffff;
  --popover-foreground: #e5e5e5;
  --primary-foreground: #000000;
  --sidebar-foreground: #e5e5e5;
  --secondary-foreground: #e5e5e5;
  --destructive-foreground: #ffffff;
  --sidebar-accent-foreground: #ffffff;
  --sidebar-primary-foreground: #ffffff;
  --radius: 0.5rem;
  --font-sans: Inter, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --color-up: #22c55e;
  --color-down: #ef4444;

  /* Glass & glow system */
  --glass-bg: rgba(255, 255, 255, 0.04);
  --glass-border: rgba(255, 255, 255, 0.08);
  --shadow-glow: 0 0 20px rgba(245, 158, 11, 0.12);
}

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
  margin: 0;
  padding: 0;
  padding-top: 64px; /* offset for fixed header — Task 2 */
}

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

- [ ] **Step 2: Visual smoke test**

Run the dev server and open any page. Verify:
- Cards look slightly darker (were `#262626`, now `#1e1e1e`)
- No layout breaks
- Font loads (check DevTools Network tab for JetBrains Mono)

```bash
cd "/mnt/c/Users/KING_/Documents/WebDev Projects/Capstone 4/cryptipulse" && node app.js
```

Open `http://localhost:3000` and `http://localhost:3000/markets`.

- [ ] **Step 3: Commit**

```bash
git add public/css/theme.css
git commit -m "style: update design tokens — glass vars, mono font, tighter borders"
```

---

## Task 2: Header / Nav

**Files:**
- Modify: `views/partials/header.ejs`
- Modify: `public/css/other.css`

**Interfaces:**
- Consumes: `--glass-bg`, `--glass-border`, `--primary`, `--border` from Task 1
- Produces: Fixed glassmorphism nav bar used on all pages; active-state highlight; mobile hamburger drawer

- [ ] **Step 1: Read current nav styles**

Read `public/css/other.css` to find existing `.site-nav` block before editing.

- [ ] **Step 2: Replace `views/partials/header.ejs`**

```html
<header class="site-nav" id="siteNav">
  <a href="/" class="nav-logo">
    <img src="/images/cryptologo1.png" alt="CryptoPulse" class="nav-logo-img" />
    <span class="nav-logo-crypto">Crypto</span><span class="nav-logo-pulse">Pulse</span>
  </a>

  <ul class="nav-links" id="navLinks">
    <li><a href="/" class="nav-link">Home</a></li>
    <li><a href="/dashboard" class="nav-link">Dashboard</a></li>
    <li><a href="/markets" class="nav-link">Market</a></li>
    <% if (typeof user !== 'undefined' && user) { %>
      <li><a href="/portfolio" class="nav-link">Portfolio</a></li>
    <% } %>
    <li><a href="/about" class="nav-link">About</a></li>
  </ul>

  <div class="nav-auth">
    <% if (typeof user !== 'undefined' && user) { %>
      <div class="nav-user dropdown">
        <button class="nav-user-btn dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
          <span class="nav-avatar"><%= user.name.charAt(0).toUpperCase() %></span>
          <span class="nav-username"><%= user.name %></span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end nav-dropdown">
          <li><a class="dropdown-item" href="/portfolio">My Portfolio</a></li>
          <li><a class="dropdown-item" href="/portfolio/watchlist">Watchlist</a></li>
          <li><hr class="dropdown-divider nav-divider"></li>
          <li><a class="dropdown-item" href="/auth/logout">Logout</a></li>
        </ul>
      </div>
    <% } else { %>
      <a href="/auth/login" class="btn-nav-login">Login</a>
      <a href="/auth/register" class="btn-nav-signup">Sign Up</a>
    <% } %>
  </div>

  <button class="nav-hamburger" id="navHamburger" aria-label="Toggle navigation" aria-expanded="false">
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <line x1="3" y1="6" x2="19" y2="6"/>
      <line x1="3" y1="11" x2="19" y2="11"/>
      <line x1="3" y1="16" x2="19" y2="16"/>
    </svg>
  </button>
</header>

<script>
(function () {
  // Active nav state
  var path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === '/' ? path === '/' : path.startsWith(href)) {
      a.classList.add('nav-link--active');
    }
  });

  // Mobile hamburger
  var hamburger = document.getElementById('navHamburger');
  var navLinks = document.getElementById('navLinks');
  hamburger.addEventListener('click', function () {
    var open = navLinks.classList.toggle('nav-links--open');
    hamburger.setAttribute('aria-expanded', open);
  });
})();
</script>
```

- [ ] **Step 3: Update nav styles in `public/css/other.css`**

Find the `.site-nav` block and replace it (read the file first to locate exact lines). Add/replace these rules:

```css
/* ── Fixed Glassmorphism Nav ── */
.site-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  background: rgba(23, 23, 23, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--glass-border);
}

.nav-links {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 0.25rem;
}

.nav-link {
  padding: 0.4rem 0.75rem;
  color: var(--muted-foreground);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.nav-link:hover {
  color: var(--foreground);
}

.nav-link--active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

/* Auth buttons */
.btn-nav-login {
  padding: 0.4rem 1rem;
  color: var(--foreground);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: border-color 0.15s ease, color 0.15s ease;
  cursor: pointer;
}

.btn-nav-login:hover {
  border-color: var(--muted-foreground);
  color: var(--foreground);
}

.btn-nav-signup {
  padding: 0.4rem 1rem;
  color: var(--primary-foreground);
  background: var(--primary);
  border: none;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.15s ease;
  cursor: pointer;
}

.btn-nav-signup:hover {
  opacity: 0.88;
  color: var(--primary-foreground);
}

/* Hamburger */
.nav-hamburger {
  display: none;
  background: none;
  border: none;
  color: var(--foreground);
  cursor: pointer;
  padding: 0.25rem;
}

/* Mobile drawer */
@media (max-width: 767px) {
  .nav-hamburger { display: flex; }

  .nav-links {
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    background: rgba(23, 23, 23, 0.97);
    backdrop-filter: blur(12px);
    flex-direction: column;
    gap: 0;
    padding: 1rem 0;
    border-bottom: 1px solid var(--glass-border);
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
  }

  .nav-links--open {
    max-height: 400px;
  }

  .nav-links li { width: 100%; }

  .nav-link {
    display: block;
    padding: 0.75rem 2rem;
    border-bottom: none;
    border-left: 2px solid transparent;
  }

  .nav-link--active {
    border-left-color: var(--primary);
    border-bottom-color: transparent;
  }

  .nav-auth { display: none; }
}
```

- [ ] **Step 4: Verify visually**

Start the server. Open `http://localhost:3000` and verify:
- Nav is fixed and blurs content behind it when scrolling
- Current page link is amber with underline
- Resize to mobile width — hamburger appears, clicking opens the drawer

- [ ] **Step 5: Commit**

```bash
git add views/partials/header.ejs public/css/other.css
git commit -m "style: glassmorphism fixed nav, active state, mobile hamburger"
```

---

## Task 3: Markets Page

**Files:**
- Modify: `routes/api.js`
- Modify: `public/js/markets.js`
- Modify: `views/partials/markets.ejs`
- Modify: `public/css/markets.css`

**Interfaces:**
- Consumes: `/api/markets` JSON (now includes `sparkline_in_7d.price[]`)
- Produces: Category filter tabs, sparklines in trending cards, arrow badges in table

- [ ] **Step 1: Add sparkline param to `/api/markets` in `routes/api.js`**

Find the `router.get('/markets', ...)` block (around line 65). Change the params object from:

```js
params: {
  vs_currency: 'usd',
  order: 'market_cap_desc',
  per_page: 100,
  page: 1,
  sparkline: false
}
```

To:

```js
params: {
  vs_currency: 'usd',
  order: 'market_cap_desc',
  per_page: 100,
  page: 1,
  sparkline: true,
  price_change_percentage: '24h'
}
```

- [ ] **Step 2: Run tests to confirm no regression**

```bash
cd "/mnt/c/Users/KING_/Documents/WebDev Projects/Capstone 4/cryptipulse" && npm test
```

Expected: 40 passed, 0 failed.

- [ ] **Step 3: Replace `public/js/markets.js`**

```js
document.addEventListener('DOMContentLoaded', function () {
  var tableBody = document.getElementById('market-data-body');
  var loadingIndicator = document.getElementById('loading-indicator');
  var activeCategory = 'all';

  var CATEGORIES = {
    bitcoin: 'layer1', ethereum: 'layer1', solana: 'layer1', cardano: 'layer1',
    polkadot: 'layer1', avalanche: 'layer1', 'near-protocol': 'layer1',
    'cosmos': 'layer1', 'algorand': 'layer1', 'tron': 'layer1',
    uniswap: 'defi', aave: 'defi', chainlink: 'defi', 'pancakeswap-token': 'defi',
    'maker': 'defi', 'compound-governance-token': 'defi', 'curve-dao-token': 'defi',
    tether: 'stable', 'usd-coin': 'stable', dai: 'stable', 'binance-usd': 'stable',
    'true-usd': 'stable', 'frax': 'stable',
    dogecoin: 'meme', 'shiba-inu': 'meme', pepe: 'meme', 'floki': 'meme',
    'bonk': 'meme', 'dogwifcoin': 'meme'
  };

  function formatCurrency(num) {
    if (num === null || num === undefined) return 'N/A';
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatLargeNumber(num) {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1e12) return '$' + (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9)  return '$' + (num / 1e9).toFixed(2)  + 'B';
    if (num >= 1e6)  return '$' + (num / 1e6).toFixed(2)  + 'M';
    return '$' + num.toLocaleString('en-US');
  }

  function arrowSVG(up) {
    return up
      ? '<svg class="change-arrow" width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true"><path d="M5 1l4 6H1l4-6z"/></svg>'
      : '<svg class="change-arrow" width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true"><path d="M5 9L1 3h8L5 9z"/></svg>';
  }

  function renderSparkline(sparklineData) {
    var prices = sparklineData && sparklineData.price;
    if (!prices || prices.length < 2) {
      return '<span class="sparkline-na">—</span>';
    }
    var W = 80, H = 32;
    var min = Math.min.apply(null, prices);
    var max = Math.max.apply(null, prices);
    var range = max - min || 1;
    var step = W / (prices.length - 1);
    var pts = prices.map(function (p, i) {
      var x = (i * step).toFixed(1);
      var y = (H - ((p - min) / range) * H).toFixed(1);
      return x + ',' + y;
    }).join(' ');
    var isUp = prices[prices.length - 1] >= prices[0];
    var color = isUp ? '#22c55e' : '#ef4444';
    return '<svg class="sparkline-svg" width="' + W + '" height="' + H +
      '" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<polyline points="' + pts + '" fill="none" stroke="' + color +
      '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
  }

  function renderTrendingCards(coins) {
    var container = document.getElementById('trending-cards');
    if (!container) return;
    var top3 = coins.slice(0, 3);
    container.innerHTML = top3.map(function (coin, i) {
      var change = coin.price_change_percentage_24h || 0;
      var isUp = change >= 0;
      var badgeClass = isUp ? 'badge-up' : 'badge-down';
      var sign = isUp ? '+' : '';
      return '<div class="trending-card">' +
        '<img class="trending-logo" src="' + coin.image + '" alt="' + coin.name + '" width="40" height="40">' +
        '<div class="trending-info">' +
          '<span class="trending-badge">Trending #' + (i + 1) + '</span>' +
          '<div class="trending-name">' + coin.name + '</div>' +
          '<div class="trending-symbol">' + coin.symbol.toUpperCase() + '</div>' +
        '</div>' +
        '<div class="trending-right">' +
          '<span class="trending-price-value">' + formatCurrency(coin.current_price) + '</span>' +
          '<span class="' + badgeClass + '">' + arrowSVG(isUp) + sign + change.toFixed(2) + '%</span>' +
          renderSparkline(coin.sparkline_in_7d) +
        '</div>' +
        '</div>';
    }).join('');
  }

  function buildRow(coin, index) {
    var change = coin.price_change_percentage_24h || 0;
    var isUp = change >= 0;
    var badgeClass = isUp ? 'badge-up' : 'badge-down';
    var sign = isUp ? '+' : '';
    var cat = CATEGORIES[coin.id] || 'layer1';
    return '<tr data-category="' + cat + '">' +
      '<td class="td-rank">' + (index + 1) + '</td>' +
      '<td><div class="coin-info">' +
        '<img src="' + coin.image + '" alt="' + coin.name + '" width="28" height="28">' +
        '<div>' +
          '<div class="coin-name">' + coin.name + '</div>' +
          '<div class="coin-symbol">' + coin.symbol.toUpperCase() + '</div>' +
        '</div>' +
      '</div></td>' +
      '<td class="td-right td-mono">' + formatCurrency(coin.current_price) + '</td>' +
      '<td class="td-right"><span class="' + badgeClass + '">' + arrowSVG(isUp) + sign + change.toFixed(2) + '%</span></td>' +
      '<td class="td-right td-mono">' + formatLargeNumber(coin.market_cap) + '</td>' +
      '<td class="td-right td-mono">' + formatLargeNumber(coin.total_volume) + '</td>' +
    '</tr>';
  }

  function applyFilter() {
    document.querySelectorAll('#market-data-body tr').forEach(function (row) {
      var cat = row.dataset.category;
      var matchesCategory = activeCategory === 'all' || cat === activeCategory;
      var searchVal = document.getElementById('market-search').value.toLowerCase();
      var matchesSearch = !searchVal || row.textContent.toLowerCase().includes(searchVal);
      row.style.display = matchesCategory && matchesSearch ? '' : 'none';
    });
  }

  // Category filter tabs
  document.querySelectorAll('.cat-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.cat-tab').forEach(function (b) { b.classList.remove('cat-tab--active'); });
      btn.classList.add('cat-tab--active');
      activeCategory = btn.dataset.cat;
      applyFilter();
    });
  });

  // Search — replace old inline handler
  var searchInput = document.getElementById('market-search');
  if (searchInput) {
    searchInput.addEventListener('input', applyFilter);
  }

  async function fetchMarketData() {
    try {
      var response = await fetch('/api/markets');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      var data = await response.json();

      loadingIndicator.style.display = 'none';
      renderTrendingCards(data);

      tableBody.innerHTML = '';
      data.forEach(function (coin, index) {
        tableBody.insertAdjacentHTML('beforeend', buildRow(coin, index));
      });

      applyFilter();
    } catch (error) {
      console.error('Error fetching market data:', error);
      loadingIndicator.innerHTML =
        '<p style="color:var(--color-down)">Failed to load market data.</p>' +
        '<button onclick="location.reload()" style="margin-top:0.5rem;padding:0.5rem 1rem;background:var(--primary);color:var(--primary-foreground);border:none;border-radius:var(--radius);cursor:pointer;">Retry</button>';
    }
  }

  fetchMarketData();
});
```

- [ ] **Step 4: Add category filter tabs to `views/partials/markets.ejs`**

After the `<div class="markets-header">...</div>` closing tag (line 23) and before the `<div class="trending-cards"...>` line, insert:

```html
    <div class="cat-tabs animate-in" style="transition-delay:0.12s">
      <button class="cat-tab cat-tab--active" data-cat="all">All</button>
      <button class="cat-tab" data-cat="layer1">Layer 1</button>
      <button class="cat-tab" data-cat="defi">DeFi</button>
      <button class="cat-tab" data-cat="stable">Stablecoins</button>
      <button class="cat-tab" data-cat="meme">Meme</button>
    </div>
```

Also remove the old inline search event listener at the bottom of the file (the `<script>` block that calls `addEventListener('input', ...)`) — `markets.js` now handles it.

- [ ] **Step 5: Add styles to `public/css/markets.css`**

Append to the end of the file:

```css
/* ── Category filter tabs ── */
.cat-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.cat-tab {
  padding: 0.35rem 0.9rem;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  color: var(--muted-foreground);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.cat-tab:hover {
  color: var(--foreground);
  border-color: var(--border);
}

.cat-tab--active {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--primary-foreground);
}

/* ── Sparkline ── */
.sparkline-svg { display: block; }
.sparkline-na { color: var(--muted-foreground); font-size: 0.85rem; }

/* ── Trending card upgrade ── */
.trending-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
  margin-left: auto;
}

.trending-badge {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Mono prices in table ── */
.td-mono {
  font-family: var(--font-mono);
  font-size: 0.875rem;
}

/* ── Arrow icon in badges ── */
.change-arrow {
  display: inline-block;
  vertical-align: middle;
  margin-right: 2px;
}

/* ── Table row hover ── */
#market-data-body tr:hover {
  background: var(--glass-bg);
}
```

- [ ] **Step 6: Verify visually**

Start the server, open `http://localhost:3000/markets`. Verify:
- Trending cards show sparklines (green/red line)
- Arrow icons appear next to % change badges
- Category filter tabs appear and filter rows when clicked
- Search still works
- Prices in table are in mono font

- [ ] **Step 7: Run tests**

```bash
npm test
```

Expected: 40 passed, 0 failed.

- [ ] **Step 8: Commit**

```bash
git add routes/api.js public/js/markets.js views/partials/markets.ejs public/css/markets.css
git commit -m "feat: markets page — sparklines, category filters, arrow badges, mono prices"
```

---

## Task 4: Landing Page

**Files:**
- Modify: `views/index.ejs`
- Modify: `public/css/styles.css`

**Interfaces:**
- Consumes: `--glass-border`, `--shadow-glow` from Task 1; `observer.js` count-up (already has `.count-up`, `data-target`, `data-suffix` support)
- Produces: Polished hero, animated stat numbers, SVG icons throughout

- [ ] **Step 1: Read `views/index.ejs`**

Read the file to find: (a) stat number elements, (b) `✓` / `✗` text characters used as icons, (c) the CTA buttons in the hero.

- [ ] **Step 2: Update stat numbers in `views/index.ejs`**

Find every `<span class="stat-number">` element in the stats bar. Add `class="stat-number count-up"` and `data-target` + `data-suffix` attributes. Example pattern to follow:

If the current HTML is:
```html
<span class="stat-number">50K+</span>
<span class="stat-label">Active Users</span>
```

Change to:
```html
<span class="stat-number count-up" data-target="50000" data-suffix="+">0</span>
<span class="stat-label">Active Users</span>
```

Apply this pattern to every stat-number in the stats section. Set `data-target` to the numeric value and `data-suffix` to the trailing symbol (e.g., `+`, `%`, `B`).

- [ ] **Step 3: Replace `✓` text icons with SVG in `views/index.ejs`**

Search for any plain `✓` or `✗` text used as icons (in bullet lists, Why Us section). Replace each with:

Check (green):
```html
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="2.5 8 6.5 12 13.5 4"/></svg>
```

X (red):
```html
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
```

- [ ] **Step 4: Update `public/css/styles.css`**

**4a. Dual gradient hero** — find `.hero-section` and replace the `background-image` line:

```css
background-image:
  radial-gradient(ellipse 50% 60% at 80% 20%, rgba(245, 158, 11, 0.12), transparent),
  radial-gradient(ellipse 40% 50% at 20% 80%, rgba(139, 92, 246, 0.08), transparent);
```

**4b. Shimmer animation on Sign Up CTA** — add after the `.btn-primary-filled:hover` block:

```css
@keyframes shimmer-once {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.btn-primary-filled {
  background-image: linear-gradient(
    105deg,
    var(--primary) 40%,
    rgba(255, 255, 255, 0.25) 50%,
    var(--primary) 60%
  );
  background-size: 200% auto;
  animation: shimmer-once 0.8s ease 0.4s 1;
}
```

**4c. Pill radius on CTA buttons** — update `.btn-primary-filled` and `.btn-primary-outline`:

```css
.btn-primary-filled  { border-radius: 999px; }
.btn-primary-outline { border-radius: 999px; }
```

**4d. Testimonial card hover lift** — find `.testimonial-card:hover` or `.testimonial-card` and add/update:

```css
.testimonial-card:hover {
  border-color: var(--glass-border);
  box-shadow: var(--shadow-glow);
  transform: translateY(-2px);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
```

**4e. Why Us competitor card** — find the rule for `.why-card` (not `.why-us`) and update:

```css
.why-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 2rem;
}
```

- [ ] **Step 5: Verify visually**

Open `http://localhost:3000`. Verify:
- Hero has dual-toned gradient glow (amber top-right, subtle purple bottom-left)
- Sign Up button has a brief shimmer on load
- Stat numbers count up from 0 when the section scrolls into view
- SVG check icons appear where `✓` was

- [ ] **Step 6: Commit**

```bash
git add views/index.ejs public/css/styles.css
git commit -m "style: landing page — dual gradient hero, count-up stats, SVG icons, pill CTAs"
```

---

## Task 5: Dashboard — Watchlist Prices + Chart Polish

**Files:**
- Modify: `app.js`
- Modify: `views/dashboard.ejs`
- Modify: `public/css/dashboard.css`

**Interfaces:**
- Consumes: Supabase watchlist rows with `coin_id`, `name`, `symbol`, `image`; CoinGecko `/simple/price`
- Produces: `watchlist` array with `current_price` and `price_change_percentage_24h` populated server-side

- [ ] **Step 1: Update the `/dashboard` route in `app.js`**

Find the `app.get('/dashboard', async (req, res) => {` block. Replace the watchlist fetch section (everything from `let watchlist = [];` to `res.render('dashboard', { coins, watchlist });`) with:

```js
    let watchlist = [];
    if (req.session.user) {
      const { data } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', req.session.user.id)
        .order('added_at', { ascending: true });
      watchlist = data || [];

      if (watchlist.length > 0) {
        // Build price map from already-fetched top 10 coins
        const topPrices = {};
        coins.forEach(c => {
          topPrices[c.id] = {
            current_price: c.current_price,
            price_change_percentage_24h: c.price_change_percentage_24h
          };
        });

        // Fetch prices for watchlist coins not in top 10
        const missing = watchlist
          .filter(w => !topPrices[w.coin_id])
          .map(w => w.coin_id);

        let extraPrices = {};
        if (missing.length > 0) {
          try {
            const priceRes = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
              params: {
                ids: missing.join(','),
                vs_currencies: 'usd',
                include_24hr_change: true
              }
            });
            Object.entries(priceRes.data).forEach(([id, val]) => {
              extraPrices[id] = {
                current_price: val.usd,
                price_change_percentage_24h: val.usd_24h_change
              };
            });
          } catch (e) {
            logger.warn('Watchlist supplemental price fetch failed: ' + e.message);
          }
        }

        // Merge prices into watchlist rows
        watchlist = watchlist.map(w => {
          const p = topPrices[w.coin_id] || extraPrices[w.coin_id] || {};
          return Object.assign({}, w, {
            current_price: p.current_price != null ? p.current_price : null,
            price_change_percentage_24h: p.price_change_percentage_24h != null ? p.price_change_percentage_24h : null
          });
        });
      }
    }

    res.render('dashboard', { coins, watchlist });
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: 40 passed, 0 failed.

- [ ] **Step 3: Update watchlist rendering in `views/dashboard.ejs`**

Find lines 163–164 (the `--` placeholders):
```ejs
                <span class="cl-price">--</span>
                <span class="cl-change">--</span>
```

Replace with:
```ejs
                <span class="cl-price" style="font-family:var(--font-mono)"><%=
                  coin.current_price != null
                    ? '$' + (coin.current_price >= 1
                        ? coin.current_price.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})
                        : coin.current_price.toFixed(4))
                    : '--'
                %></span>
                <span class="cl-change <%= coin.price_change_percentage_24h != null ? (coin.price_change_percentage_24h >= 0 ? 'change-up' : 'change-down') : '' %>"><%=
                  coin.price_change_percentage_24h != null
                    ? (coin.price_change_percentage_24h >= 0 ? '+' : '') + coin.price_change_percentage_24h.toFixed(2) + '%'
                    : '--'
                %></span>
```

- [ ] **Step 4: Add mono font to stat card values and chart tooltip in `views/dashboard.ejs`**

Find the four `stat-card-value` `<div>` elements (ids: `statMarketCap`, `statBtcDominance`, `statVolume`, `statActiveCoins`) and add `style="font-family:var(--font-mono)"` to each.

Also find the `tooltip:` block inside the `Chart` config and add `bodyFont` to it:

```js
tooltip: {
  backgroundColor: 'rgba(20,20,20,0.95)',
  titleColor: '#a3a3a3',
  bodyColor: '#e5e5e5',
  borderColor: '#f59e0b',
  borderWidth: 1,
  padding: 12,
  displayColors: false,
  bodyFont: { family: "'JetBrains Mono', monospace", size: 13 },
  callbacks: {
    label: ctx => fmtPrice(ctx.raw)
  }
},
```

- [ ] **Step 5: Update coin-pill and stat card styles in `public/css/dashboard.css`**

Read the file first, then find the `.coin-pill` rule (inactive state) and update it, and add a stat card glow. Add/update:

```css
/* Inactive coin pill — glass style */
.coin-pill {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  color: var(--muted-foreground);
  /* keep all other existing properties */
}

.coin-pill:hover {
  border-color: var(--border);
  color: var(--foreground);
}

/* Stat card glow on hover */
.stat-card:hover {
  box-shadow: var(--shadow-glow);
  border-color: rgba(245, 158, 11, 0.3);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
```

- [ ] **Step 6: Verify visually**

Log in, open `http://localhost:3000/dashboard`. Verify:
- Watchlist panel shows real prices (not `--`) for your watchlist coins
- 24h % is green or red accordingly
- Stat values are in mono font
- Inactive coin pills have the subtle glass border style

- [ ] **Step 7: Run tests again**

```bash
npm test
```

Expected: 40 passed, 0 failed.

- [ ] **Step 8: Commit**

```bash
git add app.js views/dashboard.ejs public/css/dashboard.css
git commit -m "fix: populate watchlist prices server-side; style dashboard stat cards and pills"
```

---

## Task 6: Auth Pages

**Files:**
- Modify: `views/auth/login.ejs`
- Modify: `views/auth/register.ejs`
- Modify: `public/css/auth.css`

**Interfaces:**
- Consumes: `--glass-bg`, `--glass-border`, `--shadow-glow`, `--primary` from Task 1
- Produces: Glass card auth forms, password toggle, consistent gradient background

- [ ] **Step 1: Read `public/css/auth.css` and `views/auth/login.ejs`**

Read both files to understand current structure before editing.

- [ ] **Step 2: Update `public/css/auth.css`**

Add/replace these sections (read current file, then merge — preserve any rules not listed here):

```css
/* ── Auth page background ── */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background-image:
    radial-gradient(ellipse 50% 60% at 80% 20%, rgba(245, 158, 11, 0.1), transparent),
    radial-gradient(ellipse 40% 50% at 20% 80%, rgba(139, 92, 246, 0.07), transparent);
}

/* ── Glass card ── */
.auth-card {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: calc(var(--radius) * 2);
  box-shadow: var(--shadow-glow);
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
}

/* ── Input wrapper (for password toggle) ── */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper .form-input {
  width: 100%;
  padding-right: 2.75rem;
}

/* ── Input fields ── */
.form-input {
  width: 100%;
  min-height: 44px;
  padding: 0.6rem 0.9rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  color: var(--foreground);
  font-family: var(--font-sans);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
}

.form-input::placeholder {
  color: var(--muted-foreground);
}

/* ── Password toggle button ── */
.pw-toggle {
  position: absolute;
  right: 0.65rem;
  background: none;
  border: none;
  color: var(--muted-foreground);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0.25rem;
  transition: color 0.15s ease;
}

.pw-toggle:hover { color: var(--foreground); }

/* ── Submit button ── */
.btn-auth-submit {
  width: 100%;
  min-height: 44px;
  background: var(--primary);
  color: var(--primary-foreground);
  border: none;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn-auth-submit:hover { opacity: 0.88; }
```

- [ ] **Step 3: Update password field in `views/auth/login.ejs`**

Find the password `<input>` element. Wrap it in an `.input-wrapper` div and add the toggle button immediately after the input (inside the wrapper):

```html
<div class="input-wrapper">
  <input type="password" id="password" name="password" class="form-input"
    required autocomplete="current-password" placeholder="••••••••">
  <button type="button" class="pw-toggle" aria-label="Show password"
    onclick="(function(btn){
      var inp = btn.parentElement.querySelector('input');
      var show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      btn.querySelector('.eye-show').style.display = show ? 'none' : '';
      btn.querySelector('.eye-hide').style.display = show ? '' : 'none';
    })(this)">
    <svg class="eye-show" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
    <svg class="eye-hide" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  </button>
</div>
```

- [ ] **Step 4: Apply same password toggle to `views/auth/register.ejs`**

Read `register.ejs`. Apply the identical `.input-wrapper` + toggle button pattern to the password field(s) in that form.

- [ ] **Step 5: Verify visually**

Open `http://localhost:3000/auth/login`. Verify:
- Page has subtle dual-tone gradient glow in background
- Card appears frosted/glass against the background
- Input fields have a subtle glass border; amber glow ring on focus
- Eye icon appears inside the password field; clicking it toggles visibility
- Submit button is a full-width amber pill

- [ ] **Step 6: Commit**

```bash
git add views/auth/login.ejs views/auth/register.ejs public/css/auth.css
git commit -m "style: auth pages — glass card, gradient bg, focus rings, password toggle"
```

---

## Task 7: Portfolio & About — Consistency Pass

**Files:**
- Modify: `public/css/portfolio.css`
- Modify: `views/partials/footer.ejs`

**Interfaces:**
- Consumes: `--glass-border`, `--primary`, `--font-mono` from Task 1 (cascade handles most of it)
- Produces: Consistent tab underline style, mono numbers, footer using tokens

- [ ] **Step 1: Read `public/css/portfolio.css`**

Read the file to find `.tab-btn`, `.tab-btn.active`, and any hardcoded `#404040` values.

- [ ] **Step 2: Update tab indicator in `public/css/portfolio.css`**

Find `.tab-btn` and `.tab-btn.active` rules. Update the active indicator to match the header nav style:

```css
.tab-btn {
  /* keep existing padding, font, background */
  border-bottom: 2px solid transparent;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  background: transparent; /* remove any filled background if present */
}
```

- [ ] **Step 3: Apply mono font to monetary values in `public/css/portfolio.css`**

Add this rule to the portfolio CSS:

```css
.holding-value,
.holding-price,
.holding-change,
.portfolio-total,
.pnl-value,
.wl-price,
.wl-change {
  font-family: var(--font-mono);
}
```

(Read the file first to confirm these class names exist — adjust if different.)

- [ ] **Step 4: Replace hardcoded border colors in `public/css/portfolio.css`**

Run:
```bash
grep -n "#404040\|#262626" "/mnt/c/Users/KING_/Documents/WebDev Projects/Capstone 4/cryptipulse/public/css/portfolio.css"
```

For each hit that is a `border` property, replace `#404040` with `var(--glass-border)` and `#262626` with `var(--card)`.

- [ ] **Step 5: Read and update `views/partials/footer.ejs`**

Read the file. If the top border or text colors are hardcoded hex values, replace with:
- Border: `var(--border)`
- Muted text: `var(--muted-foreground)`
- Footer background: `var(--muted)` or `var(--background)`

- [ ] **Step 6: Run tests**

```bash
npm test
```

Expected: 40 passed, 0 failed.

- [ ] **Step 7: Verify portfolio page visually**

Log in, open `http://localhost:3000/portfolio`. Verify:
- Active tab has amber underline (not a filled box)
- Monetary values in holdings table are in mono font
- Card borders are subtler (glass border vs the old `#404040`)

- [ ] **Step 8: Commit**

```bash
git add public/css/portfolio.css views/partials/footer.ejs
git commit -m "style: portfolio tab underline, mono numbers, token-driven borders and footer"
```

---

## Final Verification

- [ ] Run `npm test` — confirm 40/40 pass
- [ ] Open every route in browser: `/`, `/dashboard`, `/markets`, `/portfolio`, `/about`, `/auth/login`, `/auth/register`
- [ ] Confirm JetBrains Mono loads (DevTools Network tab — look for the Google Fonts request)
- [ ] Confirm active nav state highlights the correct link on each page
- [ ] Confirm mobile hamburger works at 375px width
- [ ] Confirm watchlist on `/dashboard` shows real prices (must be logged in with coins in watchlist)
