# CryptiPulse Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild CryptiPulse's frontend with a unified dark amber design system, restructured home page, full Markets page redesign, and scroll-triggered blur+fade animations across all pages.

**Architecture:** A new `public/css/theme.css` holds all CSS variables (dark-only, all tokens in `:root`). A new `public/js/observer.js` drives all scroll animations via IntersectionObserver. Each page's existing CSS file is updated to use variables. EJS views are rebuilt section by section, all sharing the theme foundation from Task 1.

**Tech Stack:** EJS templates, plain CSS custom properties, vanilla JavaScript (IntersectionObserver API), Bootstrap 5 CDN (nav dropdown JS only), Google Fonts Inter, Lottie Player CDN (`@lottiefiles/lottie-player`), Lucide SVG icons (inlined as `<svg>` strings)

## Global Constraints

- Dark mode only — all token values in `:root` directly, no `.dark` class, no toggle
- `@theme inline` block NOT included — plain CSS stack, not Tailwind
- `public/css/theme.css` must be the **first** `<link>` stylesheet in every page `<head>`
- `public/js/observer.js` must be loaded **after all other scripts** in every page `<body>`
- Inter font: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap`
- Lottie Player: `https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js`
- Animation classes: `.animate-in` (initial hidden state) → `.animate-in.visible` (shown)
- Count-up attributes: `class="count-up"` + `data-target="<number>"` + `data-suffix="<string>"`
- All git commits without Co-Authored-By tag
- Dev server: `npm run dev` (runs from repo root)
- Base path: `/mnt/c/Users/KING_/Documents/WebDev Projects/Capstone 4/cryptipulse`

---

### Task 1: Design System Foundation

**Files:**
- Create: `public/css/theme.css`
- Create: `public/js/observer.js`
- Modify: `public/css/about.css`
- Modify: `public/css/chart.css`

**Interfaces:**
- Produces: all CSS custom properties used by every subsequent task; `.animate-in` / `.visible` class contract; `data-target` / `data-suffix` attributes for count-up elements

- [ ] **Step 1: Create `public/css/theme.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

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
  --font-sans: Inter, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --color-up: #22c55e;
  --color-down: #ef4444;
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

- [ ] **Step 2: Create `public/js/observer.js`**

```javascript
(function () {
  var animObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          animObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.animate-in').forEach(function (el) {
    animObserver.observe(el);
  });

  var countObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          countUp(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll('.count-up').forEach(function (el) {
    countObserver.observe(el);
  });

  function countUp(el) {
    var target = parseInt(el.dataset.target, 10);
    var suffix = el.dataset.suffix || '';
    var duration = 1500;
    var start = performance.now();
    function update(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }
})();
```

- [ ] **Step 3: Update `public/css/about.css` — replace hardcoded colors with variables**

Replace the entire file with:

```css
body {
  background-color: var(--background);
  font-family: var(--font-sans);
  color: var(--foreground);
}

h1, h2, h3 {
  color: var(--foreground);
}

p {
  font-size: 18px;
  color: var(--muted-foreground);
}

.highlight-orange {
  color: var(--primary);
}

.custom-card {
  background-color: var(--card);
  border-radius: 20px;
  padding: 2rem;
  color: var(--card-foreground);
  border: 1px solid var(--border);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
}

.custom-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.section-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--foreground);
  margin-bottom: 0.5rem;
}

.section-subtitle {
  font-size: 1.125rem;
  color: var(--muted-foreground);
  max-width: 42rem;
  margin-left: auto;
  margin-right: auto;
}

.solCard {
  margin-left: 30%;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.bull {
  margin-top: 50px;
}
```

- [ ] **Step 4: Update `public/css/chart.css` — replace hardcoded colors with variables**

Make these replacements throughout `chart.css`:
- `#1e2a3a` → `var(--card)`
- `#30363d` → `var(--border)`
- `#ffffff` → `var(--foreground)`
- `#8b949e` → `var(--muted-foreground)`
- `#6e7681` → `var(--muted-foreground)`
- `#fd7e14` → `var(--primary)`
- `#e55a00` → `#d97706`
- `#2ecc71` → `var(--color-up)`
- `rgba(46, 204, 113, 0.15)` → `rgba(34, 197, 94, 0.15)`
- `#e74c3c` → `var(--color-down)`
- `rgba(231, 76, 60, 0.15)` → `rgba(239, 68, 68, 0.15)`
- `rgba(13, 27, 42, 0.5)` → `rgba(23, 23, 23, 0.5)`
- `rgba(253, 126, 20, 0.1)` → `rgba(245, 158, 11, 0.1)`

Also update the `.time-btn.active` gradient:
```css
.time-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--primary-foreground);
}
```

- [ ] **Step 5: Verify files exist**

```bash
ls "public/css/theme.css" "public/js/observer.js"
```

Expected: both listed without error.

- [ ] **Step 6: Commit**

```bash
git add public/css/theme.css public/js/observer.js public/css/about.css public/css/chart.css
git commit -m "feat: add design system tokens, animation observer, update about/chart css"
```

---

### Task 2: Navbar Rebuild

**Files:**
- Modify: `views/partials/header.ejs` (full rebuild)
- Modify: `public/css/other.css` (full replace)

**Interfaces:**
- Consumes: `var(--sidebar)`, `var(--primary)`, `var(--primary-foreground)`, `var(--foreground)`, `var(--muted-foreground)`, `var(--border)`, `var(--popover)`, `var(--radius)` from Task 1
- Produces: `.site-nav`, `.nav-logo`, `.nav-logo-crypto`, `.nav-logo-pulse`, `.nav-links`, `.nav-link`, `.btn-login`, `.btn-signup`, `.site-footer`, `.footer-inner`, `.footer-brand`, `.footer-links-grid`, `.footer-section` CSS classes used by Task 3

- [ ] **Step 1: Rebuild `views/partials/header.ejs`**

Replace entire file with:

