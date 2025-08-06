const express = require('express');
const app = express();
const path = require('path');

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Always needed for EJS
app.use(express.static(path.join(__dirname, 'public'))); // For serving CSS, images etc.

// Routes
app.get('/', async (req, res) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,binancecoin,solana,ripple,cardano&order=market_cap_desc&per_page=6&page=1&sparkline=false');
    const data = await response.json();
    res.render('index', {coins:data});  
  } catch (error) {
    console.log('Error fetching data:', error);
    return res.status(500).send('Internal Server Error');
  }
  res.render('index');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
