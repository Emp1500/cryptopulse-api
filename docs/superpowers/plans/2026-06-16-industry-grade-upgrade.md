# CryptiPulse Industry-Grade Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade CryptiPulse from a UI-complete mock-data prototype to a production-ready application with Supabase PostgreSQL, security hardening, Jest testing, Winston + Sentry observability, and a GitHub Actions CI/CD pipeline deploying to Vercel.

**Architecture:** Five independent layers applied in sequence — each layer leaves the app fully functional and deployable. Layer 1 hardens the existing auth. Layer 2 replaces in-memory mock data with Supabase PostgreSQL. Layer 3 adds a test suite against a dedicated test database. Layer 4 adds structured logging and Sentry error monitoring. Layer 5 wires GitHub Actions to auto-deploy to Vercel on every passing merge to `main`.

**Tech Stack:** Node.js, Express 5, EJS, Supabase (PostgreSQL), bcryptjs, helmet, express-rate-limit, express-validator, connect-pg-simple, pg, Jest, Supertest, Winston, @sentry/node, GitHub Actions, Vercel

---

## File Map

### New files
```
config/database.js              ← Supabase JS client (singleton)
config/logger.js                ← Winston logger (singleton)
utils/portfolio.js              ← P/L and totals calculations (extracted from routes/portfolio.js)
tests/unit/portfolio.utils.test.js
tests/unit/auth.utils.test.js
tests/integration/auth.test.js
tests/integration/portfolio.test.js
tests/integration/watchlist.test.js
tests/helpers/db.js             ← test DB seed/cleanup helpers
jest.config.js
.github/workflows/ci-cd.yml
```

### Modified files
```
app.js                  ← helmet, Sentry, pg session store, logger, export app
routes/auth.js          ← bcrypt, express-validator, rate-limit, Supabase queries, logger
routes/portfolio.js     ← express-validator, Supabase queries, logger, delegate calcs to utils
routes/api.js           ← logger
middleware/auth.js      ← logger
.env.example            ← new env vars
vercel.json             ← serverless config
package.json            ← new dependencies
```

---

## Layer 1: Security Hardening

---

### Task 1: Install security packages

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
npm install bcryptjs helmet express-rate-limit express-validator
```

- [ ] **Step 2: Verify install**

```bash
npm ls bcryptjs helmet express-rate-limit express-validator
```

Expected: four packages listed with version numbers, no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install security packages (bcryptjs, helmet, rate-limit, validator)"
```

---

### Task 2: Add helmet to app.js

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add helmet require and middleware**

Open `app.js`. At the top with other requires, add:
```javascript
const helmet = require('helmet');
```

Then immediately after `const app = express();` and before any other `app.use()` calls, add:
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "fonts.gstatic.com", "cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "assets.coingecko.com", "coin-images.coingecko.com"],
      connectSrc: ["'self'"]
    }
  }
}));
```

- [ ] **Step 2: Test the app still runs**

```bash
npm run dev
```

Visit `http://localhost:3000`. The homepage should load with no console errors. If you see CSP errors in the browser console for a specific resource, add its domain to the appropriate directive above.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: add helmet security headers"
```

---

### Task 3: Add bcrypt to auth routes

**Files:**
- Modify: `routes/auth.js`

- [ ] **Step 1: Add bcrypt require**

At the top of `routes/auth.js`, add:
```javascript
const bcrypt = require('bcryptjs');
```

- [ ] **Step 2: Update register route to hash password**

Find the `POST /auth/register` handler. Replace this block:
```javascript
const newUser = {
  id: mockUsers.length + 1,
  name,
  email,
  password // In Phase 5, this will be hashed
};
mockUsers.push(newUser);
```

With:
```javascript
const passwordHash = await bcrypt.hash(password, 10);
const newUser = {
  id: mockUsers.length + 1,
  name,
  email,
  password: passwordHash
};
mockUsers.push(newUser);
```

Also change the function signature from `(req, res)` to `async (req, res)`:
```javascript
router.post('/register', async (req, res) => {
```

- [ ] **Step 3: Update login route to compare hash**

Find the `POST /auth/login` handler. Replace:
```javascript
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = mockUsers.find(u => u.email === email && u.password === password);

  if (user) {
```

With:
```javascript
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = mockUsers.find(u => u.email === email);
  const passwordMatch = user ? await bcrypt.compare(password, user.password) : false;

  if (user && passwordMatch) {
```

- [ ] **Step 4: Verify registration still works**

```bash
npm run dev
```

Go to `http://localhost:3000/auth/register`, register a new account (not the demo account — the demo user has a plaintext password which won't work now). Then log in with that new account. It should succeed.

- [ ] **Step 5: Commit**

```bash
git add routes/auth.js
git commit -m "feat: hash passwords with bcrypt on register, compare on login"
```

---

### Task 4: Add rate limiting to auth routes

**Files:**
- Modify: `routes/auth.js`

- [ ] **Step 1: Add rate limiter**

At the top of `routes/auth.js`, after existing requires, add:
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' }
});
```

- [ ] **Step 2: Apply limiter to login and register POST routes**

Find:
```javascript
router.post('/login', async (req, res) => {
```
Change to:
```javascript
router.post('/login', authLimiter, async (req, res) => {
```

Find:
```javascript
router.post('/register', async (req, res) => {
```
Change to:
```javascript
router.post('/register', authLimiter, async (req, res) => {
```

- [ ] **Step 3: Commit**

```bash
git add routes/auth.js
git commit -m "feat: add rate limiting (10 req/15min) to auth routes"
```

---

### Task 5: Add express-validator to auth routes

**Files:**
- Modify: `routes/auth.js`

- [ ] **Step 1: Add validator require**

At the top of `routes/auth.js`, add:
```javascript
const { body, validationResult } = require('express-validator');
```

- [ ] **Step 2: Define validation chains**

After the `authLimiter` definition, add:
```javascript
const loginValidation = [
  body('email').trim().normalizeEmail().isEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().normalizeEmail().isEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match');
    return true;
  })
];
```

- [ ] **Step 3: Apply validation to login route**

Replace the entire `POST /auth/login` handler:
```javascript
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/login', {
      error: errors.array()[0].msg,
      success: null
    });
  }

  const { email, password } = req.body;
  const user = mockUsers.find(u => u.email === email);
  const passwordMatch = user ? await bcrypt.compare(password, user.password) : false;

  if (user && passwordMatch) {
    req.session.user = { id: user.id, name: user.name, email: user.email };
    return res.redirect('/portfolio');
  }

  res.render('auth/login', {
    error: 'Invalid email or password',
    success: null
  });
});
```

- [ ] **Step 4: Apply validation to register route**

Replace the entire `POST /auth/register` handler:
```javascript
router.post('/register', authLimiter, registerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/register', { error: errors.array()[0].msg });
  }

  const { name, email, password } = req.body;

  const existingUser = mockUsers.find(u => u.email === email);
  if (existingUser) {
    return res.render('auth/register', { error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = { id: mockUsers.length + 1, name, email, password: passwordHash };
  mockUsers.push(newUser);

  res.redirect('/auth/login?registered=true');
});
```

- [ ] **Step 5: Add express-validator to portfolio holdings POST and PUT**

Open `routes/portfolio.js`. Add at the top:
```javascript
const { body, param, validationResult } = require('express-validator');
```

Add validation chains before the portfolio route handlers:
```javascript
const holdingValidation = [
  body('coinId').trim().notEmpty().withMessage('coinId is required'),
  body('symbol').trim().notEmpty().withMessage('symbol is required'),
  body('name').trim().notEmpty().withMessage('name is required'),
  body('quantity').isFloat({ gt: 0 }).withMessage('quantity must be a positive number'),
  body('purchasePrice').isFloat({ gt: 0 }).withMessage('purchasePrice must be a positive number')
];

const holdingUpdateValidation = [
  body('quantity').optional().isFloat({ gt: 0 }).withMessage('quantity must be a positive number'),
  body('purchasePrice').optional().isFloat({ gt: 0 }).withMessage('purchasePrice must be a positive number'),
  body('purchaseDate').optional().isISO8601().withMessage('purchaseDate must be a valid date')
];

const watchlistValidation = [
  body('coinId').trim().notEmpty().withMessage('coinId is required'),
  body('name').trim().notEmpty().withMessage('name is required'),
  body('symbol').trim().notEmpty().withMessage('symbol is required')
];
```

Apply `holdingValidation` to `POST /portfolio/holdings`:
```javascript
router.post('/holdings', isAuthenticated, holdingValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: errors.array()[0].msg });
  }
  // ... rest of handler unchanged
```

Apply `holdingUpdateValidation` to `PUT /portfolio/holdings/:id`:
```javascript
router.put('/holdings/:id', isAuthenticated, holdingUpdateValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: errors.array()[0].msg });
  }
  // ... rest of handler unchanged