```html
<header class="site-nav">
  <a href="/" class="nav-logo">
    <img src="/images/cryptologo1.png" alt="CryptoPulse" class="nav-logo-img" />
    <span class="nav-logo-crypto">Crypto</span><span class="nav-logo-pulse">Pulse</span>
  </a>

  <ul class="nav-links">
    <li><a href="/" class="nav-link">Home</a></li>
    <% if (typeof user !== 'undefined' && user) { %>
      <li><a href="/portfolio" class="nav-link">Dashboard</a></li>
    <% } %>
    <li><a href="/markets" class="nav-link">Market</a></li>
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
      <a href="/auth/login" class="btn-login">Login</a>
      <a href="/auth/register" class="btn-signup">Sign Up</a>
    <% } %>
  </div>
</header>
```

- [ ] **Step 2: Replace `public/css/other.css` with navbar + footer styles**

Replace entire file with:

```css
/* ── Navbar ── */
.site-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  height: 64px;
  background: var(--sidebar);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.nav-logo-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.nav-logo-crypto {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: 1px;
}

.nav-logo-pulse {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--muted-foreground);
  letter-spacing: 1px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-link {
  color: var(--foreground);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius);
  transition: color 0.2s ease;
  position: relative;
}

.nav-link:hover {
  color: var(--primary);
}

.nav-link.active {
  color: var(--primary);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0.75rem;
  right: 0.75rem;
  height: 2px;
  background: var(--primary);
  border-radius: 1px;
}

.nav-auth {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-login {
  padding: 0.4rem 1rem;
  border: 1px solid var(--primary);
  border-radius: var(--radius);
  color: var(--primary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.2s ease;
}

.btn-login:hover {
  background: rgba(245, 158, 11, 0.1);
  color: var(--primary);
}

.btn-signup {
  padding: 0.4rem 1rem;
  background: var(--primary);
  border: 1px solid var(--primary);
  border-radius: var(--radius);
  color: var(--primary-foreground);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.btn-signup:hover {
  background: #d97706;
  border-color: #d97706;
}

.nav-user-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 999px;
  cursor: pointer;
  color: var(--foreground);
  font-family: var(--font-sans);
}

.nav-avatar {
  width: 28px;
  height: 28px;
  background: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--primary-foreground);
}

.nav-username {
  color: var(--foreground);
  font-size: 0.9rem;
  font-weight: 500;
}

.nav-dropdown {
  background: var(--popover) !important;
  border: 1px solid var(--border) !important;
}

.nav-dropdown .dropdown-item {
  color: var(--popover-foreground) !important;
  font-size: 0.9rem;
}

.nav-dropdown .dropdown-item:hover {
  background: rgba(245, 158, 11, 0.1) !important;
  color: var(--primary) !important;
}

.nav-divider {
  border-color: var(--border) !important;
}

/* ── Footer ── */
.site-footer {
  border-top: 1px solid var(--border);
  background: var(--background);
  padding: 3rem 2rem;
  position: relative;
}

.site-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 33%;
  height: 1px;
  background: var(--foreground);
  opacity: 0.2;
  filter: blur(4px);
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.footer-logo-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.footer-copy {
  color: var(--muted-foreground);
  font-size: 0.85rem;
  margin: 0;
}

.footer-links-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
}

.footer-section h3 {
  color: var(--foreground);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem 0;
}

.footer-section ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.footer-section a {
  color: var(--muted-foreground);
  text-decoration: none;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: color 0.3s ease;
}

.footer-section a:hover {
  color: var(--foreground);
}

.footer-section svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .site-nav {
    padding: 0 1rem;
  }

  .nav-links {
    display: none;
  }

  .footer-inner {
    grid-template-columns: 1fr;
  }

  .footer-links-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

- [ ] **Step 3: Start dev server and verify navbar**

```bash
npm run dev
```

Open `http://localhost:3000`. Verify:
- Logo image + "Crypto" (amber) + "Pulse" (gray) on far left
- Home / Market / About nav links in the middle
- Login (outlined amber) and Sign Up (filled amber) on far right
- Navbar sticks to top on scroll
- No large gap above/below the navbar (old 100px padding bug gone)

- [ ] **Step 4: Commit**

```bash
git add views/partials/header.ejs public/css/other.css
git commit -m "feat: rebuild navbar with sticky amber dark theme"
```

---

### Task 3: Footer Rebuild

**Files:**
- Modify: `views/partials/footer.ejs` (full rebuild)

**Interfaces:**
- Consumes: `.site-footer`, `.footer-inner`, `.footer-brand`, `.footer-logo`, `.footer-logo-img`, `.footer-copy`, `.footer-links-grid`, `.footer-section`, `.nav-logo-crypto`, `.nav-logo-pulse`, `.animate-in` from Task 2
- Produces: `footer.ejs` partial used on all pages

- [ ] **Step 1: Rebuild `views/partials/footer.ejs`**

Replace entire file with:

```html
<footer class="site-footer">
  <div class="footer-inner">

    <div class="footer-brand animate-in">
      <a href="/" class="footer-logo">
        <img src="/images/cryptologo1.png" alt="CryptoPulse" class="footer-logo-img" />
        <span class="nav-logo-crypto">Crypto</span><span class="nav-logo-pulse">Pulse</span>
      </a>
      <p class="footer-copy">© <%= new Date().getFullYear() %> CryptoPulse. All rights reserved.</p>
    </div>

    <div class="footer-links-grid">
      <div class="footer-section animate-in" style="transition-delay: 0.1s">
        <h3>Product</h3>
        <ul>
          <li><a href="#features">Features</a></li>
          <li><a href="/markets">Markets</a></li>
          <li><a href="/portfolio">Portfolio</a></li>
          <li><a href="/graphs">Graphs</a></li>
        </ul>
      </div>

      <div class="footer-section animate-in" style="transition-delay: 0.2s">
        <h3>Company</h3>
        <ul>
          <li><a href="/about">About Us</a></li>
          <li><a href="#">Privacy Policy</a></li>
          <li><a href="#">Terms of Service</a></li>
        </ul>
      </div>

      <div class="footer-section animate-in" style="transition-delay: 0.3s">
        <h3>Resources</h3>
        <ul>
          <li><a href="#">Help</a></li>
          <li><a href="#">Changelog</a></li>
        </ul>
      </div>

      <div class="footer-section animate-in" style="transition-delay: 0.4s">
        <h3>Social Links</h3>
        <ul>
          <li>
            <a href="#">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              Facebook
            </a>
          </li>
          <li>
            <a href="#">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              Instagram
            </a>
          </li>
          <li>
            <a href="#">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><polygon points="10 15 15 12 10 9"/></svg>
              Youtube
            </a>
          </li>
          <li>
            <a href="#">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
              LinkedIn
            </a>
          </li>
        </ul>
      </div>
    </div>

  </div>
</footer>
```

