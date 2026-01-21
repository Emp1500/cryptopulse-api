require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios');
const session = require('express-session');

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

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

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
      console.log('Serving data from cache');
      return res.render('index', { coins: cache.coins });
    }

    console.log('Fetching new data from CoinGecko API');
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
    console.error('Error fetching data for homepage:', error.message);
    if (cache.coins) {
      console.log('API error: serving stale data from cache');
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