```

Apply `watchlistValidation` to `POST /portfolio/watchlist`:
```javascript
router.post('/watchlist', isAuthenticated, watchlistValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: errors.array()[0].msg });
  }
  // ... rest of handler unchanged
```

- [ ] **Step 6: Verify the app still works end-to-end**

```bash
npm run dev
```

Register a new account, log in, add a holding via the portfolio dashboard. All three operations should succeed.

- [ ] **Step 7: Commit**

```bash
git add routes/auth.js routes/portfolio.js
git commit -m "feat: add express-validator to auth, portfolio, and watchlist routes"
```

---

## Layer 2: Supabase Integration

---

### Task 6: Set up Supabase projects and create schema

**Files:** None (external setup — Supabase dashboard)

You need **two** free Supabase projects: one for production, one for tests. Both are free tier.

- [ ] **Step 1: Create production Supabase project**

Go to `https://supabase.com` → New project. Name it `cryptipulse-prod`. Save the region closest to you.

- [ ] **Step 2: Create test Supabase project**

Same steps. Name it `cryptipulse-test`.

- [ ] **Step 3: Run schema SQL on BOTH projects**

In each project: go to SQL Editor → New query. Run this SQL:

```sql
-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio holdings
CREATE TABLE IF NOT EXISTS portfolio_holdings (
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
CREATE TABLE IF NOT EXISTS watchlist (
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

Expected: "Success. No rows returned."

- [ ] **Step 4: Disable Row Level Security on all three tables**

Still in SQL Editor of both projects, run:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings DISABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist DISABLE ROW LEVEL SECURITY;
```

This is safe because our Express middleware (`isAuthenticated`) enforces access control server-side. The service key never reaches the client.

- [ ] **Step 5: Collect credentials from both projects**

For each project go to: Project Settings → API.

From **prod** project, note down:
- `Project URL` → this is your `SUPABASE_URL`
- `anon public` key → this is your `SUPABASE_ANON_KEY`

Go to: Project Settings → Database → Connection string → Transaction mode (port 6543). Copy the URI → this is your `DATABASE_URL`.

Repeat for **test** project and label them `TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`, `TEST_DATABASE_URL`.

---

### Task 7: Install Supabase packages and update .env

**Files:**
- Modify: `package.json`, `.env`, `.env.example`

- [ ] **Step 1: Install packages**

```bash
npm install @supabase/supabase-js connect-pg-simple pg
```

- [ ] **Step 2: Update .env with your real credentials**

Open `.env` and replace/add:
```env
# Server
PORT=3000
NODE_ENV=development

# Supabase (JS client)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Supabase (direct PostgreSQL for sessions)
DATABASE_URL=postgresql://postgres.your-ref:your-password@aws-0-region.pooler.supabase.com:6543/postgres

# Session
SESSION_SECRET=change-this-to-a-long-random-string

# Sentry (leave blank for now, fill in Layer 4)
SENTRY_DSN=
```

- [ ] **Step 3: Update .env.example**

Replace contents of `.env.example` with:
```env
# Server
PORT=3000
NODE_ENV=development

# Supabase (JS client — get from Supabase dashboard → Project Settings → API)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key

# Supabase (PostgreSQL connection string for session store)
# Found at: Project Settings → Database → Connection string → Transaction mode (port 6543)
DATABASE_URL=postgresql://postgres.your-ref:your-password@aws-0-region.pooler.supabase.com:6543/postgres

# Session (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=your-secret-here

# Sentry (get DSN from sentry.io → Project → Settings → Client Keys)
SENTRY_DSN=
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: install supabase, pg, connect-pg-simple packages"
```

---

### Task 8: Create config/database.js

**Files:**
- Create: `config/database.js`

- [ ] **Step 1: Create the Supabase client file**

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = supabase;
```

- [ ] **Step 2: Verify the client connects**

Create a temporary test script (delete after verification):
```bash
node -e "
require('dotenv').config();
const supabase = require('./config/database');
supabase.from('users').select('count').then(({ data, error }) => {
  if (error) console.error('Connection failed:', error.message);
  else console.log('Supabase connected successfully');
});
"
```

Expected output: `Supabase connected successfully`

- [ ] **Step 3: Commit**

```bash
git add config/database.js
git commit -m "feat: add Supabase client singleton (config/database.js)"
```

---

### Task 9: Update session store to PostgreSQL

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Replace in-memory session store with connect-pg-simple**

Open `app.js`. Replace the session middleware block:

Old:
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));
```