- [ ] **Step 2: Verify footer renders on home page**

With `npm run dev` running, open `http://localhost:3000` and scroll to the bottom. Verify:
- 2-column grid: brand + copyright on left, 4 link columns on right
- "CryptoPulse" logo text in amber/gray
- Product / Company / Resources / Social Links columns
- SVG icons before social link text
- Columns fade in with blur+fade as they scroll into view

- [ ] **Step 3: Commit**

```bash
git add views/partials/footer.ejs
git commit -m "feat: rebuild footer with 4-column animated layout and social icons"
```

---

### Task 4: Home Page Rebuild

**Files:**
- Modify: `views/index.ejs` (full rebuild)
- Modify: `public/css/styles.css` (full rebuild)

**Interfaces:**
- Consumes: all CSS variables from Task 1; `.animate-in`, `.count-up` from Task 1; header/footer partials from Tasks 2 & 3; `.btn-login`, `.btn-signup` from Task 2
- Produces: home page at `/`; CSS classes `.hero-section`, `.stats-section`, `.features-section`, `.testimonials-section`, `.why-section`, `.btn-primary-filled`, `.btn-primary-outline`

- [ ] **Step 1: Replace `views/index.ejs` with rebuilt home page**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CryptoPulse — Real-time Crypto Data</title>
  <link rel="stylesheet" href="/css/theme.css">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="stylesheet" href="/css/other.css">
  <script>setTimeout(function(){ location.reload(); }, 60000);</script>
</head>
<body>

<%- include('partials/header') %>

<!-- Hero -->
<section class="hero-section">
  <div class="hero-inner">
    <div class="hero-text">
      <h1 class="hero-heading">
        <span class="hero-crypto animate-hero">Crypto</span><span class="hero-pulse animate-hero" style="transition-delay: 0.15s">Pulse</span>
      </h1>
      <p class="hero-sub animate-in" style="transition-delay: 0.3s">
        Real-time data on 20,000+ cryptocurrencies.<br>
        For Traders, Developers &amp; Enterprises.
      </p>
      <div class="hero-actions animate-in" style="transition-delay: 0.45s">
        <a href="#stats" class="btn-primary-filled">Get Started →</a>
        <a href="/markets" class="btn-primary-outline">View Markets</a>
      </div>
    </div>
    <div class="hero-lottie">
      <lottie-player
        src="/animations/blockchain.json"
        background="transparent"
        speed="1"
        style="width:500px;height:500px;"
        loop autoplay>
      </lottie-player>
    </div>
  </div>
</section>

<!-- Stats -->
<section class="stats-section" id="stats">
  <div class="stats-inner">
    <div class="stat-card animate-in" style="transition-delay:0s">
      <span class="stat-number count-up" data-target="10" data-suffix="B+">0</span>
      <span class="stat-label">API Calls / Month</span>
    </div>
    <div class="stat-card animate-in" style="transition-delay:0.1s">
      <span class="stat-number count-up" data-target="70" data-suffix="+">0</span>
      <span class="stat-label">Endpoints</span>
    </div>
    <div class="stat-card animate-in" style="transition-delay:0.2s">
      <span class="stat-number count-up" data-target="10" data-suffix="+ Yrs">0</span>
      <span class="stat-label">Historical Data</span>
    </div>
    <div class="stat-card animate-in" style="transition-delay:0.3s">
      <span class="stat-number count-up" data-target="200" data-suffix="+">0</span>
      <span class="stat-label">Networks</span>
    </div>
    <div class="stat-card animate-in" style="transition-delay:0.4s">
      <span class="stat-number count-up" data-target="2000" data-suffix="+">0</span>
      <span class="stat-label">NFT Collections</span>
    </div>
    <div class="stat-card animate-in" style="transition-delay:0.5s">
      <span class="stat-number count-up" data-target="30" data-suffix="+">0</span>
      <span class="stat-label">Marketplaces</span>
    </div>
  </div>
</section>

