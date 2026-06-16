require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const testSupabase = createClient(
  process.env.TEST_SUPABASE_URL,
  process.env.TEST_SUPABASE_SERVICE_KEY
);

async function createTestUser(overrides = {}) {
  const defaults = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'password123'
  };
  const user = { ...defaults, ...overrides };
  const passwordHash = await bcrypt.hash(user.password, 10);

  const { data, error } = await testSupabase
    .from('users')
    .insert([{ name: user.name, email: user.email, password_hash: passwordHash }])
    .select()
    .single();

  if (error) throw new Error(`createTestUser failed: ${error.message}`);
  return { ...data, plainPassword: user.password };
}

async function cleanTestUsers() {
  await testSupabase.from('users').delete().like('email', 'test-%@example.com');
}

async function createTestHolding(userId, overrides = {}) {
  const defaults = {
    user_id: userId,
    coin_id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    image: '',
    quantity: 0.5,
    purchase_price: 40000,
    purchase_date: '2024-01-01',
    notes: ''
  };

  const { data, error } = await testSupabase
    .from('portfolio_holdings')
    .insert([{ ...defaults, ...overrides }])
    .select()
    .single();

  if (error) throw new Error(`createTestHolding failed: ${error.message}`);
  return data;
}

async function createTestWatchlistCoin(userId, overrides = {}) {
  const defaults = {
    user_id: userId,
    coin_id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    image: ''
  };

  const { data, error } = await testSupabase
    .from('watchlist')
    .insert([{ ...defaults, ...overrides }])
    .select()
    .single();

  if (error) throw new Error(`createTestWatchlistCoin failed: ${error.message}`);
  return data;
}

module.exports = {
  testSupabase,
  createTestUser,
  cleanTestUsers,
  createTestHolding,
  createTestWatchlistCoin
};
