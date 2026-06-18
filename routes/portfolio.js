const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const { isAuthenticated } = require('../middleware/auth');
const supabase = require('../config/database');
const logger = require('../config/logger');

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

// Helper: fetch current prices from CoinGecko
async function fetchCurrentPrices(coinIds) {
  if (coinIds.length === 0) return {};
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: coinIds.join(','),
        vs_currencies: 'usd',
        include_24hr_change: true
      }
    });
    return response.data;
  } catch (error) {
    logger.warn(`CoinGecko price fetch failed: ${error.message}`);
    return {};
  }
}

// Helper: fetch detailed coin data for watchlist
async function fetchWatchlistData(coinIds) {
  if (coinIds.length === 0) return new Map();
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        ids: coinIds.join(','),
        price_change_percentage: '7d',
        sparkline: false
      }
    });
    const coinDataMap = new Map();
    response.data.forEach(coin => coinDataMap.set(coin.id, coin));
    return coinDataMap;
  } catch (error) {
    logger.warn(`CoinGecko watchlist data fetch failed: ${error.message}`);
    return new Map();
  }
}

// ==================== PORTFOLIO ROUTES ====================

// GET /portfolio - Dashboard
router.get('/', isAuthenticated, async (req, res) => {
  const userId = req.session.user.id;

  const [holdingsResult, watchlistResult] = await Promise.all([
    supabase.from('portfolio_holdings').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('watchlist').select('*').eq('user_id', userId).order('added_at', { ascending: true })
  ]);

  if (holdingsResult.error) {
    logger.error(`Portfolio holdings fetch failed: ${holdingsResult.error.message}`);
    return res.status(500).send('Failed to load portfolio');
  }
  if (watchlistResult.error) {
    logger.error(`Watchlist fetch failed: ${watchlistResult.error.message}`);
    return res.status(500).send('Failed to load portfolio');
  }

  const holdings = holdingsResult.data;
  const watchlistCoins = watchlistResult.data;

  const holdingCoinIds = holdings.map(h => h.coin_id);
  const watchlistCoinIds = watchlistCoins.map(c => c.coin_id);

  const [prices, coinDataMap] = await Promise.all([
    fetchCurrentPrices(holdingCoinIds),
    fetchWatchlistData(watchlistCoinIds)
  ]);

  let totalValue = 0;
  let totalInvested = 0;

  const holdingsWithPrices = holdings.map(holding => {
    const currentPrice = prices[holding.coin_id]?.usd || Number(holding.purchase_price);
    const priceChange24h = prices[holding.coin_id]?.usd_24h_change || 0;
    const currentValue = Number(holding.quantity) * currentPrice;
    const investedValue = Number(holding.quantity) * Number(holding.purchase_price);
    const profitLoss = currentValue - investedValue;
    const profitLossPercent = ((currentPrice - Number(holding.purchase_price)) / Number(holding.purchase_price)) * 100;

    totalValue += currentValue;
    totalInvested += investedValue;

    return {
      ...holding,
      coinId: holding.coin_id,
      purchasePrice: Number(holding.purchase_price),
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

  const watchlist = watchlistCoins.map(coin => {
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

  res.render('portfolio/dashboard', {
    user: req.session.user,
    holdings: holdingsWithPrices,
    totalValue,
    totalInvested,
    totalProfitLoss,
    totalProfitLossPercent,
    watchlist
  });
});

// GET /portfolio/holdings - JSON
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
    const currentPrice = prices[holding.coin_id]?.usd || Number(holding.purchase_price);
    const priceChange24h = prices[holding.coin_id]?.usd_24h_change || 0;
    const currentValue = Number(holding.quantity) * currentPrice;
    const profitLossPercent = ((currentPrice - Number(holding.purchase_price)) / Number(holding.purchase_price)) * 100;
    return {
      ...holding,
      coinId: holding.coin_id,
      purchasePrice: Number(holding.purchase_price),
      currentPrice,
      priceChange24h,
      currentValue,
      profitLossPercent
    };
  });

  res.json(holdingsWithPrices);
});

// POST /portfolio/holdings - Add holding
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

// PUT /portfolio/holdings/:id - Update holding
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

// DELETE /portfolio/holdings/:id - Delete holding
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

// ==================== WATCHLIST ROUTES ====================

// GET /portfolio/watchlist - Page
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

// GET /portfolio/watchlist/data - JSON
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

// POST /portfolio/watchlist - Add coin
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

// DELETE /portfolio/watchlist/:coinId - Remove coin
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

module.exports = router;
