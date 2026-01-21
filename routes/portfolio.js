const express = require('express');
const router = express.Router();
const axios = require('axios');
const { isAuthenticated } = require('../middleware/auth');

// Mock portfolio data (will be replaced by database in Phase 5)
// Using a Map to store portfolios by user ID
const mockPortfolios = new Map();

// Initialize demo user portfolio
mockPortfolios.set(1, {
  holdings: [
    {
      id: 1,
      coinId: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
      quantity: 0.5,
      purchasePrice: 42000,
      purchaseDate: '2024-01-15',
      notes: 'First BTC purchase'
    },
    {
      id: 2,
      coinId: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
      quantity: 3.2,
      purchasePrice: 2800,
      purchaseDate: '2024-02-20',
      notes: ''
    },
    {
      id: 3,
      coinId: 'solana',
      symbol: 'SOL',
      name: 'Solana',
      image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
      quantity: 15,
      purchasePrice: 85,
      purchaseDate: '2024-03-10',
      notes: 'Long term hold'
    }
  ]
});

// Helper function to get user portfolio
function getUserPortfolio(userId) {
  if (!mockPortfolios.has(userId)) {
    mockPortfolios.set(userId, { holdings: [] });
  }
  return mockPortfolios.get(userId);
}

// Helper function to fetch current prices
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
    console.error('Error fetching prices:', error.message);
    return {};
  }
}

// GET /portfolio - Dashboard page
router.get('/', isAuthenticated, async (req, res) => {
  const userId = req.session.user.id;
  const portfolio = getUserPortfolio(userId);

  // Get current prices for all holdings
  const coinIds = portfolio.holdings.map(h => h.coinId);
  const prices = await fetchCurrentPrices(coinIds);

  // Calculate portfolio metrics
  let totalValue = 0;
  let totalInvested = 0;

  const holdingsWithPrices = portfolio.holdings.map(holding => {
    const currentPrice = prices[holding.coinId]?.usd || holding.purchasePrice;
    const priceChange24h = prices[holding.coinId]?.usd_24h_change || 0;
    const currentValue = holding.quantity * currentPrice;
    const investedValue = holding.quantity * holding.purchasePrice;
    const profitLoss = currentValue - investedValue;
    const profitLossPercent = ((currentPrice - holding.purchasePrice) / holding.purchasePrice) * 100;

    totalValue += currentValue;
    totalInvested += investedValue;

    return {
      ...holding,
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

// GET /portfolio/holdings - Get holdings as JSON
router.get('/holdings', isAuthenticated, async (req, res) => {
  const userId = req.session.user.id;
  const portfolio = getUserPortfolio(userId);

  const coinIds = portfolio.holdings.map(h => h.coinId);
  const prices = await fetchCurrentPrices(coinIds);

  const holdingsWithPrices = portfolio.holdings.map(holding => {
    const currentPrice = prices[holding.coinId]?.usd || holding.purchasePrice;
    const priceChange24h = prices[holding.coinId]?.usd_24h_change || 0;
    const currentValue = holding.quantity * currentPrice;
    const profitLossPercent = ((currentPrice - holding.purchasePrice) / holding.purchasePrice) * 100;

    return {
      ...holding,
      currentPrice,
      priceChange24h,
      currentValue,
      profitLossPercent
    };
  });

  res.json(holdingsWithPrices);
});

// POST /portfolio/holdings - Add new holding
router.post('/holdings', isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const { coinId, symbol, name, image, quantity, purchasePrice, purchaseDate, notes } = req.body;

  // Validation
  if (!coinId || !symbol || !name || !quantity || !purchasePrice) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const portfolio = getUserPortfolio(userId);

  // Generate new ID
  const newId = portfolio.holdings.length > 0
    ? Math.max(...portfolio.holdings.map(h => h.id)) + 1
    : 1;

  const newHolding = {
    id: newId,
    coinId,
    symbol: symbol.toUpperCase(),
    name,
    image: image || '',
    quantity: parseFloat(quantity),
    purchasePrice: parseFloat(purchasePrice),
    purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
    notes: notes || ''
  };

  portfolio.holdings.push(newHolding);

  res.json({ success: true, holding: newHolding });
});

// PUT /portfolio/holdings/:id - Update holding
router.put('/holdings/:id', isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const holdingId = parseInt(req.params.id);
  const { quantity, purchasePrice, purchaseDate, notes } = req.body;

  const portfolio = getUserPortfolio(userId);
  const holdingIndex = portfolio.holdings.findIndex(h => h.id === holdingId);

  if (holdingIndex === -1) {
    return res.status(404).json({ error: 'Holding not found' });
  }

  // Update fields
  if (quantity !== undefined) portfolio.holdings[holdingIndex].quantity = parseFloat(quantity);
  if (purchasePrice !== undefined) portfolio.holdings[holdingIndex].purchasePrice = parseFloat(purchasePrice);
  if (purchaseDate !== undefined) portfolio.holdings[holdingIndex].purchaseDate = purchaseDate;
  if (notes !== undefined) portfolio.holdings[holdingIndex].notes = notes;

  res.json({ success: true, holding: portfolio.holdings[holdingIndex] });
});

// DELETE /portfolio/holdings/:id - Delete holding
router.delete('/holdings/:id', isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const holdingId = parseInt(req.params.id);

  const portfolio = getUserPortfolio(userId);
  const holdingIndex = portfolio.holdings.findIndex(h => h.id === holdingId);

  if (holdingIndex === -1) {
    return res.status(404).json({ error: 'Holding not found' });
  }

  portfolio.holdings.splice(holdingIndex, 1);

  res.json({ success: true });
});

module.exports = router;
