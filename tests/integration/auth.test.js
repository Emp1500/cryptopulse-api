require('dotenv').config();
const request = require('supertest');
const app = require('../../app');
const { createTestUser, cleanTestUsers } = require('../helpers/db');

afterEach(async () => {
  await cleanTestUsers();
});

describe('GET /auth/login', () => {
  test('renders login page', async () => {
    const res = await request(app).get('/auth/login');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Login');
  });
});

describe('GET /auth/register', () => {
  test('renders register page', async () => {
    const res = await request(app).get('/auth/register');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Register');
  });
});

describe('POST /auth/register', () => {
  test('registers a new user and redirects to login', async () => {
    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({
        name: 'Test User',
        email: 'test-register@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/auth/login?registered=true');
  });

  test('rejects duplicate email', async () => {
    await createTestUser({ email: 'test-dup@example.com' });
    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({
        name: 'Dup User',
        email: 'test-dup@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
    expect(res.status).toBe(200);
    expect(res.text).toContain('already registered');
  });

  test('rejects mismatched passwords', async () => {
    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({
        name: 'Test',
        email: 'test-mismatch@example.com',
        password: 'password123',
        confirmPassword: 'different'
      });
    expect(res.status).toBe(200);
    expect(res.text).toContain('Passwords do not match');
  });

  test('rejects missing name', async () => {
    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({
        name: '',
        email: 'test-noname@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
    expect(res.status).toBe(200);
    expect(res.text).toContain('required');
  });
});

describe('POST /auth/login', () => {
  test('logs in with valid credentials and redirects to dashboard', async () => {
    const user = await createTestUser({ email: 'test-login@example.com', password: 'password123' });
    const res = await request(app)
      .post('/auth/login')
      .type('form')
      .send({ email: user.email, password: 'password123' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/dashboard');
  });

  test('rejects wrong password', async () => {
    const user = await createTestUser({ email: 'test-wrongpw@example.com', password: 'password123' });
    const res = await request(app)
      .post('/auth/login')
      .type('form')
      .send({ email: user.email, password: 'wrongpassword' });
    expect(res.status).toBe(200);
    expect(res.text).toContain('Invalid email or password');
  });

  test('rejects unknown email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .type('form')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.text).toContain('Invalid email or password');
  });
});

describe('POST /auth/logout', () => {
  test('destroys session and redirects to home', async () => {
    const agent = request.agent(app);
    const user = await createTestUser({ email: 'test-logout@example.com', password: 'password123' });
    await agent.post('/auth/login').type('form').send({ email: user.email, password: 'password123' });

    const res = await agent.post('/auth/logout');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');

    const portfolioRes = await agent.get('/portfolio');
    expect(portfolioRes.status).toBe(302);
    expect(portfolioRes.headers.location).toContain('/auth/login');
  });
});
