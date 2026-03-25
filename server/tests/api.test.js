const request = require('supertest');
const app = require('../app');
const pool = require('../db');

describe('Health API', () => {
  it('should return 200 for /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});

describe('Auth API', () => {
  it('should return 401 for invalid login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fake@example.com', password: 'wrong' });
    expect(res.statusCode).toBe(401);
  });
});

afterAll(async () => {
  await pool.end();
});