New (add the requires at the top of app.js with other requires):
```javascript
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
```

And replace the session middleware with:
```javascript
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(session({
  store: new pgSession({
    pool: pgPool,
    tableName: 'sessions',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));
```

- [ ] **Step 2: Export app for testing**

At the bottom of `app.js`, replace:
```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

With:
```javascript
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
```

- [ ] **Step 3: Start the app and verify sessions persist**

```bash
npm run dev
```

Register and log in. Stop the server with Ctrl+C. Start again with `npm run dev`. Go to `http://localhost:3000/portfolio` — you should still be logged in (session survived the restart).

Also check your Supabase prod project → Table Editor → sessions. You should see a row.

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: persist sessions in Supabase PostgreSQL via connect-pg-simple"
```

---

### Task 10: Migrate auth routes to Supabase

**Files:**
- Modify: `routes/auth.js`

- [ ] **Step 1: Add Supabase import**

At the top of `routes/auth.js`, add:
```javascript
const supabase = require('../config/database');
```

- [ ] **Step 2: Remove mock users array**

Delete these lines entirely:
```javascript
// Mock users (will be replaced by database in Phase 5)
const mockUsers = [
  {
    id: 1,
    name: 'Demo User',
    email: 'demo@cryptopulse.com',
    password: 'demo123'
  }
];
```

- [ ] **Step 3: Rewrite POST /auth/register**

Replace the entire register POST handler:
```javascript
router.post('/register', authLimiter, registerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/register', { error: errors.array()[0].msg });
  }

  const { name, email, password } = req.body;

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    return res.render('auth/register', { error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { error } = await supabase
    .from('users')
    .insert([{ name, email, password_hash: passwordHash }]);

  if (error) {
    console.error('Register error:', error.message);
    return res.render('auth/register', { error: 'Registration failed. Please try again.' });
  }

  res.redirect('/auth/login?registered=true');
});
```

- [ ] **Step 4: Rewrite POST /auth/login**

Replace the entire login POST handler:
```javascript
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/login', { error: errors.array()[0].msg, success: null });
  }

  const { email, password } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    return res.render('auth/login', { error: 'Invalid email or password', success: null });
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    return res.render('auth/login', { error: 'Invalid email or password', success: null });
  }

  req.session.user = { id: user.id, name: user.name, email: user.email };
  res.redirect('/portfolio');
});
```

- [ ] **Step 5: Verify end-to-end auth works**

```bash
npm run dev
```

1. Go to `http://localhost:3000/auth/register` — register a new account.
2. Check Supabase dashboard → Table Editor → users — you should see your new user with a hashed `password_hash`.
3. Log in with those credentials — you should be redirected to `/portfolio`.
4. Log out and log back in — should still work.

- [ ] **Step 6: Commit**

```bash
git add routes/auth.js
git commit -m "feat: migrate auth routes to Supabase PostgreSQL"
```

---

### Task 11: Migrate portfolio routes to Supabase

**Files:**
- Modify: `routes/portfolio.js`

- [ ] **Step 1: Add Supabase import and remove mock data**

At the top of `routes/portfolio.js`, add:
```javascript
const supabase = require('../config/database');
```

Remove the entire mock data block (the `mockPortfolios` Map, `mockWatchlists` Map, and their initialization including the demo user seeded data, plus `getUserPortfolio` and `getUserWatchlist` helper functions).

- [ ] **Step 2: Rewrite GET /portfolio (dashboard)**

Replace the entire `GET /` handler:
```javascript
router.get('/', isAuthenticated, async (req, res) => {
  const userId = req.session.user.id;

  const { data: holdings, error } = await supabase
    .from('portfolio_holdings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Portfolio fetch error:', error.message);
    return res.status(500).send('Failed to load portfolio');
  }

  const coinIds = holdings.map(h => h.coin_id);
  const prices = await fetchCurrentPrices(coinIds);

  let totalValue = 0;
  let totalInvested = 0;

  const holdingsWithPrices = holdings.map(holding => {
    const currentPrice = prices[holding.coin_id]?.usd || holding.purchase_price;
    const priceChange24h = prices[holding.coin_id]?.usd_24h_change || 0;
    const currentValue = holding.quantity * currentPrice;
    const investedValue = holding.quantity * holding.purchase_price;
    const profitLoss = currentValue - investedValue;
    const profitLossPercent = ((currentPrice - holding.purchase_price) / holding.purchase_price) * 100;

    totalValue += currentValue;
    totalInvested += investedValue;

    return {
      ...holding,
      coinId: holding.coin_id,
      purchasePrice: holding.purchase_price,
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

  res.render('portfolio/dashboard', {
    holdings: holdingsWithPrices,
    totalValue,
    totalInvested,
    totalProfitLoss,
    totalProfitLossPercent
  });
});
```

- [ ] **Step 3: Rewrite GET /portfolio/holdings (JSON)**

```javascript
router.get('/holdings', isAuthenticated, async (req, res) => {
  const userId = req.session.user.id;

  const { data: holdings, error } = await supabase
    .from('portfolio_holdings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: 'Failed to fetch holdings' });

  const coinIds = holdings.map(h => h.coin_id);
  const prices = await fetchCurrentPrices(coinIds);

  const holdingsWithPrices = holdings.map(holding => {
    const currentPrice = prices[holding.coin_id]?.usd || holding.purchase_price;
    const priceChange24h = prices[holding.coin_id]?.usd_24h_change || 0;
    const currentValue = holding.quantity * currentPrice;
    const profitLossPercent = ((currentPrice - holding.purchase_price) / holding.purchase_price) * 100;
    return {
      ...holding,
      coinId: holding.coin_id,
      purchasePrice: holding.purchase_price,
      currentPrice,
      priceChange24h,
      currentValue,
      profitLossPercent
    };
  });

  res.json(holdingsWithPrices);
});
```

- [ ] **Step 4: Rewrite POST /portfolio/holdings**

```javascript
router.post('/holdings', isAuthenticated, holdingValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: errors.array()[0].msg });
  }

  const userId = req.session.user.id;
  const { coinId, symbol, name, image, quantity, purchasePrice, purchaseDate, notes } = req.body;

  const { data, error } = await supabase
    .from('portfolio_holdings')
    .insert([{
      user_id: userId,
      coin_id: coinId,
      symbol: symbol.toUpperCase(),
      name,
      image: image || '',
      quantity: parseFloat(quantity),
      purchase_price: parseFloat(purchasePrice),
      purchase_date: purchaseDate || new Date().toISOString().split('T')[0],
      notes: notes || ''
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to add holding' });

  res.json({ success: true, holding: data });
});
```

