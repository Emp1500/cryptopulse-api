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
const axios = require('axios');
const logger = require('./config/logger');

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
      connectSrc: ["'self'"]
    }
  }
}));

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware — uses PostgreSQL store in production, in-memory for tests
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
};

if (process.env.DATABASE_URL) {
  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
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
