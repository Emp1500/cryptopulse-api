# CryptiPulse — Industry-Grade Upgrade Design

**Date:** 2026-06-16
**Goal:** Upgrade CryptiPulse from a UI-complete prototype to a production-ready, deployable application suitable for MNC portfolio evaluation.

---

## Overview

Phases 1–4 are complete: auth UI, portfolio dashboard, analytics, and watchlist all work with in-memory mock data. This upgrade replaces mock data with a real database, adds professional security and observability tooling, a full test suite, and a CI/CD pipeline that auto-deploys to Vercel.

**Approach:** Five layered phases. Each phase ships independently working code. Stop at any layer and the project is still deployable.

---

## Target Stack

| Layer | Current | Target |
|---|---|---|
| Database | In-memory Maps | Supabase (PostgreSQL) |
| Sessions | In-memory express-session | express-session + connect-pg-simple (Supabase) |
| Passwords | Plaintext strings | bcrypt (10 salt rounds) |
| HTTP security | None | helmet.js |
| Rate limiting | None | express-rate-limit (auth routes) |
| Input validation | Manual checks | express-validator |
| Logging | console.log | Winston (structured JSON) |
| Error monitoring | None | Sentry |
| Testing | None | Jest + Supertest |
| CI/CD | None | GitHub Actions |
| Deployment | Local only | Vercel (serverless) |

---

## Layer 1: Security Hardening

**Objective:** Harden the existing auth and input-handling before touching the database.

### bcrypt
- Install `bcryptjs`
- On `POST /auth/register`: hash password with `bcrypt.hash(password, 10)` before storing
- On `POST /auth/login`: verify with `bcrypt.compare(plaintext, hash)`
- Salt rounds: 10 (industry standard — slow enough to resist brute force, fast enough for UX)

### helmet.js
- `app.use(helmet())` in `app.js` before all routes
- Automatically sets 11 HTTP security headers: CSP, X-Frame-Options, HSTS, X-Content-Type-Options, etc.

### express-rate-limit
- Applied to `/auth/login` and `/auth/register` only
- Limit: 10 requests per 15 minutes per IP
- Returns HTTP 429 with a JSON error message on breach

### express-validator
- Replaces manual `if (!name || !email...)` checks in all routes
- Auth routes: trim + normalize email, min password length 6
- Portfolio routes: validate quantity > 0, purchasePrice > 0, valid date format
- Watchlist routes: validate coinId, name, symbol are non-empty strings
- On validation failure: return HTTP 422 with an array of field errors

### New packages
```
bcryptjs  helmet  express-rate-limit  express-validator
```

---

## Layer 2: Supabase Integration

**Objective:** Replace all in-memory mock data with persistent PostgreSQL storage via Supabase.

### Database Schema

```sql
-- Users
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio holdings
CREATE TABLE portfolio_holdings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  coin_id VARCHAR(100) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  image TEXT,
  quantity DECIMAL(20, 8) NOT NULL,
  purchase_price DECIMAL(20, 8) NOT NULL,
  purchase_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlist
CREATE TABLE watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  coin_id VARCHAR(100) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  image TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, coin_id)
);
```

### Connection

- New file: `config/database.js` — exports a single Supabase client instance
- Uses `@supabase/supabase-js` with `SUPABASE_URL` and `SUPABASE_ANON_KEY` from environment
- All routes import the client from `config/database.js` — no connection logic in route files

### Session Persistence

- `connect-pg-simple` stores sessions in a `sessions` table in Supabase PostgreSQL
- Critical for Vercel: serverless functions are stateless — sessions in memory vanish between requests
- `connect-pg-simple` uses the `pg` package with a direct PostgreSQL connection string (`DATABASE_URL`), not the Supabase JS client
- Pass `createTableIfMissing: true` — the sessions table is created automatically on first connection
- `DATABASE_URL` is Supabase's connection pooler string, found in Supabase dashboard → Project Settings → Database → Connection string (Transaction mode, port 6543)

### Migration Path