- [ ] **Step 5: Rewrite PUT /portfolio/holdings/:id**

```javascript
router.put('/holdings/:id', isAuthenticated, holdingUpdateValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: errors.array()[0].msg });
  }

  const userId = req.session.user.id;
  const holdingId = req.params.id;
  const { quantity, purchasePrice, purchaseDate, notes } = req.body;

  const updates = {};
  if (quantity !== undefined) updates.quantity = parseFloat(quantity);
  if (purchasePrice !== undefined) updates.purchase_price = parseFloat(purchasePrice);
  if (purchaseDate !== undefined) updates.purchase_date = purchaseDate;
  if (notes !== undefined) updates.notes = notes;

  const { data, error } = await supabase
    .from('portfolio_holdings')
    .update(updates)
    .eq('id', holdingId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Holding not found' });

  res.json({ success: true, holding: data });
});
```

- [ ] **Step 6: Rewrite DELETE /portfolio/holdings/:id**

```javascript
router.delete('/holdings/:id', isAuthenticated, async (req, res) => {
  const userId = req.session.user.id;
  const holdingId = req.params.id;

  const { data: existing } = await supabase
    .from('portfolio_holdings')
    .select('id')
    .eq('id', holdingId)
    .eq('user_id', userId)
    .single();

  if (!existing) return res.status(404).json({ error: 'Holding not found' });

  const { error } = await supabase
    .from('portfolio_holdings')
    .delete()
    .eq('id', holdingId)
    .eq('user_id', userId);

  if (error) return res.status(500).json({ error: 'Failed to delete holding' });

  res.json({ success: true });
});
```

- [ ] **Step 7: Verify portfolio CRUD works**

```bash
npm run dev
```

Log in, go to portfolio dashboard. Add a holding. Refresh the page — it should still be there (persisted in Supabase). Edit it. Delete it. Check Supabase Table Editor → portfolio_holdings to confirm rows are created/deleted.

- [ ] **Step 8: Commit**

```bash
git add routes/portfolio.js
git commit -m "feat: migrate portfolio holdings routes to Supabase PostgreSQL"
```

---

### Task 12: Migrate watchlist routes to Supabase

**Files:**
- Modify: `routes/portfolio.js`

- [ ] **Step 1: Rewrite GET /portfolio/watchlist**

```javascript
router.get('/watchlist', isAuthenticated, async (req, res) => {
  const userId = req.session.user.id;

  const { data: coins, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: true });

  if (error) return res.status(500).send('Failed to load watchlist');

  const coinIds = coins.map(c => c.coin_id);
  const coinDataMap = await fetchWatchlistData(coinIds);

  const watchlistWithData = coins.map(coin => {
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

  res.render('portfolio/watchlist', { watchlist: watchlistWithData });
});
```

- [ ] **Step 2: Rewrite GET /portfolio/watchlist/data**

```javascript
router.get('/watchlist/data', isAuthenticated, async (req, res) => {
  const userId = req.session.user.id;

  const { data: coins, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: true });

  if (error) return res.status(500).json({ error: 'Failed to fetch watchlist' });

  const coinIds = coins.map(c => c.coin_id);
  const coinDataMap = await fetchWatchlistData(coinIds);

  const watchlistWithData = coins.map(coin => {
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

  res.json(watchlistWithData);
});
```

- [ ] **Step 3: Rewrite POST /portfolio/watchlist**

```javascript
router.post('/watchlist', isAuthenticated, watchlistValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: errors.array()[0].msg });
  }

  const userId = req.session.user.id;
  const { coinId, name, symbol, image } = req.body;

  const { data, error } = await supabase
    .from('watchlist')
    .insert([{
      user_id: userId,
      coin_id: coinId,
      symbol: symbol.toUpperCase(),
      name,
      image: image || ''
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Coin already in watchlist' });
    }
    return res.status(500).json({ error: 'Failed to add to watchlist' });
  }

  res.json({ success: true, coin: data });
});
```

- [ ] **Step 4: Rewrite DELETE /portfolio/watchlist/:coinId**

```javascript
router.delete('/watchlist/:coinId', isAuthenticated, async (req, res) => {
  const userId = req.session.user.id;
  const coinId = req.params.coinId;

  const { data: existing } = await supabase
    .from('watchlist')
    .select('id')
    .eq('user_id', userId)
    .eq('coin_id', coinId)
    .single();

  if (!existing) return res.status(404).json({ error: 'Coin not found in watchlist' });

  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('coin_id', coinId);

  if (error) return res.status(500).json({ error: 'Failed to remove from watchlist' });

  res.json({ success: true });
});
```

- [ ] **Step 5: Verify watchlist CRUD works**

```bash
npm run dev
```

Go to watchlist page. Add a coin. Refresh — it should persist. Remove it. Confirm in Supabase Table Editor → watchlist.

- [ ] **Step 6: Commit**

```bash
git add routes/portfolio.js
git commit -m "feat: migrate watchlist routes to Supabase PostgreSQL"
```

---

## Layer 3: Testing

---

### Task 13: Set up Jest and extract portfolio utils

**Files:**
- Create: `jest.config.js`, `utils/portfolio.js`
- Modify: `package.json`, `routes/portfolio.js`

- [ ] **Step 1: Install Jest and Supertest**

```bash
npm install --save-dev jest supertest
```

- [ ] **Step 2: Create jest.config.js**

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 15000
};
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, update the scripts section:
```json
"scripts": {
  "start": "node app.js",
  "dev": "nodemon app.js",
  "test": "jest --forceExit",
  "test:watch": "jest --watch --forceExit",
  "build": "echo \"No build required\""
}
```

- [ ] **Step 4: Create utils/portfolio.js**

```javascript
function calculateProfitLoss(quantity, purchasePrice, currentPrice) {
  const currentValue = quantity * currentPrice;
  const investedValue = quantity * purchasePrice;
  const profitLoss = currentValue - investedValue;
  const profitLossPercent = purchasePrice > 0
    ? ((currentPrice - purchasePrice) / purchasePrice) * 100
    : 0;
  return { currentValue, investedValue, profitLoss, profitLossPercent };
}

function calculatePortfolioTotals(holdings) {
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.investedValue, 0);
  const totalProfitLoss = totalValue - totalInvested;
  const totalProfitLossPercent = totalInvested > 0
    ? (totalProfitLoss / totalInvested) * 100
    : 0;
  return { totalValue, totalInvested, totalProfitLoss, totalProfitLossPercent };
}

function calculateAllocation(holdings, totalValue) {
  return holdings.map(h => ({
    ...h,
    allocationPercent: totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0
  }));
}

module.exports = { calculateProfitLoss, calculatePortfolioTotals, calculateAllocation };
```

