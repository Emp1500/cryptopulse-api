const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios'); // Kept in case you add more API calls later

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public'))); // For serving CSS, images etc.

// Routes
app.get('/', async (req, res) => {
  try {
    // Fetching the top 10 coins dynamically, as you originally planned.
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
    return res.render('index', { coins });
  } catch (error) {
    console.error('Error fetching data for homepage:', error.message);
    return res.status(500).send('Internal Server Error');
  }
});

app.get("/graphs", (req, res) => {
  res.render("partials/graphs");
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
