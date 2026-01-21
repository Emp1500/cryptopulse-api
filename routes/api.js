const express = require('express');
const router = express.Router();
const axios = require('axios');

// Cache for coin list
let coinListCache = null;
let coinListCacheTime = 0;
const COIN_LIST_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// GET /api/coins/search - Search coins for autocomplete
router.get('/coins/search', async (req, res) => {
  const query = req.query.q?.toLowerCase() || '';

  if (query.length < 1) {
    return res.json([]);
  }

  try {
    // Check cache
    const now = Date.now();
    if (!coinListCache || (now - coinListCacheTime > COIN_LIST_CACHE_DURATION)) {
      console.log('Fetching coin list from CoinGecko');
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 250,
          page: 1,
          sparkline: false
        }
      });
      coinListCache = response.data;
      coinListCacheTime = now;
    }

    // Filter coins by query
    const filtered = coinListCache
      .filter(coin =>
        coin.name.toLowerCase().includes(query) ||
        coin.symbol.toLowerCase().includes(query)
      )
      .slice(0, 10)
      .map(coin => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        current_price: coin.current_price
      }));

    res.json(filtered);
  } catch (error) {
    console.error('Error searching coins:', error.message);
    res.status(500).json({ error: 'Failed to search coins' });
  }
});

// GET /api/coins/price/:id - Get current price for a coin
router.get('/coins/price/:id', async (req, res) => {
  const coinId = req.params.id;

  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
      params: {
        ids: coinId,
        vs_currencies: 'usd'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching price:', error.message);
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

module.exports = router;