- [ ] **Step 5: Verify Jest is configured**

```bash
npx jest --listTests
```

Expected: no output yet (no test files exist), exits cleanly with code 0.

- [ ] **Step 6: Commit**

```bash
git add jest.config.js utils/portfolio.js package.json package-lock.json
git commit -m "feat: add Jest config and extract portfolio calculation utils"
```

---

### Task 14: Unit tests for portfolio utils

**Files:**
- Create: `tests/unit/portfolio.utils.test.js`

- [ ] **Step 1: Create test directory**

```bash
mkdir -p tests/unit tests/integration
```

- [ ] **Step 2: Write the failing tests**

Create `tests/unit/portfolio.utils.test.js`:

```javascript
const {
  calculateProfitLoss,
  calculatePortfolioTotals,
  calculateAllocation
} = require('../../utils/portfolio');

describe('calculateProfitLoss', () => {
  test('returns correct values when in profit', () => {
    const result = calculateProfitLoss(2, 1000, 1500);
    expect(result.currentValue).toBe(3000);
    expect(result.investedValue).toBe(2000);
    expect(result.profitLoss).toBe(1000);
    expect(result.profitLossPercent).toBeCloseTo(50);
  });

  test('returns negative values when at a loss', () => {
    const result = calculateProfitLoss(1, 500, 400);
    expect(result.profitLoss).toBe(-100);
    expect(result.profitLossPercent).toBeCloseTo(-20);
  });

  test('returns zero P/L when price unchanged', () => {
    const result = calculateProfitLoss(5, 200, 200);
    expect(result.profitLoss).toBe(0);
    expect(result.profitLossPercent).toBe(0);
  });

  test('returns zero profitLossPercent when purchasePrice is 0', () => {
    const result = calculateProfitLoss(1, 0, 100);
    expect(result.profitLossPercent).toBe(0);
  });
});

describe('calculatePortfolioTotals', () => {
  const holdings = [
    { currentValue: 3000, investedValue: 2000 },
    { currentValue: 500, investedValue: 600 }
  ];

  test('sums totalValue correctly', () => {
    const result = calculatePortfolioTotals(holdings);
    expect(result.totalValue).toBe(3500);
  });

  test('sums totalInvested correctly', () => {
    const result = calculatePortfolioTotals(holdings);
    expect(result.totalInvested).toBe(2600);
  });

  test('calculates totalProfitLoss correctly', () => {
    const result = calculatePortfolioTotals(holdings);
    expect(result.totalProfitLoss).toBeCloseTo(900);
  });

  test('calculates totalProfitLossPercent correctly', () => {
    const result = calculatePortfolioTotals(holdings);
    expect(result.totalProfitLossPercent).toBeCloseTo(34.62, 1);
  });

  test('returns zero percent when totalInvested is 0', () => {
    const result = calculatePortfolioTotals([]);
    expect(result.totalProfitLossPercent).toBe(0);
  });
});

describe('calculateAllocation', () => {
  const holdings = [
    { currentValue: 750 },
    { currentValue: 250 }
  ];

  test('calculates allocation percentages', () => {
    const result = calculateAllocation(holdings, 1000);
    expect(result[0].allocationPercent).toBeCloseTo(75);
    expect(result[1].allocationPercent).toBeCloseTo(25);
  });

  test('returns 0 allocation when totalValue is 0', () => {
    const result = calculateAllocation(holdings, 0);
    expect(result[0].allocationPercent).toBe(0);
  });
});
```

- [ ] **Step 3: Run tests — expect them to pass (these are pure functions)**

```bash
npx jest tests/unit/portfolio.utils.test.js --verbose
```

Expected: All tests PASS. `utils/portfolio.js` already implements the functions correctly.

- [ ] **Step 4: Commit**

```bash
git add tests/unit/portfolio.utils.test.js
git commit -m "test: add unit tests for portfolio calculation utils"
```

---

### Task 15: Unit tests for bcrypt auth helpers

**Files:**
- Create: `tests/unit/auth.utils.test.js`

- [ ] **Step 1: Write the tests**

Create `tests/unit/auth.utils.test.js`:

```javascript
const bcrypt = require('bcryptjs');

describe('bcrypt password helpers', () => {
  const SALT_ROUNDS = 10;

  test('hashed password differs from plaintext', async () => {
    const plain = 'mypassword123';
    const hash = await bcrypt.hash(plain, SALT_ROUNDS);
    expect(hash).not.toBe(plain);
  });

  test('correct password compares successfully', async () => {
    const plain = 'correctpassword';
    const hash = await bcrypt.hash(plain, SALT_ROUNDS);
    const match = await bcrypt.compare(plain, hash);
    expect(match).toBe(true);
  });

  test('wrong password fails comparison', async () => {
    const hash = await bcrypt.hash('correctpassword', SALT_ROUNDS);
    const match = await bcrypt.compare('wrongpassword', hash);
    expect(match).toBe(false);
  });

  test('each hash is unique (salted)', async () => {
    const plain = 'samepassword';
    const hash1 = await bcrypt.hash(plain, SALT_ROUNDS);
    const hash2 = await bcrypt.hash(plain, SALT_ROUNDS);
    expect(hash1).not.toBe(hash2);
    expect(await bcrypt.compare(plain, hash1)).toBe(true);
    expect(await bcrypt.compare(plain, hash2)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npx jest tests/unit/auth.utils.test.js --verbose
```

Expected: All 4 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/unit/auth.utils.test.js
git commit -m "test: add unit tests for bcrypt password helpers"
```

---

### Task 16: Create test database helpers and integration test setup

**Files:**
- Create: `tests/helpers/db.js`

- [ ] **Step 1: Create test helper file**

Create `tests/helpers/db.js`:

```javascript
require('dotenv').config();
const supabase = require('../../config/database');
const bcrypt = require('bcryptjs');

async function createTestUser(overrides = {}) {
  const defaults = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'password123'
  };
  const user = { ...defaults, ...overrides };
  const passwordHash = await bcrypt.hash(user.password, 10);

  const { data, error } = await supabase
    .from('users')
    .insert([{ name: user.name, email: user.email, password_hash: passwordHash }])
    .select()
    .single();

  if (error) throw new Error(`createTestUser failed: ${error.message}`);
  return { ...data, plainPassword: user.password };
}

async function deleteTestUser(userId) {
  await supabase.from('users').delete().eq('id', userId);
}

async function cleanTestUsers() {
  await supabase.from('users').delete().like('email', 'test-%@example.com');
}

