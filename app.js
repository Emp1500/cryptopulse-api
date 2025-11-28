const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios');

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
app.use(express.static(path.join(__dirname, 'public'))); // For serving CSS, images etc.

// Routes
app.get('/', async (req, res) => {
  try {
    const now = Date.now();
    // 1. Check if the cache is still valid
    if (cache.coins && (now - cache.lastFetch < CACHE_DURATION)) {
      console.log('Serving data from cache');
      // 1a. If valid, serve data from cache
      return res.render('index', { coins: cache.coins });
    }

    // 2. If cache is invalid or empty, fetch new data
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

    // 3. Update the cache with the new data and timestamp
    cache.coins = coins;
    cache.lastFetch = now;

    return res.render('index', { coins });
  } catch (error) {
    console.error('Error fetching data for homepage:', error.message);
    // 4. If the API fails, serve stale data from the cache if available
    if (cache.coins) {
      console.log('API error: serving stale data from cache');
      return res.render('index', { coins: cache.coins });
    }
    // 5. If there's no cache and the API fails, show an error
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
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
