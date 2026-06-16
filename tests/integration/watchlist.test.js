require('dotenv').config();
const request = require('supertest');
const app = require('../../app');
const { testSupabase, createTestUser, cleanTestUsers, createTestWatchlistCoin } = require('../helpers/db');

let agent;
let testUser;

beforeEach(async () => {
  testUser = await createTestUser({ email: 'test-watchlist@example.com', password: 'password123' });
  agent = request.agent(app);
  await agent.post('/auth/login').type('form').send({ email: testUser.email, password: 'password123' });
});

afterEach(async () => {
  await testSupabase.from('watchlist').delete().eq('user_id', testUser.id);
  await cleanTestUsers();
});

describe('POST /portfolio/watchlist', () => {
  test('adds a coin to watchlist', async () => {
    const res = await agent
      .post('/portfolio/watchlist')
      .type('json')
      .send({ coinId: 'ethereum', symbol: 'ETH', name: 'Ethereum' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.coin.coin_id).toBe('ethereum');
  });

  test('rejects duplicate coin', async () => {
    await createTestWatchlistCoin(testUser.id, { coin_id: 'ethereum', symbol: 'ETH', name: 'Ethereum' });
    const res = await agent
      .post('/portfolio/watchlist')
      .type('json')
      .send({ coinId: 'ethereum', symbol: 'ETH', name: 'Ethereum' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('already in watchlist');
  });

  test('rejects missing coinId', async () => {
    const res = await agent
      .post('/portfolio/watchlist')
      .type('json')
      .send({ symbol: 'ETH', name: 'Ethereum' });
    expect(res.status).toBe(422);
  });
});

describe('DELETE /portfolio/watchlist/:coinId', () => {
  test('removes a coin from watchlist', async () => {
    await createTestWatchlistCoin(testUser.id, { coin_id: 'solana', symbol: 'SOL', name: 'Solana' });
    const res = await agent.delete('/portfolio/watchlist/solana');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('returns 404 for coin not in watchlist', async () => {
    const res = await agent.delete('/portfolio/watchlist/nonexistent-coin');
    expect(res.status).toBe(404);
  });
});
