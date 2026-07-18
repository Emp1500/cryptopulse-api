require('dotenv').config();
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0
});

const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const app = express();
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const logger = require('./config/logger');
const supabase = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const apiRoutes = require('./routes/api');

// In-memory cache to store API data
const cache = {
  coins: null,
  lastFetch: 0,
};

// Cache duration: 5 minutes in milliseconds
const CACHE_DURATION = 5 * 60 * 1000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "fonts.gstatic.com", "cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "assets.coingecko.com", "coin-images.coingecko.com"],
      connectSrc: ["'self'", "api.coingecko.com"]
    }
  }
}));

// Trust reverse proxy (Vercel, Heroku, etc.) so req.secure reflects HTTPS correctly.
// Without this, express-session skips Set-Cookie when cookie.secure=true,
// because Express sees internal HTTP and thinks the connection is not secure.
app.set('trust proxy', 1);

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required');
}

// Session middleware — uses PostgreSQL store in production, in-memory for tests
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    // 'auto' marks the cookie Secure only when the request is actually HTTPS
    // (honors `trust proxy` above), instead of trusting NODE_ENV to be set correctly.
    secure: 'auto',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
};

if (process.env.DATABASE_URL) {
  // Supabase's pooler chains to its own "Supabase Root 2021 CA", which isn't in
  // Node's default trust store — pin to it so certs are actually verified
  // instead of disabling verification (rejectUnauthorized: false) wholesale.
  const supabaseCa = fs.readFileSync(path.join(__dirname, 'config/certs/supabase-root-2021-ca.pem'), 'utf8');
  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true, ca: supabaseCa }
  });
  sessionConfig.store = new pgSession({
    pool: pgPool,
    tableName: 'sessions',
    createTableIfMissing: true
  });
}

app.use(session(sessionConfig));

// Make user available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/portfolio', portfolioRoutes);
app.use('/api', apiRoutes);

// Home page
app.get('/', async (req, res) => {
  try {
    const now = Date.now();
    if (cache.coins && (now - cache.lastFetch < CACHE_DURATION)) {
      logger.info('Serving homepage data from cache');
      return res.render('index', { coins: cache.coins });
    }

    logger.info('Fetching fresh homepage data from CoinGecko API');
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 12,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h'
      },
    });
    const coins = response.data || [];

    cache.coins = coins;
    cache.lastFetch = now;

    return res.render('index', { coins });
  } catch (error) {
    logger.error(`Homepage CoinGecko fetch failed: ${error.message}`);
    if (cache.coins) {
      logger.warn('CoinGecko API error — serving stale cache for homepage');
      return res.render('index', { coins: cache.coins });
    }
    return res.status(500).send('Internal Server Error');
  }
});

app.get('/dashboard', async (req, res) => {
  try {
    const now = Date.now();
    let coins = [];
    if (cache.coins && (now - cache.lastFetch < CACHE_DURATION)) {
      coins = cache.coins;
    } else {
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: { vs_currency: 'usd', order: 'market_cap_desc', per_page: 10, page: 1, sparkline: false }
      });
      coins = response.data || [];
      cache.coins = coins;
      cache.lastFetch = now;
    }

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
  } catch (error) {
    logger.error(`Dashboard fetch failed: ${error.message}`);
    res.render('dashboard', { coins: [], watchlist: [] });
  }
});

app.get("/graphs", (req, res) => {
  res.render("graphs");
});

app.get('/home', (req, res) => {
  res.redirect('/');
});

app.get('/news', (req, res) => {
  res.redirect('https://coinmarketcap.com/headlines/news/');
});

app.get('/about', (req, res) => {
  res.render('partials/about');
});

app.get('/markets', (req, res) => {
  res.render('partials/markets');
});

Sentry.setupExpressErrorHandler(app);

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
