require('dotenv').config();
const request = require('supertest');
const app = require('../../app');
const { testSupabase, createTestUser, cleanTestUsers, createTestHolding, createTestWatchlistCoin } = require('../helpers/db');

let agent;
let testUser;

beforeEach(async () => {
  testUser = await createTestUser({ email: 'test-portfolio@example.com', password: 'password123' });
  agent = request.agent(app);
  await agent.post('/auth/login').type('form').send({ email: testUser.email, password: 'password123' });
});

afterEach(async () => {
  await testSupabase.from('portfolio_holdings').delete().eq('user_id', testUser.id);
  await testSupabase.from('watchlist').delete().eq('user_id', testUser.id);
  await cleanTestUsers();
});

describe('GET /portfolio', () => {
  test('redirects unauthenticated users to login', async () => {
    const res = await request(app).get('/portfolio');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/auth/login');
  });

  test('returns 200 for authenticated users', async () => {
    const res = await agent.get('/portfolio');
    expect(res.status).toBe(200);
  });

  test('renders page with watchlist data available', async () => {
    await createTestWatchlistCoin(testUser.id, { coin_id: 'ethereum', symbol: 'ETH', name: 'Ethereum' });
    const res = await agent.get('/portfolio');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Ethereum');
  });
});

describe('POST /portfolio/holdings', () => {
  test('adds a valid holding', async () => {
    const res = await agent
      .post('/portfolio/holdings')
      .type('json')
      .send({
        coinId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 0.5,
        purchasePrice: 40000,
        purchaseDate: '2024-01-01'
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.holding.coin_id).toBe('bitcoin');
  });

  test('rejects zero quantity', async () => {
    const res = await agent
      .post('/portfolio/holdings')
      .type('json')
      .send({
        coinId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 0,
        purchasePrice: 40000
      });
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/positive number/i);
  });

  test('rejects missing coinId', async () => {
    const res = await agent
      .post('/portfolio/holdings')
      .type('json')
      .send({ symbol: 'BTC', name: 'Bitcoin', quantity: 1, purchasePrice: 40000 });
    expect(res.status).toBe(422);
  });
});

describe('PUT /portfolio/holdings/:id', () => {
  test('updates an existing holding', async () => {
    const holding = await createTestHolding(testUser.id);
    const res = await agent
      .put(`/portfolio/holdings/${holding.id}`)
      .type('json')
      .send({ quantity: 1.5 });
    expect(res.status).toBe(200);
    expect(parseFloat(res.body.holding.quantity)).toBeCloseTo(1.5);
  });

  test('returns 404 for unknown holding id', async () => {
    const res = await agent
      .put('/portfolio/holdings/00000000-0000-0000-0000-000000000000')
      .type('json')
      .send({ quantity: 1 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /portfolio/holdings/:id', () => {
  test('deletes an existing holding', async () => {
    const holding = await createTestHolding(testUser.id);
    const res = await agent.delete(`/portfolio/holdings/${holding.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('returns 404 for unknown holding id', async () => {
    const res = await agent.delete('/portfolio/holdings/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});
