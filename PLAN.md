# CryptoPulse Portfolio Management Feature

## Overview

Add user authentication and portfolio management capabilities to CryptoPulse, allowing users to track their cryptocurrency investments, analyze performance, and make informed investment decisions.

**Approach:** Build UI/Frontend first with mock data, then integrate database at the end.

---

## Table of Contents

1. [Feature Summary](#feature-summary)
2. [Implementation Phases](#implementation-phases)
3. [Phase Details](#phase-details)
4. [File Structure](#file-structure)
5. [Database Schema (Phase 5)](#database-schema-phase-5)

---

## Feature Summary

| Feature | Description |
|---------|-------------|
| **User Registration** | Create account with email/password |
| **User Login** | Secure authentication with sessions |
| **Portfolio Dashboard** | View all holdings, total value, profit/loss |
| **Add Holdings** | Add coins with purchase price, quantity, date |
| **Edit/Delete Holdings** | Modify or remove existing holdings |
| **Portfolio Analytics** | Charts, allocation breakdown, performance metrics |
| **Watchlist** | Track coins without owning them |

---

## Implementation Phases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        IMPLEMENTATION ROADMAP                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PHASE 1          PHASE 2          PHASE 3          PHASE 4          PHASE 5│
│  ────────         ────────         ────────         ────────         ────────│
│                                                                              │
│  ┌───────┐       ┌───────┐       ┌───────┐       ┌───────┐       ┌───────┐ │
│  │ Auth  │──────▶│ Port- │──────▶│ Anal- │──────▶│ Watch │──────▶│  DB   │ │
│  │  UI   │       │ folio │       │ ytics │       │ list  │       │ Integ │ │
│  │       │       │  UI   │       │  UI   │       │  UI   │       │       │ │
│  └───────┘       └───────┘       └───────┘       └───────┘       └───────┘ │
│                                                                              │
│  • Login page    • Dashboard     • Pie chart     • Watchlist    • MongoDB   │
│  • Register      • Add holding   • Line chart    • Price alerts • User model│
│  • Mock auth     • Holdings      • Metrics       • Mock data    • Portfolio │
│  • Sessions      • Edit/Delete   • Summary       • UI complete  • Migrate   │
│                  • Mock data     • Mock data                    • Go live   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase Details

---

## Phase 1: Authentication UI

**Goal:** Create login/register pages with mock authentication (no database yet)

### Tasks

- [ ] Create `/views/auth/login.ejs` - Login page
- [ ] Create `/views/auth/register.ejs` - Registration page
- [ ] Create `/public/css/auth.css` - Auth page styling
- [ ] Create `/routes/auth.js` - Auth routes
- [ ] Implement mock authentication (hardcoded user or localStorage)
- [ ] Set up express-session for session management
- [ ] Update header navigation (show Login/Logout based on session)
- [ ] Create user dropdown menu when logged in

### New Files
```
├── routes/auth.js
├── views/auth/
│   ├── login.ejs
│   └── register.ejs
├── public/css/auth.css
└── public/js/auth.js
```

### Login Page Design
```
┌────────────────────────────────────────────────────────┐
│                      CryptoPulse                        │
├────────────────────────────────────────────────────────┤
│                                                         │
│                   Welcome Back                          │
│                                                         │
│              ┌─────────────────────────┐               │
│              │  📧 Email               │               │
│              └─────────────────────────┘               │
│                                                         │
│              ┌─────────────────────────┐               │
│              │  🔒 Password            │               │
│              └─────────────────────────┘               │
│                                                         │
│              ☐ Remember me                              │
│                                                         │
│              ┌─────────────────────────┐               │
│              │        LOGIN            │               │
│              └─────────────────────────┘               │
│                                                         │
│              Don't have an account? Register            │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Register Page Design
```
┌────────────────────────────────────────────────────────┐
│                      CryptoPulse                        │
├────────────────────────────────────────────────────────┤
│                                                         │
│                  Create Account                         │
│                                                         │
│              ┌─────────────────────────┐               │
│              │  👤 Full Name           │               │
│              └─────────────────────────┘               │
│                                                         │
│              ┌─────────────────────────┐               │
│              │  📧 Email               │               │
│              └─────────────────────────┘               │
│                                                         │
│              ┌─────────────────────────┐               │
│              │  🔒 Password            │               │
│              └─────────────────────────┘               │
│                                                         │
│              ┌─────────────────────────┐               │
│              │  🔒 Confirm Password    │               │
│              └─────────────────────────┘               │
│                                                         │
│              ┌─────────────────────────┐               │
│              │       REGISTER          │               │
│              └─────────────────────────┘               │
│                                                         │
│              Already have an account? Login             │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Updated Navigation
```
(Logged Out)
┌──────────────────────────────────────────────────────────────────┐
│  CryptoPulse    │  Home  │  Markets  │  News  │  About  │ Login │
└──────────────────────────────────────────────────────────────────┘

(Logged In)
┌──────────────────────────────────────────────────────────────────┐
│  CryptoPulse │ Home │ Markets │ Portfolio │ News │ About │ User▼│
└──────────────────────────────────────────────────────────────────┘
                                                          ├─ Profile
                                                          ├─ Watchlist
                                                          └─ Logout
```

### Dependencies for Phase 1
```bash
npm install express-session dotenv
```

### Mock Authentication Logic
```javascript
// Temporary mock user (will be replaced by DB in Phase 5)
const mockUsers = [
  {
    id: 1,
    name: 'Demo User',
    email: 'demo@cryptopulse.com',
    password: 'demo123' // In Phase 5, this will be hashed
  }
];
```

---

## Phase 2: Portfolio Dashboard UI

**Goal:** Create portfolio dashboard with add/edit/delete functionality using mock data

### Tasks

- [ ] Create `/views/portfolio/dashboard.ejs` - Main portfolio page
- [ ] Create `/public/css/portfolio.css` - Portfolio styling
- [ ] Create `/public/js/portfolio.js` - Portfolio interactions
- [ ] Create `/routes/portfolio.js` - Portfolio routes
- [ ] Build holdings table component
- [ ] Create "Add Holding" modal with coin search
- [ ] Implement edit holding functionality
- [ ] Implement delete holding with confirmation
- [ ] Calculate and display portfolio metrics (mock data)
- [ ] Create authentication middleware (protect portfolio routes)

### New Files
```
├── routes/portfolio.js
├── middleware/auth.js
├── views/portfolio/
│   └── dashboard.ejs
├── public/css/portfolio.css
└── public/js/portfolio.js
```

### Portfolio Dashboard Design
```
┌─────────────────────────────────────────────────────────────────────────┐
│  PORTFOLIO DASHBOARD                                    [+ Add Holding] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  Total Value    │  │  Total Invested │  │   Profit/Loss   │         │
│  │   $45,230.50    │  │   $38,500.00    │  │  +$6,730 (+17%) │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        MY HOLDINGS                                │  │
│  ├────────┬────────┬───────────┬───────────┬──────────┬─────────────┤  │
│  │  Coin  │ Amount │ Avg Price │  Current  │   P/L    │   Actions   │  │
│  ├────────┼────────┼───────────┼───────────┼──────────┼─────────────┤  │
│  │ ₿ BTC  │ 0.5    │ $42,000   │ $67,000   │ +59.5%   │  ✏️  🗑️    │  │
│  │ ⟠ ETH  │ 3.2    │ $2,800    │ $3,500    │ +25.0%   │  ✏️  🗑️    │  │
│  │ ◎ SOL  │ 15     │ $85       │ $145      │ +70.5%   │  ✏️  🗑️    │  │
│  │ ⬡ BNB  │ 2      │ $320      │ $580      │ +81.2%   │  ✏️  🗑️    │  │
│  └────────┴────────┴───────────┴───────────┴──────────┴─────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Add Holding Modal Design
```
┌────────────────────────────────────────────┐
│  Add New Holding                      [X]  │
├────────────────────────────────────────────┤
│                                            │
│  Search Coin                               │
│  ┌──────────────────────────────────────┐ │
│  │  🔍 Search for a coin...             │ │
│  └──────────────────────────────────────┘ │
│    ┌────────────────────────────────────┐ │
│    │ ₿ Bitcoin (BTC)                    │ │
│    │ ⟠ Ethereum (ETH)                   │ │
│    │ ◎ Solana (SOL)                     │ │
│    └────────────────────────────────────┘ │
│                                            │
│  Quantity                                  │
│  ┌──────────────────────────────────────┐ │
│  │  0.00                                │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Purchase Price (per coin)                 │
│  ┌──────────────────────────────────────┐ │
│  │  $ 0.00      [Use Current Price]     │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Purchase Date                             │
│  ┌──────────────────────────────────────┐ │
│  │  📅 Select date                      │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Notes (optional)                          │
│  ┌──────────────────────────────────────┐ │
│  │                                      │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────┐  ┌──────────────────┐  │
│  │    Cancel    │  │   Add Holding    │  │
│  └──────────────┘  └──────────────────┘  │
│                                            │
└────────────────────────────────────────────┘
```

### Mock Portfolio Data
```javascript
// Temporary mock data (will be replaced by DB in Phase 5)
const mockPortfolio = {
  holdings: [
    {
      id: 1,
      coinId: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      quantity: 0.5,
      purchasePrice: 42000,
      purchaseDate: '2024-01-15'
    },
    {
      id: 2,
      coinId: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      quantity: 3.2,
      purchasePrice: 2800,
      purchaseDate: '2024-02-20'
    }
  ]
};
```

### API Endpoints (Mock)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/portfolio` | Dashboard page |
| `GET` | `/api/portfolio/holdings` | Get holdings (JSON) |
| `POST` | `/api/portfolio/holdings` | Add holding |
| `PUT` | `/api/portfolio/holdings/:id` | Update holding |
| `DELETE` | `/api/portfolio/holdings/:id` | Delete holding |
| `GET` | `/api/coins/search?q=` | Search coins |

---

## Phase 3: Analytics & Charts UI

**Goal:** Add portfolio analytics with charts and performance metrics

### Tasks

- [ ] Create allocation pie chart (Chart.js)
- [ ] Create portfolio performance line chart
- [ ] Display portfolio metrics cards
- [ ] Show best/worst performing coins
- [ ] Add 24h/7d/30d/All time filters
- [ ] Create portfolio summary section
- [ ] Style analytics section

### Analytics Dashboard Design
```
┌─────────────────────────────────────────────────────────────────────────┐
│  PORTFOLIO ANALYTICS                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │     ALLOCATION BY COIN      │  │      PORTFOLIO PERFORMANCE      │  │
│  │                             │  │  [24H] [7D] [30D] [ALL]         │  │
│  │         ┌─────┐             │  │                                  │  │
│  │      ┌──┤ BTC ├──┐          │  │         ╱╲                       │  │
│  │     ╱   │ 55% │   ╲         │  │    ╱╲  ╱  ╲   ╱╲                │  │
│  │    │    └─────┘    │        │  │   ╱  ╲╱    ╲ ╱  ╲               │  │
│  │    │  ETH │  SOL   │        │  │  ╱          ╳    ╲              │  │
│  │     ╲ 25% │  12%  ╱         │  │ ╱                  ╲             │  │
│  │      └────┴──────┘          │  │╱─────────────────────            │  │
│  │        BNB: 8%              │  │ Jan  Feb  Mar  Apr  May          │  │
│  └─────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                          │
│  ┌───────────────────────────────┐  ┌───────────────────────────────┐  │
│  │      BEST PERFORMER           │  │      WORST PERFORMER          │  │
│  │  ┌────┐                       │  │  ┌────┐                       │  │
│  │  │ ◎  │  Solana (SOL)         │  │  │ ✕  │  Ripple (XRP)         │  │
│  │  └────┘  +125.5% 🚀           │  │  └────┘  -12.3% 📉            │  │
│  └───────────────────────────────┘  └───────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      PERFORMANCE METRICS                         │   │
│  ├──────────────┬──────────────┬──────────────┬────────────────────┤   │
│  │   24H Change │   7D Change  │  30D Change  │   All Time         │   │
│  │    +2.4%     │    +8.7%     │   +15.2%     │    +67.5%          │   │
│  └──────────────┴──────────────┴──────────────┴────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Metrics to Calculate
| Metric | Formula |
|--------|---------|
| Total Value | Σ (quantity × current_price) |
| Total Invested | Σ (quantity × purchase_price) |
| Total P/L | Total Value - Total Invested |
| P/L % | (Total P/L / Total Invested) × 100 |
| Allocation % | (coin_value / total_value) × 100 |

---

## Phase 4: Watchlist UI

**Goal:** Create watchlist feature to track coins without owning them

### Tasks

- [ ] Create `/views/portfolio/watchlist.ejs` - Watchlist page
- [ ] Add watchlist to navigation
- [ ] Create "Add to Watchlist" functionality
- [ ] Display watchlist with current prices
- [ ] Add price alert settings (UI only, no notifications yet)
- [ ] Add "Quick Add to Portfolio" from watchlist
- [ ] Remove from watchlist functionality

### New Files
```
├── views/portfolio/watchlist.ejs
└── public/js/watchlist.js
```

### Watchlist Design
```
┌─────────────────────────────────────────────────────────────────────────┐
│  MY WATCHLIST                                           [+ Add Coin]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        WATCHING                                   │  │
│  ├────────┬───────────┬───────────┬───────────┬─────────────────────┤  │
│  │  Coin  │  Price    │  24h %    │  7d %     │      Actions        │  │
│  ├────────┼───────────┼───────────┼───────────┼─────────────────────┤  │
│  │ ◎ SOL  │ $145.23   │  +5.2%    │  +12.8%   │ 🔔  ➕  🗑️         │  │
│  │ ⬡ AVAX │ $35.67    │  -2.1%    │  +8.4%    │ 🔔  ➕  🗑️         │  │
│  │ ● DOT  │ $7.89     │  +1.8%    │  -3.2%    │ 🔔  ➕  🗑️         │  │
│  └────────┴───────────┴───────────┴───────────┴─────────────────────┘  │
│                                                                          │
│  🔔 = Set Alert   ➕ = Add to Portfolio   🗑️ = Remove                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Price Alert Modal
```
┌────────────────────────────────────────────┐
│  Set Price Alert - Solana (SOL)       [X]  │
├────────────────────────────────────────────┤
│                                            │
│  Current Price: $145.23                    │
│                                            │
│  Alert me when price goes:                 │
│                                            │
│  ☐ Above  ┌────────────────────────────┐  │
│           │  $ 150.00                   │  │
│           └────────────────────────────┘  │
│                                            │
│  ☐ Below  ┌────────────────────────────┐  │
│           │  $ 130.00                   │  │
│           └────────────────────────────┘  │
│                                            │
│  ┌──────────────┐  ┌──────────────────┐  │
│  │    Cancel    │  │    Set Alert     │  │
│  └──────────────┘  └──────────────────┘  │
│                                            │
└────────────────────────────────────────────┘
```

---

## Phase 5: Database Integration

**Goal:** Replace all mock data with MongoDB database

### Tasks

- [ ] Set up MongoDB Atlas cluster
- [ ] Create `.env` file with connection string
- [ ] Install database dependencies
- [ ] Create database connection module
- [ ] Create User model with password hashing
- [ ] Create Portfolio model
- [ ] Create Watchlist model
- [ ] Migrate authentication to use database
- [ ] Migrate portfolio to use database
- [ ] Migrate watchlist to use database
- [ ] Add input validation
- [ ] Test all functionality with real data
- [ ] Deploy to production

### Dependencies for Phase 5
```bash
npm install mongoose bcryptjs connect-mongo express-validator
```

### Environment Variables
```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/cryptopulse

# Session
SESSION_SECRET=your-super-secret-key-here
```

### Database Schema

#### Users Collection
```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed with bcrypt
  createdAt: { type: Date, default: Date.now },
  settings: {
    currency: { type: String, default: 'usd' },
    theme: { type: String, default: 'dark' }
  }
});
```

#### Portfolio Collection
```javascript
const portfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  holdings: [{
    coinId: String,
    symbol: String,
    name: String,
    quantity: Number,
    purchasePrice: Number,
    purchaseDate: Date,
    notes: String,
    addedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

#### Watchlist Collection
```javascript
const watchlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coins: [{
    coinId: String,
    symbol: String,
    name: String,
    addedAt: { type: Date, default: Date.now },
    priceAlert: {
      above: Number,
      below: Number
    }
  }]
});
```

### Migration Steps
1. Create MongoDB Atlas account and cluster
2. Get connection string
3. Create models
4. Update auth routes to use User model
5. Update portfolio routes to use Portfolio model
6. Update watchlist routes to use Watchlist model
7. Test thoroughly
8. Remove mock data

---

## File Structure (Final)

```
cryptipulse/
├── app.js                      # Main server file
├── package.json                # Dependencies
├── .env                        # Environment variables (Phase 5)
├── .env.example                # Example env file
│
├── config/
│   └── database.js             # MongoDB connection (Phase 5)
│
├── models/                     # Mongoose models (Phase 5)
│   ├── User.js
│   ├── Portfolio.js
│   └── Watchlist.js
│
├── middleware/
│   ├── auth.js                 # Authentication check (Phase 2)
│   └── validation.js           # Input validation (Phase 5)
│
├── routes/
│   ├── auth.js                 # Auth routes (Phase 1)
│   ├── portfolio.js            # Portfolio routes (Phase 2)
│   └── api.js                  # API routes (Phase 2)
│
├── public/
│   ├── css/
│   │   ├── styles.css
│   │   ├── other.css
│   │   ├── auth.css            # Phase 1
│   │   └── portfolio.css       # Phase 2
│   └── js/
│       ├── markets.js
│       ├── auth.js             # Phase 1
│       ├── portfolio.js        # Phase 2
│       └── watchlist.js        # Phase 4
│
└── views/
    ├── index.ejs
    ├── graphs.ejs
    ├── auth/                   # Phase 1
    │   ├── login.ejs
    │   └── register.ejs
    ├── portfolio/              # Phase 2-4
    │   ├── dashboard.ejs
    │   └── watchlist.ejs
    └── partials/
        ├── header.ejs          # Updated in Phase 1
        └── footer.ejs
```

---

## Quick Reference

### Phase 1 Commands
```bash
npm install express-session dotenv
```

### Phase 5 Commands
```bash
npm install mongoose bcryptjs connect-mongo express-validator
```

### Start Development
```bash
npm run dev
```

---

## Summary

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| **Phase 1** | Auth UI | Login, Register, Sessions, Navigation |
| **Phase 2** | Portfolio UI | Dashboard, Add/Edit/Delete Holdings |
| **Phase 3** | Analytics UI | Charts, Metrics, Performance |
| **Phase 4** | Watchlist UI | Track Coins, Price Alerts |
| **Phase 5** | Database | MongoDB, Real Data, Production Ready |

---

*Document created: January 2025*
*Approach: UI-First, Database-Last*