async function createTestHolding(userId, overrides = {}) {
  const defaults = {
    user_id: userId,
    coin_id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    image: '',
    quantity: 0.5,
    purchase_price: 40000,
    purchase_date: '2024-01-01',
    notes: ''
  };
  const holding = { ...defaults, ...overrides };

  const { data, error } = await supabase
    .from('portfolio_holdings')
    .insert([holding])
    .select()
    .single();

  if (error) throw new Error(`createTestHolding failed: ${error.message}`);
  return data;
}

async function createTestWatchlistCoin(userId, overrides = {}) {
  const defaults = {
    user_id: userId,
    coin_id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    image: ''
  };
  const coin = { ...defaults, ...overrides };

  const { data, error } = await supabase
    .from('watchlist')
    .insert([coin])
    .select()
    .single();

  if (error) throw new Error(`createTestWatchlistCoin failed: ${error.message}`);
  return data;
}

module.exports = {
  createTestUser,
  deleteTestUser,
  cleanTestUsers,
  createTestHolding,
  createTestWatchlistCoin
};
```

- [ ] **Step 2: Verify the helper connects to your test Supabase**

Add `TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`, and `TEST_DATABASE_URL` to your `.env` file temporarily (pointing to your test project). Then run:

```bash
node -e "
require('dotenv').config();
// Temporarily swap to test credentials to verify
const { createTestUser, cleanTestUsers } = require('./tests/helpers/db');
createTestUser().then(u => {
  console.log('Created test user:', u.email);
  return cleanTestUsers();
}).then(() => console.log('Cleanup done')).catch(console.error);
"
```

Expected: prints the test user email, then "Cleanup done".

> Note: For running tests, set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `DATABASE_URL` env vars to your TEST project credentials. In CI, these come from GitHub Secrets (`TEST_SUPABASE_URL` etc. mapped to the standard names). Locally, you can swap them in `.env` while running tests, or use a `.env.test` file loaded via `NODE_ENV=test` and a `dotenv` config.

- [ ] **Step 3: Commit**

```bash
git add tests/helpers/db.js
git commit -m "test: add test database helpers for seeding and cleanup"
```

---

### Task 17: Integration tests for auth routes

**Files:**
- Create: `tests/integration/auth.test.js`

- [ ] **Step 1: Write auth integration tests**

Create `tests/integration/auth.test.js`:

```javascript
require('dotenv').config();
const request = require('supertest');
const app = require('../../app');
const { createTestUser, cleanTestUsers } = require('../helpers/db');

afterEach(async () => {
  await cleanTestUsers();
});

describe('GET /auth/login', () => {
  test('renders login page', async () => {
    const res = await request(app).get('/auth/login');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Login');
  });
});

describe('GET /auth/register', () => {
  test('renders register page', async () => {
    const res = await request(app).get('/auth/register');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Register');
  });
});

