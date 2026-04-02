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

  it('should include message and a valid timestamp in the response', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'API is healthy');
    expect(res.body).toHaveProperty('timestamp');
    expect(new Date(res.body.timestamp).getTime()).not.toBeNaN();
  });
});

describe('Unknown routes', () => {
  it('should return 404 for an unknown route', async () => {
    const res = await request(app).get('/api/nonexistent-route-xyz');
    expect(res.statusCode).toBe(404);
  });
});

describe('CORS middleware', () => {
  it('should pass through requests with no Origin header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
  });

  it('should allow requests from localhost:5173 and set CORS headers', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    expect(res.statusCode).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should allow requests from localhost:3000 and set CORS headers', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:3000');

    expect(res.statusCode).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('should return 204 for an OPTIONS preflight from an allowed origin', async () => {
    const res = await request(app)
      .options('/api/health')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.statusCode).toBe(204);
  });

  it('should return 403 for a request from a disallowed origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://malicious-site.example.com');

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/cors/i);
  });

  it('should return 403 for an OPTIONS preflight from a disallowed origin', async () => {
    const res = await request(app)
      .options('/api/health')
      .set('Origin', 'http://malicious-site.example.com')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.statusCode).toBe(403);
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