- `routes/auth.js`: replace `mockUsers.find()` with `supabase.from('users').select()`
- `routes/portfolio.js`: replace `mockPortfolios.get()` Map lookups with `supabase.from('portfolio_holdings')` queries
- Watchlist routes: replace `mockWatchlists.get()` with `supabase.from('watchlist')` queries
- Route response shapes remain identical — no frontend changes needed

### New packages
```
@supabase/supabase-js  connect-pg-simple  pg
```

### New file
```
config/database.js
```

---

## Layer 3: Testing

**Objective:** Unit test pure logic, integration test all API routes against a real test database.

### Unit Tests

Extract inline calculation logic from `routes/portfolio.js` into `utils/portfolio.js`:
- `calculateProfitLoss(quantity, purchasePrice, currentPrice)` → `{ profitLoss, profitLossPercent }`
- `calculatePortfolioTotals(holdingsWithPrices)` → `{ totalValue, totalInvested, totalProfitLoss, totalProfitLossPercent }`
- `calculateAllocation(holdingsWithPrices, totalValue)` → array with `allocationPercent` per holding

Unit test these functions directly — no HTTP, no database.

Also unit test bcrypt helpers:
- Hash + compare round-trip succeeds
- Wrong password compare returns false

### Integration Tests

Uses Supertest to fire real HTTP requests against a running Express app connected to a **second free Supabase project created solely for testing** (separate URL and keys from production). Each test suite seeds its own data in `beforeEach` and cleans up in `afterEach`. The test project's `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `DATABASE_URL` are stored as GitHub Secrets prefixed with `TEST_` (e.g. `TEST_SUPABASE_URL`) and injected only into the CI test job — never into the Vercel production environment.

**Auth routes (`tests/integration/auth.test.js`):**
- `POST /auth/register` — valid registration succeeds, duplicate email returns 400, missing fields return 422
- `POST /auth/login` — valid credentials redirect to `/portfolio`, wrong password returns error, unknown email returns error
- `POST /auth/logout` — destroys session, redirects to `/`

**Portfolio routes (`tests/integration/portfolio.test.js`):**
- `GET /portfolio` — unauthenticated request redirects to `/auth/login`
- `GET /portfolio` — authenticated request returns 200
- `POST /portfolio/holdings` — valid holding adds successfully, invalid quantity returns 422
- `PUT /portfolio/holdings/:id` — updates holding, 404 on unknown id
- `DELETE /portfolio/holdings/:id` — removes holding, 404 on unknown id

**Watchlist routes (`tests/integration/watchlist.test.js`):**
- `POST /portfolio/watchlist` — adds coin, duplicate returns 400
- `DELETE /portfolio/watchlist/:coinId` — removes coin, 404 on unknown coinId

### File Structure
```
tests/
  unit/
    portfolio.utils.test.js
    auth.utils.test.js
  integration/
    auth.test.js
    portfolio.test.js
    watchlist.test.js
utils/
  portfolio.js    ← extracted from routes/portfolio.js
```

### New packages (dev)
```
jest  supertest
```

---

## Layer 4: Logging + Monitoring

**Objective:** Replace console.log with structured logging and add real-time error tracking.

### Winston

New file: `config/logger.js` — exports a Winston logger instance.

Log levels:
- `info` — server start, cache hits, successful auth, successful DB operations
- `warn` — rate limit triggered, failed login attempt, stale cache served, CoinGecko API slow
- `error` — Supabase query failures, CoinGecko API errors, unhandled exceptions

Transports:
- Development: coloured, human-readable console output
- Production (`NODE_ENV=production`): JSON console output (parseable by Vercel log viewer and Sentry)

Replace all `console.log` / `console.error` calls across `app.js`, `routes/`, and `config/` with `logger.info` / `logger.warn` / `logger.error`.

### Sentry