<!-- Features -->
<section class="features-section" id="features">
  <div class="features-inner">
    <div class="features-lottie animate-in">
      <lottie-player
        src="/animations/network.json"
        background="transparent"
        speed="1"
        style="width:400px;height:400px;"
        loop autoplay>
      </lottie-player>
    </div>
    <div class="features-text animate-in" style="transition-delay:0.15s">
      <h2 class="features-heading">Everything You Need</h2>
      <ul class="bullet-list">
        <li><span class="bullet-icon">✦</span>Multi-chain coverage — Bitcoin, Ethereum, BNB, Solana and 200+ more</li>
        <li><span class="bullet-icon">✦</span>Real-time prices — live data updated every 60 seconds</li>
        <li><span class="bullet-icon">✦</span>Historical data — 10+ years of OHLCV records</li>
        <li><span class="bullet-icon">✦</span>NFT floor prices — 2,000+ collections across 30+ marketplaces</li>
        <li><span class="bullet-icon">✦</span>Enterprise-grade uptime — built for high-volume API usage</li>
      </ul>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="testimonials-section" id="testimonials">
  <h2 class="section-heading animate-in">What Our Users Say</h2>
  <%
    var testimonials = [
      { name: 'Alex M.',   role: 'Day Trader',        quote: 'CryptoPulse gives me the real-time edge I need. No delays, no excuses.' },
      { name: 'Sarah K.',  role: 'DeFi Developer',    quote: 'The API is rock solid. 200+ networks in one place is a game-changer.' },
      { name: 'James T.',  role: 'Portfolio Manager', quote: 'Finally a dashboard that\'s clean and actually fast. Love the portfolio tracking.' },
      { name: 'Priya N.',  role: 'NFT Collector',     quote: 'Floor price tracking across 30+ marketplaces? Insane. Nothing else comes close.' },
      { name: 'Carlos R.', role: 'Quant Analyst',     quote: '10 years of historical OHLCV data with minute granularity. Exactly what I needed.' },
      { name: 'Emma L.',   role: 'Crypto Blogger',    quote: 'I embed CryptoPulse data in every post. My readers trust the numbers.' },
      { name: 'David W.',  role: 'Retail Investor',   quote: 'Set up my watchlist in minutes. The UI is so much cleaner than the big sites.' },
      { name: 'Yuki H.',   role: 'Blockchain Eng.',   quote: 'Free tier is generous and the docs are actually good. Rare combination.' }
    ];
  %>
  <div class="marquee-wrapper">
    <div class="marquee-track">
      <% for (var r = 0; r < 2; r++) { testimonials.forEach(function(t) { %>
        <div class="testimonial-card">
          <div class="testimonial-header">
            <div class="testimonial-avatar"><%= t.name.charAt(0) %></div>
            <div>
              <div class="testimonial-name"><%= t.name %></div>
              <div class="testimonial-role"><%= t.role %></div>
            </div>
          </div>
          <div class="testimonial-stars">★★★★★</div>
          <p class="testimonial-quote">"<%= t.quote %>"</p>
        </div>
      <% }); } %>
    </div>
    <div class="marquee-track reverse">
      <% for (var r2 = 0; r2 < 2; r2++) { testimonials.forEach(function(t) { %>
        <div class="testimonial-card">
          <div class="testimonial-header">
            <div class="testimonial-avatar"><%= t.name.charAt(0) %></div>
            <div>
              <div class="testimonial-name"><%= t.name %></div>
              <div class="testimonial-role"><%= t.role %></div>
            </div>
          </div>
          <div class="testimonial-stars">★★★★★</div>
          <p class="testimonial-quote">"<%= t.quote %>"</p>
        </div>
      <% }); } %>
    </div>
  </div>
</section>

<!-- Why Us -->
<section class="why-section">
  <h2 class="section-heading animate-in">Why Choose CryptoPulse?</h2>
  <div class="why-inner">
    <div class="why-card why-others animate-in">
      <h3 class="why-card-title">Others</h3>
      <ul class="why-list">
        <li><span class="why-x">✗</span>Delayed or cached price data</li>
        <li><span class="why-x">✗</span>Cluttered, hard-to-navigate UI</li>
        <li><span class="why-x">✗</span>No built-in portfolio tracking</li>
        <li><span class="why-x">✗</span>Key features behind paywalls</li>
        <li><span class="why-x">✗</span>No watchlist functionality</li>
      </ul>
    </div>
    <div class="why-card why-us animate-in" style="transition-delay:0.15s">
      <h3 class="why-card-title why-us-title">CryptoPulse</h3>
      <ul class="why-list">
        <li><span class="why-check">✓</span>Real-time prices, updated live</li>
        <li><span class="why-check">✓</span>Clean, intuitive dashboard</li>
        <li><span class="why-check">✓</span>Full portfolio tracking built in</li>
        <li><span class="why-check">✓</span>Free data access, no paywalls</li>
        <li><span class="why-check">✓</span>Custom watchlists for any coin</li>
      </ul>
    </div>
  </div>
</section>

<%- include('partials/footer') %>

<script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="/js/observer.js"></script>
<script>
  // Hero heading loads with blur+fade on page load (not scroll)
  document.querySelectorAll('.animate-hero').forEach(function(el) {
    el.style.filter = 'blur(4px)';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';
    el.style.display = 'inline-block';
    el.style.transition = 'filter 0.8s ease, opacity 0.8s ease, transform 0.8s ease';
  });
  setTimeout(function() {
    var els = document.querySelectorAll('.animate-hero');
    els.forEach(function(el, i) {
      setTimeout(function() {
        el.style.filter = 'blur(0)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, i * 150);
    });
  }, 100);
</script>
</body>
</html>
```

- [ ] **Step 2: Replace `public/css/styles.css` with home page styles**

```css
/* ── Hero ── */
.hero-section {
  padding: 5rem 2rem;
  background: var(--background);
  background-image: radial-gradient(ellipse 60% 50% at 70% 50%, rgba(245, 158, 11, 0.12), transparent);
  overflow: hidden;
}

.hero-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 55% 45%;
  align-items: center;
  gap: 2rem;
}

.hero-heading {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  line-height: 1.1;
  margin: 0 0 1.5rem 0;
}

.hero-crypto {
  color: var(--primary);
  display: inline-block;
}

.hero-pulse {
  color: var(--muted-foreground);
  display: inline-block;
}

.hero-sub {
  color: var(--muted-foreground);
  font-size: 1.15rem;
  line-height: 1.6;
  margin: 0 0 2rem 0;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-primary-filled {
  padding: 0.65rem 1.5rem;
  background: var(--primary);
  color: var(--primary-foreground);
  border: none;
  border-radius: var(--radius);
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
  transition: background 0.2s ease, transform 0.2s ease;
}

.btn-primary-filled:hover {
  background: #d97706;
  transform: translateY(-2px);
  color: var(--primary-foreground);
}

.btn-primary-outline {
  padding: 0.65rem 1.5rem;
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
  border-radius: var(--radius);
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
  transition: background 0.2s ease;
}

.btn-primary-outline:hover {
  background: rgba(245, 158, 11, 0.1);
  color: var(--primary);
}

.hero-lottie {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* ── Stats ── */
.stats-section {
  padding: 4rem 2rem;
  background: var(--muted);
}

.stats-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
}

.stat-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  border-color: var(--primary);
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.15);
}

.stat-number {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary);
  display: block;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
}

/* ── Features ── */
.features-section {
  padding: 5rem 2rem;
  background: var(--background);
}

