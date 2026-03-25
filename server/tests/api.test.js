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

afterAll(async () => {
  await pool.end();
});