- `Sentry.init()` in `app.js` using `SENTRY_DSN` from environment variables
- `Sentry.setupExpressErrorHandler(app)` after all routes — automatically captures every unhandled error
- Captured context per error: request URL, method, user ID (from session), full stack trace
- Production dashboard at `sentry.io` shows live error stream — shareable with recruiters

### New packages
```
winston  @sentry/node  @sentry/profiling-node
```

### New file
```
config/logger.js
```

---

## Layer 5: CI/CD + Vercel Deployment

**Objective:** Automate testing and deployment via GitHub Actions; make the app production-ready on Vercel.

### GitHub Actions Pipeline

File: `.github/workflows/ci-cd.yml`

```
Push to any branch
  └─ [test job]
       ├─ checkout code
       ├─ install dependencies (npm ci)
       ├─ run Jest (npm test)
       └─ if branch = main AND tests pass:
            └─ [deploy job]
                 └─ deploy to Vercel production
```

Environment variables for the test job come from GitHub Secrets:
- `TEST_SUPABASE_URL` (test project URL — mapped to `SUPABASE_URL` in the job)
- `TEST_SUPABASE_ANON_KEY` (test project key — mapped to `SUPABASE_ANON_KEY`)
- `TEST_DATABASE_URL` (test project PostgreSQL connection string — mapped to `DATABASE_URL`)
- `SESSION_SECRET`
- `SENTRY_DSN`

### Vercel Configuration

Update `vercel.json`:
- Route all requests to `app.js` as a serverless function
- Node.js runtime: 20.x
- Build command: `npm ci`

Environment variables in Vercel dashboard (production runtime):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `SESSION_SECRET`
- `SENTRY_DSN`
- `NODE_ENV=production`

### GitHub Secrets Required
```
# Production (used by Vercel deploy job)
SUPABASE_URL
SUPABASE_ANON_KEY
DATABASE_URL
SESSION_SECRET
SENTRY_DSN
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID

# Test (used by CI test job only — point to separate Supabase test project)
TEST_SUPABASE_URL
TEST_SUPABASE_ANON_KEY
TEST_DATABASE_URL
```

### New file
```
.github/workflows/ci-cd.yml
```

---

## New Files Summary

```
config/
  database.js         ← Supabase client
  logger.js           ← Winston logger

utils/
  portfolio.js        ← Extracted calculation helpers

tests/
  unit/
    portfolio.utils.test.js
    auth.utils.test.js
  integration/
    auth.test.js
    portfolio.test.js
    watchlist.test.js

docs/superpowers/specs/
  2026-06-16-industry-grade-upgrade-design.md

.github/workflows/
  ci-cd.yml
```

## Modified Files Summary

```
app.js                ← helmet, Sentry, session store, logger
routes/auth.js        ← bcrypt, express-validator, Supabase queries, logger
routes/portfolio.js   ← express-validator, Supabase queries, logger, extract utils
routes/api.js         ← logger
middleware/auth.js    ← logger
.env.example          ← new env vars
vercel.json           ← serverless config update
package.json          ← new dependencies
```

---

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Supabase (JS client — for data queries)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Supabase (direct PostgreSQL — for connect-pg-simple session store)
# Found in: Supabase dashboard → Project Settings → Database → Connection string (Transaction mode, port 6543)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Session
SESSION_SECRET=your-super-secret-key-here

# Sentry
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

---

## Interview Talking Points

Each layer maps directly to a common interview question:

| Question | Your Answer |
|---|---|
| "How do you handle passwords?" | bcrypt with 10 salt rounds, never store plaintext |
| "How do you secure an Express app?" | helmet for HTTP headers, rate limiting on auth routes, express-validator on all inputs |
| "What database have you used?" | PostgreSQL via Supabase — relational schema with foreign keys and ON DELETE CASCADE |
| "How do you debug production issues?" | Winston structured logging + Sentry error dashboard with full request context |
| "Do you write tests?" | Jest unit tests for business logic, Supertest integration tests for all API routes against a real test DB |
| "How do you deploy?" | GitHub Actions CI/CD — tests gate every merge to main, passing tests auto-deploy to Vercel |