describe('POST /auth/register', () => {
  test('registers a new user and redirects to login', async () => {
    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({
        name: 'Test User',
        email: 'test-register@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/auth/login?registered=true');
  });

  test('rejects duplicate email', async () => {
    await createTestUser({ email: 'test-dup@example.com' });
    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({
        name: 'Dup User',
        email: 'test-dup@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
    expect(res.status).toBe(200);
    expect(res.text).toContain('already registered');
  });

  test('rejects mismatched passwords', async () => {
    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({
        name: 'Test',
        email: 'test-mismatch@example.com',
        password: 'password123',
        confirmPassword: 'different'
      });
    expect(res.status).toBe(200);
    expect(res.text).toContain('Passwords do not match');
  });

  test('rejects missing name', async () => {
    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({
        name: '',
        email: 'test-noname@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
    expect(res.status).toBe(200);
    expect(res.text).toContain('required');
  });
});

describe('POST /auth/login', () => {
  test('logs in with valid credentials and redirects to portfolio', async () => {
    const user = await createTestUser({ email: 'test-login@example.com', password: 'password123' });
    const res = await request(app)
      .post('/auth/login')
      .type('form')
      .send({ email: user.email, password: 'password123' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/portfolio');
  });

  test('rejects wrong password', async () => {
    const user = await createTestUser({ email: 'test-wrongpw@example.com', password: 'password123' });
    const res = await request(app)
      .post('/auth/login')
      .type('form')
      .send({ email: user.email, password: 'wrongpassword' });
    expect(res.status).toBe(200);
    expect(res.text).toContain('Invalid email or password');
  });

  test('rejects unknown email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .type('form')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.text).toContain('Invalid email or password');
  });
});

describe('POST /auth/logout', () => {
  test('destroys session and redirects to home', async () => {
    const agent = request.agent(app);
    const user = await createTestUser({ email: 'test-logout@example.com', password: 'password123' });
    await agent.post('/auth/login').type('form').send({ email: user.email, password: 'password123' });

    const res = await agent.post('/auth/logout');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');

    const portfolioRes = await agent.get('/portfolio');
    expect(portfolioRes.status).toBe(302);
    expect(portfolioRes.headers.location).toContain('/auth/login');
  });
});
```

- [ ] **Step 2: Run auth tests**

```bash
npx jest tests/integration/auth.test.js --verbose
```

Expected: All tests PASS. Fix any failures before proceeding.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/auth.test.js
git commit -m "test: add integration tests for auth routes"
```

---

### Task 18: Integration tests for portfolio routes

**Files:**
- Create: `tests/integration/portfolio.test.js`

- [ ] **Step 1: Write portfolio integration tests**

Create `tests/integration/portfolio.test.js`:

```javascript
require('dotenv').config();
const request = require('supertest');
const app = require('../../app');
const { createTestUser, cleanTestUsers, createTestHolding } = require('../helpers/db');
const supabase = require('../../config/database');

let agent;
let testUser;

beforeEach(async () => {
  testUser = await createTestUser({ email: 'test-portfolio@example.com', password: 'password123' });
  agent = request.agent(app);
  await agent.post('/auth/login').type('form').send({ email: testUser.email, password: 'password123' });
});

afterEach(async () => {
  await supabase.from('portfolio_holdings').delete().eq('user_id', testUser.id);
  await cleanTestUsers();
});

describe('GET /portfolio', () => {
  test('redirects unauthenticated users to login', async () => {
    const res = await request(app).get('/portfolio');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/auth/login');
  });

  test('returns 200 for authenticated users', async () => {
    const res = await agent.get('/portfolio');
    expect(res.status).toBe(200);
  });
});

describe('POST /portfolio/holdings', () => {
  test('adds a valid holding', async () => {
    const res = await agent
      .post('/portfolio/holdings')
      .type('json')
      .send({
        coinId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 0.5,
        purchasePrice: 40000,
        purchaseDate: '2024-01-01'
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.holding.coin_id).toBe('bitcoin');
  });

  test('rejects zero quantity', async () => {
    const res = await agent
      .post('/portfolio/holdings')
      .type('json')
      .send({
        coinId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 0,
        purchasePrice: 40000
      });
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/positive number/i);
  });

  test('rejects missing coinId', async () => {
    const res = await agent
      .post('/portfolio/holdings')
      .type('json')
      .send({ symbol: 'BTC', name: 'Bitcoin', quantity: 1, purchasePrice: 40000 });
    expect(res.status).toBe(422);
  });
});

describe('PUT /portfolio/holdings/:id', () => {
  test('updates an existing holding', async () => {
    const holding = await createTestHolding(testUser.id);
    const res = await agent
      .put(`/portfolio/holdings/${holding.id}`)
      .type('json')
      .send({ quantity: 1.5 });
    expect(res.status).toBe(200);
    expect(res.body.holding.quantity).toBe('1.50000000');
  });

  test('returns 404 for unknown holding id', async () => {
    const res = await agent
      .put('/portfolio/holdings/00000000-0000-0000-0000-000000000000')
      .type('json')
      .send({ quantity: 1 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /portfolio/holdings/:id', () => {
  test('deletes an existing holding', async () => {
    const holding = await createTestHolding(testUser.id);
    const res = await agent.delete(`/portfolio/holdings/${holding.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('returns 404 for unknown holding id', async () => {
    const res = await agent.delete('/portfolio/holdings/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run portfolio tests**

```bash
npx jest tests/integration/portfolio.test.js --verbose
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/portfolio.test.js
git commit -m "test: add integration tests for portfolio routes"
```

---

### Task 19: Integration tests for watchlist routes

**Files:**
- Create: `tests/integration/watchlist.test.js`

- [ ] **Step 1: Write watchlist integration tests**

Create `tests/integration/watchlist.test.js`:

```javascript
require('dotenv').config();
const request = require('supertest');
const app = require('../../app');
const { createTestUser, cleanTestUsers, createTestWatchlistCoin } = require('../helpers/db');
const supabase = require('../../config/database');

let agent;
let testUser;

beforeEach(async () => {
  testUser = await createTestUser({ email: 'test-watchlist@example.com', password: 'password123' });
  agent = request.agent(app);
  await agent.post('/auth/login').type('form').send({ email: testUser.email, password: 'password123' });
});

afterEach(async () => {
  await supabase.from('watchlist').delete().eq('user_id', testUser.id);
  await cleanTestUsers();
});

describe('POST /portfolio/watchlist', () => {
  test('adds a coin to watchlist', async () => {
    const res = await agent
      .post('/portfolio/watchlist')
      .type('json')
      .send({ coinId: 'ethereum', symbol: 'ETH', name: 'Ethereum' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.coin.coin_id).toBe('ethereum');
  });

  test('rejects duplicate coin', async () => {
    await createTestWatchlistCoin(testUser.id, { coin_id: 'ethereum', symbol: 'ETH', name: 'Ethereum' });
    const res = await agent
      .post('/portfolio/watchlist')
      .type('json')
      .send({ coinId: 'ethereum', symbol: 'ETH', name: 'Ethereum' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('already in watchlist');
  });

  test('rejects missing coinId', async () => {
    const res = await agent
      .post('/portfolio/watchlist')
      .type('json')
      .send({ symbol: 'ETH', name: 'Ethereum' });
    expect(res.status).toBe(422);
  });
});

describe('DELETE /portfolio/watchlist/:coinId', () => {
  test('removes a coin from watchlist', async () => {
    await createTestWatchlistCoin(testUser.id, { coin_id: 'solana', symbol: 'SOL', name: 'Solana' });
    const res = await agent.delete('/portfolio/watchlist/solana');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('returns 404 for coin not in watchlist', async () => {
    const res = await agent.delete('/portfolio/watchlist/nonexistent-coin');
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: All unit and integration tests PASS with no failures.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/watchlist.test.js
git commit -m "test: add integration tests for watchlist routes"
```

---

## Layer 4: Logging + Monitoring

---

### Task 20: Create Winston logger

**Files:**
- Create: `config/logger.js`

- [ ] **Step 1: Install Winston**

```bash
npm install winston
```

- [ ] **Step 2: Create config/logger.js**

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: process.env.NODE_ENV === 'production'
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) =>
          `${timestamp} ${level}: ${message}`
        )
      ),
  transports: [new winston.transports.Console()]
});

module.exports = logger;
```

- [ ] **Step 3: Replace console.log in app.js**

Add at the top of `app.js`:
```javascript
const logger = require('./config/logger');
```

Replace:
```javascript
console.log('Serving data from cache');
```
with:
```javascript
logger.info('Serving homepage data from cache');
```

Replace:
```javascript
console.log('Fetching new data from CoinGecko API');
```
with:
```javascript
logger.info('Fetching fresh homepage data from CoinGecko API');
```

Replace:
```javascript
console.error('Error fetching data for homepage:', error.message);
```
with:
```javascript
logger.error(`Homepage CoinGecko fetch failed: ${error.message}`);
```

Replace:
```javascript
console.log('API error: serving stale data from cache');
```
with:
```javascript
logger.warn('CoinGecko API error — serving stale cache for homepage');
```

In the server start (inside `if (require.main === module)`), replace:
```javascript
console.log(`Server running at http://localhost:${PORT}`);
```
with:
```javascript
logger.info(`Server running at http://localhost:${PORT}`);
```

- [ ] **Step 4: Replace console.log in routes/auth.js**

Add at the top:
```javascript
const logger = require('../config/logger');
```

Replace:
```javascript
console.error('Register error:', error.message);
```
with:
```javascript
logger.error(`Registration DB error: ${error.message}`);
```

- [ ] **Step 5: Replace console.log in routes/portfolio.js**

Add at the top:
```javascript
const logger = require('../config/logger');
```

Replace all `console.error('Portfolio fetch error:', ...)`, `console.error('Error fetching prices:', ...)`, and `console.error('Error fetching watchlist data:', ...)` with appropriate `logger.error(...)` calls.

Replace `console.error('Portfolio fetch error:', error.message)` → `logger.error(\`Portfolio holdings fetch failed: ${error.message}\`)`

Replace `console.error('Error fetching prices:', error.message)` → `logger.warn(\`CoinGecko price fetch failed: ${error.message}\`)`

Replace `console.error('Error fetching watchlist data:', error.message)` → `logger.warn(\`CoinGecko watchlist data fetch failed: ${error.message}\`)`

- [ ] **Step 6: Replace console.log in routes/api.js**

Add at the top:
```javascript
const logger = require('../config/logger');
```

Replace:
```javascript
console.log('Serving markets data from cache');
```
with:
```javascript
logger.info('Serving markets data from cache');
```

Replace:
```javascript
console.log('Fetching new markets data from CoinGecko API');
```
with:
```javascript
logger.info('Fetching fresh markets data from CoinGecko API');
```

Replace all `console.error(...)` calls with `logger.error(...)`.

Replace `console.log('Fetching coin list from CoinGecko')` with `logger.info('Fetching coin list from CoinGecko')`.

- [ ] **Step 7: Verify logging works**

```bash
npm run dev
```

Visit `http://localhost:3000`. You should see coloured, timestamped log output in the terminal instead of plain `console.log` output.

- [ ] **Step 8: Commit**

```bash
git add config/logger.js app.js routes/auth.js routes/portfolio.js routes/api.js package.json package-lock.json
git commit -m "feat: replace console.log with Winston structured logger"
```

---

### Task 21: Set up Sentry error monitoring

**Files:**
- Modify: `app.js`, `.env`, `.env.example`

- [ ] **Step 1: Install Sentry**

```bash
npm install @sentry/node
```

- [ ] **Step 2: Create a Sentry account and project**

Go to `https://sentry.io` → Create account → New Project → Node.js. Copy the DSN (looks like `https://abc123@o123.ingest.sentry.io/456`).

- [ ] **Step 3: Add DSN to .env**

```env
SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
```

- [ ] **Step 4: Initialise Sentry in app.js**

At the very top of `app.js` (before any other requires):
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0
});
```

After all routes are registered (just before `module.exports = app`), add:
```javascript
Sentry.setupExpressErrorHandler(app);
```

- [ ] **Step 5: Verify Sentry captures errors**

Add this temporary test route to `app.js` (remove after verification):
```javascript
app.get('/debug-sentry', () => {
  throw new Error('Sentry test error from CryptiPulse');
});
```

Start the server, visit `http://localhost:3000/debug-sentry`, then go to your Sentry dashboard → Issues. You should see the error appear within ~30 seconds. Once confirmed, remove the test route.

- [ ] **Step 6: Commit**

```bash
git add app.js .env.example package.json package-lock.json
git commit -m "feat: integrate Sentry error monitoring"
```

---

## Layer 5: CI/CD + Vercel Deployment

---

### Task 22: Update vercel.json for serverless

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Update vercel.json**

Replace the entire contents of `vercel.json` with:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app.js"
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "chore: update vercel.json for serverless Node.js deployment"
```

---

### Task 23: Create GitHub Actions CI/CD workflow

**Files:**
- Create: `.github/workflows/ci-cd.yml`

- [ ] **Step 1: Create workflow directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create the workflow file**

Create `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
        env:
          NODE_ENV: test
          SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          SESSION_SECRET: ci-test-secret-key-not-for-production
          SENTRY_DSN: ''

  deploy:
    name: Deploy to Vercel
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/ci-cd.yml
git commit -m "ci: add GitHub Actions pipeline (test on push, deploy to Vercel on main)"
git push origin main
```

- [ ] **Step 4: Verify the Actions run on GitHub**

Go to your GitHub repository → Actions tab. You should see the workflow running. The test job runs first; if it passes and the push was to `main`, the deploy job runs next.

---

### Task 24: Set up GitHub Secrets and deploy to Vercel

**Files:** None (external setup)

- [ ] **Step 1: Add GitHub Secrets**

Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret. Add each of these:

| Secret Name | Value |
|---|---|
| `TEST_SUPABASE_URL` | URL of your cryptipulse-test Supabase project |
| `TEST_SUPABASE_ANON_KEY` | Anon key of your cryptipulse-test project |
| `TEST_DATABASE_URL` | PostgreSQL connection string of your cryptipulse-test project |
| `SESSION_SECRET` | A long random string (run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `SENTRY_DSN` | Your Sentry DSN |

- [ ] **Step 2: Install Vercel CLI and link project**

```bash
npm install -g vercel
vercel login
vercel link
```

Follow the prompts. This creates `.vercel/project.json` with your `orgId` and `projectId`.

- [ ] **Step 3: Get Vercel token**

Go to `https://vercel.com/account/tokens` → Create token named `github-actions`. Copy it.

- [ ] **Step 4: Add Vercel secrets to GitHub**

Add three more GitHub Secrets:

| Secret Name | Value |
|---|---|
| `VERCEL_TOKEN` | The token from Step 3 |
| `VERCEL_ORG_ID` | Value of `orgId` from `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Value of `projectId` from `.vercel/project.json` |

- [ ] **Step 5: Set environment variables in Vercel dashboard**

Go to `https://vercel.com` → your project → Settings → Environment Variables. Add:

| Name | Value | Environment |
|---|---|---|
| `SUPABASE_URL` | prod project URL | Production |
| `SUPABASE_ANON_KEY` | prod project anon key | Production |
| `DATABASE_URL` | prod PostgreSQL connection string | Production |
| `SESSION_SECRET` | same long random string as GitHub secret | Production |
| `SENTRY_DSN` | your Sentry DSN | Production |
| `NODE_ENV` | `production` | Production |

- [ ] **Step 6: Trigger a production deploy**

```bash
git commit --allow-empty -m "ci: trigger initial production deployment"
git push origin main
```

Go to GitHub → Actions. Watch the test job pass, then the deploy job run. When it completes, go to Vercel dashboard — your app should have a production URL (e.g. `https://cryptipulse.vercel.app`).

- [ ] **Step 7: Smoke test production**

Visit your Vercel URL. Register an account. Log in. Add a portfolio holding. Refresh — it should persist. Check Sentry dashboard for any errors.

- [ ] **Step 8: Final commit**

```bash
git add .vercel/
git commit -m "chore: add Vercel project config"
git push origin main
```

---

## Final Verification

Run the full test suite one last time to confirm everything is green:

```bash
npm test
```

Expected output:
```
PASS tests/unit/portfolio.utils.test.js
PASS tests/unit/auth.utils.test.js
PASS tests/integration/auth.test.js
PASS tests/integration/portfolio.test.js
PASS tests/integration/watchlist.test.js

Test Suites: 5 passed, 5 total
Tests:       XX passed, XX total
```

Your app is now:
- Secured with bcrypt, helmet, rate limiting, and input validation
- Persisting all data in Supabase PostgreSQL
- Tested with unit and integration tests
- Logging structured JSON in production via Winston
- Sending live error reports to Sentry
- Auto-deploying to Vercel on every passing merge to `main`