.features-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 45% 55%;
  align-items: center;
  gap: 3rem;
}

.features-heading {
  font-size: 2rem;
  font-weight: 700;
  color: var(--foreground);
  margin: 0 0 2rem 0;
}

.bullet-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bullet-list li {
  color: var(--foreground);
  font-size: 1rem;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.bullet-icon {
  color: var(--primary);
  flex-shrink: 0;
  font-size: 1rem;
  margin-top: 2px;
}

/* ── Testimonials ── */
.testimonials-section {
  padding: 5rem 0;
  background: var(--muted);
  overflow: hidden;
}

.section-heading {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  color: var(--foreground);
  margin: 0 0 3rem 0;
  padding: 0 2rem;
}

.marquee-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.marquee-wrapper:hover .marquee-track {
  animation-play-state: paused;
}

.marquee-track {
  display: flex;
  gap: 1rem;
  width: max-content;
  animation: marquee-left 40s linear infinite;
}

.marquee-track.reverse {
  animation: marquee-right 40s linear infinite;
}

@keyframes marquee-left {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes marquee-right {
  from { transform: translateX(-50%); }
  to { transform: translateX(0); }
}

.testimonial-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
  width: 280px;
  flex-shrink: 0;
}

.testimonial-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.testimonial-avatar {
  width: 36px;
  height: 36px;
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.testimonial-name {
  font-weight: 600;
  color: var(--foreground);
  font-size: 0.9rem;
}

.testimonial-role {
  font-size: 0.8rem;
  color: var(--muted-foreground);
}

.testimonial-stars {
  color: var(--primary);
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.testimonial-quote {
  color: var(--muted-foreground);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}

/* ── Why Us ── */
.why-section {
  padding: 5rem 2rem;
  background: var(--background);
}

.why-inner {
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.why-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 2rem;
}

.why-us {
  border-color: var(--primary);
  box-shadow: 0 0 24px rgba(245, 158, 11, 0.15);
}

.why-card-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--muted-foreground);
  margin: 0 0 1.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.why-us-title {
  color: var(--primary);
}

.why-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.why-list li {
  color: var(--foreground);
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.why-x {
  color: var(--color-down);
  font-weight: 700;
  flex-shrink: 0;
}

.why-check {
  color: var(--color-up);
  font-weight: 700;
  flex-shrink: 0;
}

/* ── Responsive ── */
@media (max-width: 1100px) {
  .stats-inner {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-inner {
    grid-template-columns: 1fr;
  }
  .hero-lottie {
    display: none;
  }
  .features-inner {
    grid-template-columns: 1fr;
  }
  .features-lottie {
    display: none;
  }
  .why-inner {
    grid-template-columns: 1fr;
  }
  .stats-inner {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

- [ ] **Step 3: Verify home page**

Open `http://localhost:3000`. Check each section:
- "Crypto" (amber) and "Pulse" (gray) blur+fade in on page load, staggered
- Blockchain Lottie on the right side of hero
- Stats section: 6 `#262626` cards, numbers count up from 0 when scrolled to
- Features section: network Lottie on left, 5 amber ✦ bullet points on right
- Testimonials: two rows scrolling in opposite directions, pause on hover
- Why Us: "Others" card (red ✗) vs "CryptoPulse" card (green ✓, amber border glow)
- Footer below

- [ ] **Step 4: Commit**

```bash
git add views/index.ejs public/css/styles.css
git commit -m "feat: rebuild home page with hero, stats, features, testimonials, why-us"
```

---

### Task 5: Markets Page Rebuild

**Files:**
- Modify: `views/partials/markets.ejs` (full rebuild)
- Modify: `public/css/markets.css` (full rebuild)
- Modify: `public/js/markets.js` (update row builder + add trending cards)

**Interfaces:**
- Consumes: CSS variables from Task 1; nav/footer partials from Tasks 2 & 3; `.animate-in` from Task 1
- Produces: markets page at `/markets`; JS functions `renderTrendingCards(coins)` and `buildRow(coin, index)` internal to `markets.js`

**Note:** `views/partials/markets.ejs` is a full HTML page (has its own `<!DOCTYPE html>`) despite being in the partials folder. The existing `markets.js` uses `getElementById("market-data-body")` and `getElementById("loading-indicator")` — keep these IDs.

- [ ] **Step 1: Rebuild `views/partials/markets.ejs`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markets — CryptoPulse</title>
  <link rel="stylesheet" href="/css/theme.css">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="/css/markets.css">
  <link rel="stylesheet" href="/css/other.css">
</head>
<body>
  <%- include('header') %>

  <div class="markets-container">

    <div class="markets-header">
      <h1 class="markets-title animate-in">Markets</h1>
      <div class="markets-search animate-in" style="transition-delay:0.1s">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" id="market-search" class="search-input" placeholder="Search coins..." />
      </div>
    </div>

    <div class="trending-cards animate-in" id="trending-cards" style="transition-delay:0.15s">
      <!-- Populated by markets.js -->
    </div>

    <div id="loading-indicator" class="market-loading">
      <div class="market-spinner"></div>
    </div>

    <div class="market-table-wrapper animate-in" style="transition-delay:0.2s">
      <table id="market-table" class="market-table">
        <thead>
          <tr>
            <th class="th-rank">#</th>
            <th>Coin</th>
            <th class="th-right">Price</th>
            <th class="th-right">24h %</th>
            <th class="th-right">Market Cap</th>
            <th class="th-right">Volume (24h)</th>
          </tr>
        </thead>
        <tbody id="market-data-body">
          <!-- Populated by markets.js -->
        </tbody>
      </table>
    </div>

  </div>

  <%- include('footer') %>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="/js/markets.js"></script>
  <script src="/js/observer.js"></script>
  <script>
    document.getElementById('market-search').addEventListener('input', function() {
      var q = this.value.toLowerCase();
      document.querySelectorAll('#market-data-body tr').forEach(function(row) {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: Replace `public/css/markets.css`**

```css
.markets-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.markets-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.markets-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--foreground);
  margin: 0;
}

.markets-search {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  width: 16px;
  height: 16px;
  color: var(--muted-foreground);
  pointer-events: none;
}

.search-input {
  padding: 0.5rem 1rem 0.5rem 2.25rem;
  background: var(--input);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--foreground);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  outline: none;
  width: 240px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
}

.search-input::placeholder {
  color: var(--muted-foreground);
}

.trending-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.trending-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.trending-card:hover {
  border-color: var(--primary);
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.15);
}

.trending-logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.trending-info {
  flex: 1;
  min-width: 0;
}

.trending-badge {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--primary);
  background: rgba(245, 158, 11, 0.15);
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  width: fit-content;
  margin-bottom: 0.3rem;
}

.trending-name {
  font-weight: 600;
  color: var(--foreground);
  font-size: 0.95rem;
}

.trending-symbol {
  color: var(--muted-foreground);
  font-size: 0.8rem;
  text-transform: uppercase;
}

.trending-price {
  text-align: right;
  flex-shrink: 0;
}

.trending-price-value {
  font-weight: 600;
  color: var(--foreground);
  font-size: 0.95rem;
  display: block;
  margin-bottom: 0.25rem;
}

.market-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.market-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(245, 158, 11, 0.2);
  border-left-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.market-table-wrapper {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.market-table {
  width: 100%;
  border-collapse: collapse;
}

.market-table thead {
  position: sticky;
  top: 64px;
  z-index: 10;
}

.market-table th {
  padding: 0.875rem 1rem;
  background: var(--card);
  color: var(--muted-foreground);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.market-table td {
  padding: 0.875rem 1rem;
  color: var(--foreground);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.market-table tbody tr:last-child td {
  border-bottom: none;
}

.market-table tbody tr:hover {
  background: rgba(245, 158, 11, 0.04);
}

.th-rank {
  width: 50px;
}

.td-rank {
  color: var(--muted-foreground);
  font-weight: 500;
}

.th-right, .td-right {
  text-align: right;
}

.coin-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.coin-info img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.coin-name {
  font-weight: 600;
  color: var(--foreground);
  font-size: 0.9rem;
}

.coin-symbol {
  color: var(--muted-foreground);
  font-size: 0.75rem;
  text-transform: uppercase;
}

.badge-up {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: rgba(34, 197, 94, 0.15);
  color: var(--color-up);
}

.badge-down {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: rgba(239, 68, 68, 0.15);
  color: var(--color-down);
}

@media (max-width: 768px) {
  .trending-cards {
    grid-template-columns: 1fr;
  }
  .markets-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .search-input {
    width: 100%;
  }
}
```

- [ ] **Step 3: Replace `public/js/markets.js` with updated version**

```javascript
document.addEventListener('DOMContentLoaded', function () {
  var tableBody = document.getElementById('market-data-body');
  var loadingIndicator = document.getElementById('loading-indicator');

  function formatCurrency(num) {
    if (num === null || num === undefined) return 'N/A';
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatLargeNumber(num) {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1e12) return '$' + (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M';
    return '$' + num.toLocaleString('en-US');
  }

  function renderTrendingCards(coins) {
    var container = document.getElementById('trending-cards');
    if (!container) return;
    var top3 = coins.slice(0, 3);
    container.innerHTML = top3.map(function (coin, i) {
      var change = coin.price_change_percentage_24h || 0;
      var badgeClass = change >= 0 ? 'badge-up' : 'badge-down';
      var sign = change >= 0 ? '+' : '';
      return '<div class="trending-card">' +
        '<img class="trending-logo" src="' + coin.image + '" alt="' + coin.name + '">' +
        '<div class="trending-info">' +
          '<span class="trending-badge">🔥 Trending #' + (i + 1) + '</span>' +
          '<div class="trending-name">' + coin.name + '</div>' +
          '<div class="trending-symbol">' + coin.symbol.toUpperCase() + '</div>' +
        '</div>' +
        '<div class="trending-price">' +
          '<span class="trending-price-value">' + formatCurrency(coin.current_price) + '</span>' +
          '<span class="' + badgeClass + '">' + sign + change.toFixed(2) + '%</span>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  function buildRow(coin, index) {
    var change = coin.price_change_percentage_24h || 0;
    var badgeClass = change >= 0 ? 'badge-up' : 'badge-down';
    var sign = change >= 0 ? '+' : '';
    return '<tr>' +
      '<td class="td-rank">' + (index + 1) + '</td>' +
      '<td><div class="coin-info">' +
        '<img src="' + coin.image + '" alt="' + coin.name + '">' +
        '<div>' +
          '<div class="coin-name">' + coin.name + '</div>' +
          '<div class="coin-symbol">' + coin.symbol.toUpperCase() + '</div>' +
        '</div>' +
      '</div></td>' +
      '<td class="td-right">' + formatCurrency(coin.current_price) + '</td>' +
      '<td class="td-right"><span class="' + badgeClass + '">' + sign + change.toFixed(2) + '%</span></td>' +
      '<td class="td-right">' + formatLargeNumber(coin.market_cap) + '</td>' +
      '<td class="td-right">' + formatLargeNumber(coin.total_volume) + '</td>' +
    '</tr>';
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

- [ ] **Step 4: Verify markets page**

Open `http://localhost:3000/markets`. Verify:
- Dark `#171717` background, `#0f0f0f` navbar
- "Markets" heading fades in
- Search bar appears in top-right
- Top 3 trending cards load with logo, 🔥 badge, price, % change pill
- Full table loads below with rank, logo+name/symbol, price, 24h% pill, market cap, volume
- Search input filters table rows live (type "bit" → only Bitcoin rows show)
- Green badges for positive %, red for negative
- Page scrolls smoothly with sticky table header

- [ ] **Step 5: Commit**

```bash
git add views/partials/markets.ejs public/css/markets.css public/js/markets.js
git commit -m "feat: rebuild markets page with trending cards and searchable table"
```

---

### Task 6: Auth Pages Update

**Files:**
- Modify: `views/auth/login.ejs`
- Modify: `views/auth/register.ejs`
- Modify: `public/css/auth.css`

**Interfaces:**
- Consumes: CSS variables from Task 1; `.animate-in` from Task 1; nav/footer partials from Tasks 2 & 3
- Produces: login at `/auth/login`, register at `/auth/register`

- [ ] **Step 1: Update `views/auth/login.ejs` — add `theme.css` first and `observer.js` last, add animation classes**

In `<head>`, add `theme.css` as the **first** stylesheet:
```html
<link rel="stylesheet" href="/css/theme.css">
```

Add `.animate-in` with staggered delays to the form elements. Wrap the `.auth-card` and its children:
```html
<div class="auth-card animate-in">
```
Add staggered delays to each form group and button inside:
```html
<div class="form-group animate-in" style="transition-delay: 0.1s">
  <!-- email field -->
</div>
<div class="form-group animate-in" style="transition-delay: 0.2s">
  <!-- password field -->
</div>
<div class="form-options animate-in" style="transition-delay: 0.25s">
  <!-- remember me -->
</div>
<button class="btn-auth animate-in" style="transition-delay: 0.3s">Login</button>
```

Before `</body>`, add:
```html
<script src="/js/observer.js"></script>
```

- [ ] **Step 2: Update `views/auth/register.ejs` — same pattern**

Add `theme.css` first in `<head>`, `observer.js` before `</body>`.

Add `.animate-in` with staggered delays on each form group (4 fields: delays 0.1s, 0.2s, 0.3s, 0.4s) and submit button (delay 0.5s). Wrap `.auth-card` with `.animate-in`.

- [ ] **Step 3: Replace hardcoded colors in `public/css/auth.css`**

Make these replacements throughout the file:

| Old value | Replace with |
|-----------|-------------|
| `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)` | `var(--background)` |
| `#1e2a3a` | `var(--card)` |
| `#30363d` | `var(--border)` |
| `#ffffff` | `var(--foreground)` |
| `#8b949e` | `var(--muted-foreground)` |
| `#c9d1d9` | `var(--card-foreground)` |
| `#0d1b2a` | `var(--input)` |
| `#fd7e14` | `var(--primary)` |
| `#ff9f43` | `#fbbf24` |
| `#e55a00` | `#d97706` |
| `#cc4a00` | `#b45309` |
| `#6e7681` | `var(--muted-foreground)` |
| `rgba(253, 126, 20, 0.2)` | `rgba(245, 158, 11, 0.2)` |
| `rgba(253, 126, 20, 0.1)` | `rgba(245, 158, 11, 0.1)` |
| `rgba(253, 126, 20, 0.3)` | `rgba(245, 158, 11, 0.3)` |
| `rgba(220, 53, 69, 0.15)` | `rgba(239, 68, 68, 0.15)` |
| `rgba(220, 53, 69, 0.3)` | `rgba(239, 68, 68, 0.3)` |
| `rgba(25, 135, 84, 0.15)` | `rgba(34, 197, 94, 0.15)` |
| `rgba(25, 135, 84, 0.3)` | `rgba(34, 197, 94, 0.3)` |

Also update `.auth-container`:
```css
.auth-container {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--background);
}
```

- [ ] **Step 4: Verify auth pages**

Open `http://localhost:3000/auth/login`. Verify:
- Page background is `#171717` (not the old blue gradient)
- Card (`#262626`) fades+blurs in on load
- Form fields stagger in sequentially
- Input fields have `#404040` background, amber focus ring
- Login button is amber with black text
- "Don't have an account?" link is amber

Open `http://localhost:3000/auth/register`. Same checks, 4 form fields visible.

- [ ] **Step 5: Commit**

```bash
git add views/auth/login.ejs views/auth/register.ejs public/css/auth.css
git commit -m "feat: update auth pages with dark theme and staggered animations"
```

---

### Task 7: Portfolio Dashboard Theme Update

**Files:**
- Modify: `views/portfolio/dashboard.ejs`
- Modify: `public/css/portfolio.css`

**Interfaces:**
- Consumes: CSS variables from Task 1; `.animate-in` from Task 1
- Produces: portfolio dashboard at `/portfolio`

- [ ] **Step 1: Add `theme.css` as first stylesheet in `views/portfolio/dashboard.ejs`**

Find the `<head>` section. Add as the very first `<link>`:
```html
<link rel="stylesheet" href="/css/theme.css">
```

Before `</body>`, add:
```html
<script src="/js/observer.js"></script>
```

Add `.animate-in` class with staggered delays to the three main sections:
```html
<div class="summary-cards animate-in">...</div>
<div class="holdings-section animate-in" style="transition-delay: 0.15s">...</div>
<div class="analytics-section animate-in" style="transition-delay: 0.3s">...</div>
```

- [ ] **Step 2: Replace hardcoded colors in `public/css/portfolio.css`**

Make these replacements throughout:

| Old value | Replace with |
|-----------|-------------|
| `#1e2a3a` | `var(--card)` |
| `#30363d` | `var(--border)` |
| `#ffffff` | `var(--foreground)` |
| `#8b949e` | `var(--muted-foreground)` |
| `#c9d1d9` | `var(--card-foreground)` |
| `#0d1b2a` | `var(--input)` |
| `#fd7e14` | `var(--primary)` |
| `#e55a00` | `#d97706` |
| `#cc4a00` | `#b45309` |
| `#2ecc71` | `var(--color-up)` |
| `#e74c3c` | `var(--color-down)` |
| `#6e7681` | `var(--muted-foreground)` |
| `rgba(253, 126, 20` | `rgba(245, 158, 11` |
| `rgba(46, 204, 113` | `rgba(34, 197, 94` |
| `rgba(231, 76, 60` | `rgba(239, 68, 68` |
| `rgba(13, 27, 42` | `rgba(23, 23, 23` |

Also update `.portfolio-container` body background override if present:
```css
.portfolio-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}
```

If Chart.js chart colors are hardcoded in `dashboard.ejs` script tags, replace with:
```javascript
backgroundColor: [
  getComputedStyle(document.documentElement).getPropertyValue('--chart-1').trim(),
  getComputedStyle(document.documentElement).getPropertyValue('--chart-2').trim(),
  getComputedStyle(document.documentElement).getPropertyValue('--chart-3').trim(),
  getComputedStyle(document.documentElement).getPropertyValue('--chart-4').trim(),
  getComputedStyle(document.documentElement).getPropertyValue('--chart-5').trim()
]
```

- [ ] **Step 3: Verify portfolio dashboard**

Log in at `/auth/login`, navigate to `/portfolio`. Verify:
- `#171717` page background
- `#262626` summary cards and holdings section
- Summary cards, holdings table, analytics section fade+blur in on load
- Amber buttons and focus rings
- Green P/L values use `#22c55e`, red losses use `#ef4444`
- No visual regressions in the add/edit/delete holding modals

- [ ] **Step 4: Commit**

```bash
git add views/portfolio/dashboard.ejs public/css/portfolio.css
git commit -m "feat: update portfolio dashboard with dark theme and scroll animations"
```

---

### Task 8: Watchlist Theme Update

**Files:**
- Modify: `views/portfolio/watchlist.ejs`
- Modify: `public/css/watchlist.css`

**Interfaces:**
- Consumes: CSS variables from Task 1; `.animate-in` from Task 1
- Produces: watchlist at `/portfolio/watchlist`

- [ ] **Step 1: Add `theme.css` as first stylesheet in `views/portfolio/watchlist.ejs`**

Find the `<head>` section. Add as the very first `<link>`:
```html
<link rel="stylesheet" href="/css/theme.css">
```

Before `</body>`, add:
```html
<script src="/js/observer.js"></script>
```

Add `.animate-in` to main sections:
```html
<div class="watchlist-header animate-in">...</div>
<div class="watchlist-content animate-in" style="transition-delay: 0.15s">...</div>
```

- [ ] **Step 2: Replace hardcoded colors in `public/css/watchlist.css`**

Make these replacements throughout:

| Old value | Replace with |
|-----------|-------------|
| `#1e2a3a` | `var(--card)` |
| `#30363d` | `var(--border)` |
| `#ffffff` | `var(--foreground)` |
| `#8b949e` | `var(--muted-foreground)` |
| `#c9d1d9` | `var(--card-foreground)` |
| `#0d1b2a` | `var(--input)` |
| `#fd7e14` | `var(--primary)` |
| `#e55a00` | `#d97706` |
| `#cc4a00` | `#b45309` |
| `#2ecc71` | `var(--color-up)` |
| `#e74c3c` | `var(--color-down)` |
| `#f1c40f` | `var(--chart-1)` |
| `rgba(253, 126, 20` | `rgba(245, 158, 11` |
| `rgba(46, 204, 113` | `rgba(34, 197, 94` |
| `rgba(231, 76, 60` | `rgba(239, 68, 68` |
| `rgba(241, 196, 15` | `rgba(251, 191, 36` |
| `rgba(13, 27, 42` | `rgba(23, 23, 23` |

- [ ] **Step 3: Verify watchlist page**

Navigate to `/portfolio/watchlist` (must be logged in). Verify:
- Dark theme applied throughout
- Header and table fade+blur in on load
- Change badges show green pill (`.badge-up` / `.badge-down` styled similarly to markets)
- Alert (yellow), Add to Portfolio (green), Remove (red) action buttons styled correctly
- No visual regressions in the alert modal or quick-add modal

- [ ] **Step 4: Commit**

```bash
git add views/portfolio/watchlist.ejs public/css/watchlist.css
git commit -m "feat: update watchlist with dark theme and scroll animations"
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task | Status |
|---|---|---|
| `theme.css` with all dark tokens in `:root` | Task 1 | ✓ |
| `observer.js` IntersectionObserver animation | Task 1 | ✓ |
| `about.css` color token update | Task 1 | ✓ |
| `chart.css` color token update | Task 1 | ✓ |
| Navbar: logo left, links, login/signup right | Task 2 | ✓ |
| Footer: 4-column animated, SVG social icons | Task 3 | ✓ |
| Home hero: blur+fade heading, text+lottie, amber glow | Task 4 | ✓ |
| Home stats: 6 count-up cards | Task 4 | ✓ |
| Home features: network lottie + bullet list | Task 4 | ✓ |
| Home testimonials: dual infinite marquee | Task 4 | ✓ |
| Home why us: split comparison | Task 4 | ✓ |
| Markets: top 3 trending cards | Task 5 | ✓ |
| Markets: searchable table with badges | Task 5 | ✓ |
| Auth: centered card + staggered animations | Task 6 | ✓ |
| Portfolio: theme + scroll animations | Task 7 | ✓ |
| Watchlist: theme + scroll animations | Task 8 | ✓ |
| `graphs.ejs` needs `theme.css` | — | ⚠️ |

**Gap:** `views/graphs.ejs` uses `chart.css` but `theme.css` is not added to it. Fix: in Task 7 or Task 8, also add `<link rel="stylesheet" href="/css/theme.css">` as the first stylesheet in `views/graphs.ejs` head. (Add it to Task 7 step 1.)

**Placeholder scan:** No TBDs found. All steps have concrete code.

**Type/name consistency:**
- `loadingIndicator` id: `loading-indicator` — consistent between Task 5 HTML and Task 5 JS ✓
- `trending-cards` id — consistent between Task 5 HTML and `renderTrendingCards()` in JS ✓
- `.animate-in` / `.visible` — defined Task 1, used Tasks 2-8 ✓
- `.count-up` / `data-target` / `data-suffix` — defined Task 1 observer, used Task 4 HTML ✓
- `.badge-up` / `.badge-down` — defined Task 5 CSS, used Task 5 JS ✓
- `.btn-primary-filled` / `.btn-primary-outline` — defined Task 4 CSS, used Task 4 HTML ✓
- `.nav-logo-crypto` / `.nav-logo-pulse` — defined Task 2 CSS, reused in footer Task 3 ✓

**Fix for graphs.ejs gap:** Add to Task 7, Step 1: also open `views/graphs.ejs` and add `<link rel="stylesheet" href="/css/theme.css">` as the first stylesheet in its `<head>`.
