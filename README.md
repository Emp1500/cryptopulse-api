<div align="center">

<img src="public/images/cryptologo1.png" alt="CryptoPulse Logo" width="80" />

# CryptoPulse

**Production-grade cryptocurrency dashboard with real-time market data, portfolio tracking, and analytics**

[![CI/CD](https://github.com/Emp1500/cryptopulse-api/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Emp1500/cryptopulse-api/actions/workflows/ci-cd.yml)
[![Tests](https://img.shields.io/badge/tests-40%20passing-22c55e?style=flat-square&logo=jest)](https://github.com/Emp1500/cryptopulse-api/actions)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://cryptipulse.vercel.app)
[![License](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](LICENSE)

[**Live Demo**](https://cryptipulse.vercel.app) · [Report Bug](https://github.com/Emp1500/cryptopulse-api/issues) · [Request Feature](https://github.com/Emp1500/cryptopulse-api/issues)

</div>

---

## Overview

CryptoPulse is a **full-stack web application** that gives investors a real-time, unified view of the cryptocurrency market. It combines live price data from CoinGecko with a personal portfolio tracker, interactive analytics charts, and a watchlist — all behind a secure, session-based authentication system backed by PostgreSQL.

Built with a production-grade stack: rate limiting, CSP headers, bcrypt password hashing, structured logging, Sentry error monitoring, a 40-test automated suite, and a GitHub Actions CI/CD pipeline that gates every deploy behind passing tests.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [Security](#security)
- [License](#license)

---

## Features

### Market Intelligence
| Feature | Detail |
|---|---|
| Live market data | Top 12 coins on the homepage, top 100 in the Markets page — prices refresh every 60 seconds |
| Server-side cache | 5-minute in-memory TTL; stale-cache fallback prevents downtime on API outages |
| Interactive charts | Historical performance chart (7D / 30D / 90D) and portfolio allocation doughnut via Chart.js |
| Lottie animations | Smooth blockchain-themed animations served from `cdn.jsdelivr.net` (CSP-compliant) |

### Portfolio Dashboard (4 tabs)
| Tab | What it shows |
|---|---|
| **Overview** | Total value, invested, P/L, return % — with allocation doughnut and simulated performance line chart |
| **Holdings** | Full CRUD table — add via coin search (live `/api/markets` filter), edit, delete |
| **Analytics** | Horizontal P/L bar chart per coin, allocation donut, best/worst performer cards |
| **Watchlist** | Inline coin cards with live price + 24h change; add/remove without leaving the page |

### Authentication & Security
- **bcrypt** password hashing (cost factor 10)
- **PostgreSQL session store** (`connect-pg-simple`) — sessions survive server restarts and Vercel serverless cold starts
- `req.session.save()` wraps every redirect to guarantee session flush before response
- **Rate limiting** — 10 requests per 15 minutes on all auth endpoints
- **Helmet CSP** — strict `scriptSrc`, `imgSrc`, `connectSrc` whitelist; no inline eval
- **express-validator** input sanitisation on all form fields

### Observability
- **Winston** structured logging (info / warn / error) with timestamps
- **Sentry** error monitoring wired to the Express error handler; 20% trace sampling in production

---

## Tech Stack

### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express 5](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![bcryptjs](https://img.shields.io/badge/bcrypt-password%20hashing-lightgrey?style=flat-square)
![Winston](https://img.shields.io/badge/Winston-logging-lightgrey?style=flat-square)
![Sentry](https://img.shields.io/badge/Sentry-monitoring-362D59?style=flat-square&logo=sentry&logoColor=white)

### Frontend
![EJS](https://img.shields.io/badge/EJS-templating-B4CA65?style=flat-square)
![Vanilla JS](https://img.shields.io/badge/Vanilla%20JS-ES2020-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![CSS Custom Properties](https://img.shields.io/badge/CSS-Custom%20Properties-1572B6?style=flat-square&logo=css3&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-4.x-FF6384?style=flat-square&logo=chart.js&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=flat-square&logo=bootstrap&logoColor=white)

### Testing & DevOps
![Jest](https://img.shields.io/badge/Jest-30.x-C21325?style=flat-square&logo=jest&logoColor=white)
![Supertest](https://img.shields.io/badge/Supertest-integration%20testing-lightgrey?style=flat-square)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI%2FCD-2088FF?style=flat-square&logo=github-actions&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-serverless-000000?style=flat-square&logo=vercel&logoColor=white)

### External APIs
![CoinGecko](https://img.shields.io/badge/CoinGecko-market%20data-8AC640?style=flat-square)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser / Client                        │
│                  EJS templates + Vanilla JS                     │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Express 5.x  (app.js)                        │
│                                                                  │
│  Middleware stack:                                               │
│  Helmet (CSP) → express-session → user locals → routes          │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │ /auth       │  │ /portfolio   │  │ /api + page routes  │    │
│  │ login       │  │ dashboard    │  │ /api/markets        │    │
│  │ register    │  │ holdings     │  │ /markets  /about    │    │
│  │ logout      │  │ watchlist    │  │ /graphs   /news     │    │
│  └──────┬──────┘  └──────┬───────┘  └────────┬────────────┘    │
│         │                │                    │                  │
│  ┌──────▼────────────────▼────────────────────▼──────────────┐  │
│  │               isAuthenticated middleware                   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────┐  ┌───────────────────────┐ │
│  │   In-memory cache (5-min TTL)   │  │  Winston logger       │ │
│  │   Stale-cache fallback on err   │  │  Sentry error handler │ │
│  └────────────────┬────────────────┘  └───────────────────────┘ │
└───────────────────│─────────────────────────────────────────────┘
                    │
        ┌───────────┴────────────┐
        │                        │
        ▼                        ▼
┌───────────────┐      ┌──────────────────────┐
│  CoinGecko    │      │  Supabase             │
│  API          │      │  (PostgreSQL)          │
│               │      │                        │
│  /coins/      │      │  users                 │
│   markets     │      │  sessions              │
│  /simple/     │      │  portfolio_holdings    │
│   price       │      │  watchlist             │
└───────────────┘      └──────────────────────-┘
```

### Portfolio dashboard data flow

```
GET /portfolio
    │
    ├─ Promise.all([
    │      supabase: portfolio_holdings WHERE user_id
    │      supabase: watchlist         WHERE user_id
    │  ])
    │
    ├─ Promise.all([
    │      CoinGecko: /simple/price      (holdings enrichment)
    │      CoinGecko: /coins/markets     (watchlist enrichment)
    │  ])
    │
    └─ res.render('portfolio/dashboard', { holdings, watchlist, totals })
         └─ Client: pure JS tab switching (URL hash, no page reload)
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 22.x |
| npm | 9.x+ |
| Supabase account | (for PostgreSQL) |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Emp1500/cryptopulse-api.git
cd cryptopulse-api

# 2. Install dependencies
npm install

# 3. Configure environment variables (see below)
cp .env.example .env   # then fill in your values

# 4. Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Supabase — production database
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_SERVICE_KEY=<your-service-role-key>

# PostgreSQL connection string (for session store)
DATABASE_URL=postgresql://postgres:<password>@db.<project-id>.supabase.co:5432/postgres

# Session
SESSION_SECRET=<a-long-random-string>

# Error monitoring (optional)
SENTRY_DSN=<your-sentry-dsn>

# For running tests against an isolated DB
TEST_SUPABASE_URL=https://<test-project-id>.supabase.co
TEST_SUPABASE_SERVICE_KEY=<test-service-role-key>
```

> **Note:** The test suite runs against a separate Supabase project to keep production data clean. CI injects `TEST_SUPABASE_URL` and `TEST_SUPABASE_SERVICE_KEY` via GitHub Secrets.

### Required Supabase tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sessions (managed by connect-pg-simple)
CREATE TABLE sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMPTZ NOT NULL
);

-- Portfolio holdings
CREATE TABLE portfolio_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  coin_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  image TEXT DEFAULT '',
  quantity NUMERIC NOT NULL,
  purchase_price NUMERIC NOT NULL,
  purchase_date DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Watchlist
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  coin_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  image TEXT DEFAULT '',
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, coin_id)
);
```

---

## API Reference

### Authentication — `/auth`

| Method | Endpoint | Body | Response | Description |
|---|---|---|---|---|
| `GET` | `/auth/login` | — | 200 HTML | Login page |
| `POST` | `/auth/login` | `email`, `password` | 302 `/portfolio` | Authenticate user |
| `GET` | `/auth/register` | — | 200 HTML | Register page |
| `POST` | `/auth/register` | `name`, `email`, `password`, `confirmPassword` | 302 `/auth/login` | Create account |
| `POST` | `/auth/logout` | — | 302 `/` | Destroy session |

### Portfolio — `/portfolio` *(authentication required)*

| Method | Endpoint | Body | Response | Description |
|---|---|---|---|---|
| `GET` | `/portfolio` | — | 200 HTML | Dashboard (fetches holdings + watchlist in parallel) |
| `GET` | `/portfolio/holdings` | — | 200 JSON | All holdings with live prices |
| `POST` | `/portfolio/holdings` | `coinId`, `symbol`, `name`, `quantity`, `purchasePrice`, `purchaseDate?` | 200 JSON | Add holding |
| `PUT` | `/portfolio/holdings/:id` | `quantity?`, `purchasePrice?`, `purchaseDate?` | 200 JSON | Update holding |
| `DELETE` | `/portfolio/holdings/:id` | — | 200 JSON | Delete holding |
| `GET` | `/portfolio/watchlist` | — | 200 HTML | Watchlist page |
| `POST` | `/portfolio/watchlist` | `coinId`, `symbol`, `name`, `image?` | 200 JSON | Add to watchlist |
| `DELETE` | `/portfolio/watchlist/:coinId` | — | 200 JSON | Remove from watchlist |

### Public API & Pages

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/markets` | Top 100 coins JSON (used by coin-search in modals) |
| `GET` | `/` | Homepage — top 12 coins by market cap |
| `GET` | `/markets` | Full markets table (top 100) |
| `GET` | `/graphs` | Price charts page |
| `GET` | `/about` | About page |
| `GET` | `/news` | Redirects to CoinMarketCap news |

---

## Project Structure

```
cryptipulse/
├── app.js                          # App entry point, middleware, page routes
├── vercel.json                     # Serverless deployment config
├── jest.config.js                  # Test runner config
├── package.json
│
├── config/
│   ├── database.js                 # Supabase client (prod/test env-aware)
│   └── logger.js                   # Winston logger (timestamps + levels)
│
├── middleware/
│   └── auth.js                     # isAuthenticated route guard
│
├── routes/
│   ├── api.js                      # GET /api/markets — CoinGecko proxy
│   ├── auth.js                     # Register, login, logout + rate limiting
│   └── portfolio.js                # Holdings + watchlist CRUD
│
├── views/
│   ├── index.ejs                   # Homepage (top 12 coins + Lottie animations)
│   ├── graphs.ejs                  # Price charts page
│   ├── portfolio/
│   │   ├── dashboard.ejs           # 4-tab portfolio dashboard
│   │   └── watchlist.ejs           # Standalone watchlist page
│   ├── auth/
│   │   ├── login.ejs
│   │   └── register.ejs
│   └── partials/
│       ├── header.ejs              # Sticky dark navbar (auth-aware)
│       ├── footer.ejs              # 4-column footer
│       ├── markets.ejs             # Top 100 markets table
│       └── about.ejs               # About page
│
├── public/
│   ├── css/
│   │   ├── theme.css               # Design token system (CSS custom properties)
│   │   ├── portfolio.css           # Dashboard, tab nav, modal styles
│   │   ├── about.css               # About page styles
│   │   ├── markets.css
│   │   └── other.css
│   ├── js/
│   │   ├── observer.js             # IntersectionObserver scroll animations
│   │   └── markets.js              # Markets table search + filter
│   └── animations/                 # Lottie JSON animation files
│
├── tests/
│   ├── helpers/
│   │   ├── db.js                   # Test factories: createTestUser, createTestHolding, createTestWatchlistCoin
│   │   └── setup.js
│   ├── integration/
│   │   ├── auth.test.js            # POST /auth/login, /register, /logout
│   │   ├── portfolio.test.js       # GET /portfolio, holdings CRUD, watchlist data
│   │   └── watchlist.test.js       # Watchlist add/remove/duplicate prevention
│   └── unit/
│       ├── auth.utils.test.js
│       └── portfolio.utils.test.js
│
└── .github/
    └── workflows/
        └── ci-cd.yml               # Test → Deploy gated pipeline
```

---

## Testing

The project has **40 automated tests** across 5 suites, running against an isolated Supabase test project (separate from production).

```bash
# Run all tests
npm test

# Watch mode (development)
npm run test:watch

# Run a single suite
npx jest tests/integration/auth.test.js
```

### Coverage summary

| Suite | Tests | What's covered |
|---|---|---|
| `auth.test.js` | 7 | Login, register, duplicate email, wrong password, logout, session persistence |
| `portfolio.test.js` | 10 | GET /portfolio (auth guard + watchlist data in response), holdings CRUD, validation |
| `watchlist.test.js` | 9 | Add coin, remove coin, duplicate prevention, unauthenticated access guard |
| `auth.utils.test.js` | 7 | Password hashing helpers, session utilities |
| `portfolio.utils.test.js` | 7 | Price enrichment logic, P/L calculations |

### Design decisions

- **Real database, no mocks** — Tests hit a live Supabase Postgres instance. Mocking previously masked migration bugs that only appeared in production.
- **Factory helpers** — `createTestUser()`, `createTestHolding()`, `createTestWatchlistCoin()` insert rows and return data; `afterEach` cleans up by `user_id`.
- **Supertest agent** — Stateful `request.agent(app)` carries session cookies across requests, enabling full end-to-end auth flows in tests.

---

## CI/CD Pipeline

Every push to any branch triggers the test job. A deploy to Vercel production only fires if the tests pass **and** the branch is `main`.

```
git push origin main
       │
       └─▶ GitHub Actions
               │
               ├─▶ [test]    Node.js 22 · npm ci · npm test
               │       │
               │       ├── PASS ──▶ [deploy]  vercel --prod --yes
               │       │
               │       └── FAIL ──▶ Pipeline halts. No deploy.
               │
               └─▶ Vercel Production (https://cryptipulse.vercel.app)
```

**GitHub Secrets required:**

| Secret | Purpose |
|---|---|
| `TEST_SUPABASE_URL` | Isolated test database URL |
| `TEST_SUPABASE_SERVICE_KEY` | Test DB service role key |
| `VERCEL_TOKEN` | Team-scoped Vercel deploy token |
| `VERCEL_ORG_ID` | Vercel team ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

---

## Security

| Layer | Implementation |
|---|---|
| **Password hashing** | `bcryptjs` with cost factor 10 |
| **Session storage** | PostgreSQL via `connect-pg-simple` — no sensitive data client-side |
| **Cookie hardening** | `httpOnly: true`, `secure: true` in production, 7-day expiry |
| **Rate limiting** | 10 requests / 15 minutes on all `/auth` endpoints |
| **Content Security Policy** | Helmet with strict `scriptSrc`, `imgSrc`, `connectSrc` whitelists |
| **Input validation** | `express-validator` sanitises and validates all form inputs server-side |
| **Session flush** | `req.session.save()` before every post-auth redirect — prevents race conditions on Vercel serverless cold starts |
| **Error monitoring** | Sentry captures unhandled exceptions; 20% trace sampling in production |

---

## License

Distributed under the ISC License.

---

<div align="center">

Built by **[Vedant Wagh](https://github.com/Emp1500)**

[![GitHub](https://img.shields.io/badge/GitHub-Emp1500-181717?style=flat-square&logo=github)](https://github.com/Emp1500)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-vedantwagh15-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/vedantwagh15)

</div>
