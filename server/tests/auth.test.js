const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../app');
const pool = require('../db');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

let existingUser;
const EXISTING_PASSWORD = 'secret123';

beforeAll(async () => {
  const hash = await bcrypt.hash(EXISTING_PASSWORD, 1);
  const res = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
    ['Auth Test User', 'auth-test@example.com', hash]
  );
  existingUser = res.rows[0];
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE id = $1', [existingUser.id]);
  await pool.end();
});

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should return 201 with a token and user on success', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'New User', email: 'register-new@example.com', password: 'password123' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('register-new@example.com');

      await pool.query('DELETE FROM users WHERE email = $1', ['register-new@example.com']);
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'no-name@example.com', password: 'password123' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when name is an empty string', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: '', email: 'empty-name@example.com', password: 'password123' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'No Email', password: 'password123' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when email is an empty string', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'No Email', email: '', password: 'password123' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'No Password', email: 'no-password@example.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when password is an empty string', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'No Password', email: 'no-password@example.com', password: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 409 when the email is already registered', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Duplicate', email: existingUser.email, password: 'password123' });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toMatch(/already registered/i);
    });

    it('should not return password_hash in the response', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Safe User', email: 'safe-register@example.com', password: 'password123' });

      expect(res.statusCode).toBe(201);
      expect(res.body.user).not.toHaveProperty('password_hash');

      await pool.query('DELETE FROM users WHERE email = $1', ['safe-register@example.com']);
    });

    it('should include created_at in the returned user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Timestamped', email: 'timestamp-register@example.com', password: 'password123' });

      expect(res.statusCode).toBe(201);
      expect(res.body.user).toHaveProperty('created_at');

      await pool.query('DELETE FROM users WHERE email = $1', ['timestamp-register@example.com']);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 with a token and safe user object on success', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: existingUser.email, password: EXISTING_PASSWORD });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.id).toBe(existingUser.id);
    });

    it('should return 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when email is an empty string', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: '', password: 'password123' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: existingUser.email });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when password is an empty string', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: existingUser.email, password: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 when the email does not exist', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });

    it('should return 401 when the password is incorrect', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: existingUser.email, password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });

    it('should not return password_hash in the response', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: existingUser.email, password: EXISTING_PASSWORD });

      expect(res.statusCode).toBe(200);
      expect(res.body.user).not.toHaveProperty('password_hash');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 200 with the user profile for a valid token', async () => {
      const token = generateToken(existingUser.id);
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(existingUser.id);
      expect(res.body.email).toBe(existingUser.email);
    });

    it('should include created_at in the user profile response', async () => {
      const token = generateToken(existingUser.id);
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('created_at');
      expect(new Date(res.body.created_at).getTime()).not.toBeNaN();
    });

    it('should not return password_hash in the profile response', async () => {
      const token = generateToken(existingUser.id);
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).not.toHaveProperty('password_hash');
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });

    it('should return 401 when the Authorization header does not use the Bearer scheme', async () => {
      const token = generateToken(existingUser.id);
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Token ${token}`);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message', 'No token provided');
    });

    it('should return 401 with an expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: existingUser.id, exp: Math.floor(Date.now() / 1000) - 10 },
        process.env.JWT_SECRET
      );
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.statusCode).toBe(401);
    });

    it('should return 401 with a malformed token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer this.is.not.a.real.token');

      expect(res.statusCode).toBe(401);
    });

    it('should return 401 with a token signed by a different secret', async () => {
      const badToken = jwt.sign({ userId: existingUser.id }, 'wrong-secret', { expiresIn: '1h' });
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${badToken}`);

      expect(res.statusCode).toBe(401);
    });

    it('should return 404 if the user referenced in the token no longer exists', async () => {
      const tempRes = await pool.query(
        "INSERT INTO users (name, email, password_hash) VALUES ('Temp', 'temp-deleted@example.com', 'hash') RETURNING id"
      );
      const tempId = tempRes.rows[0].id;
      const token = generateToken(tempId);
      await pool.query('DELETE FROM users WHERE id = $1', [tempId]);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
