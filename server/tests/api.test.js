const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const pool = require('../db');

describe('Health API', () => {
  it('should return 200 for /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});

describe('Unknown routes', () => {
  it('should return 404 for an unknown route', async () => {
    const res = await request(app).get('/api/nonexistent-route-xyz');
    expect(res.statusCode).toBe(404);
  });
});

describe('Error handler', () => {
  let errorUser;
  let errorToken;

  beforeAll(async () => {
    const res = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ('Error User', 'error-handler@example.com', 'hashed') RETURNING id"
    );
    errorUser = res.rows[0];
    errorToken = jwt.sign({ userId: errorUser.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE id = $1', [errorUser.id]);
  });

  it('should return 500 with a generic message when an unexpected error occurs', async () => {
    const querySpy = jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB failure'));

    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${errorToken}`);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('message', 'Internal server error');

    querySpy.mockRestore();
  });
});

afterAll(async () => {
  await pool.end();
});
