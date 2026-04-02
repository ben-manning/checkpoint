const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const pool = require('../db');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

let testUser;
let otherUser;
let token;
let otherToken;

beforeAll(async () => {
  // Create two test users directly in the DB
  const userRes = await pool.query(
    "INSERT INTO users (name, email, password_hash) VALUES ('Test User', 'projects-test@example.com', 'hashed') RETURNING id, name, email"
  );
  testUser = userRes.rows[0];
  token = generateToken(testUser.id);

  const otherRes = await pool.query(
    "INSERT INTO users (name, email, password_hash) VALUES ('Other User', 'projects-other@example.com', 'hashed') RETURNING id, name, email"
  );
  otherUser = otherRes.rows[0];
  otherToken = generateToken(otherUser.id);
});

afterAll(async () => {
  // Clean up test data
  await pool.query('DELETE FROM projects WHERE user_id = $1 OR user_id = $2', [testUser.id, otherUser.id]);
  await pool.query('DELETE FROM users WHERE id = $1 OR id = $2', [testUser.id, otherUser.id]);
  await pool.end();
});

describe('Projects API', () => {
  let projectId;

  describe('POST /api/projects', () => {
    it('should create a project', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test Project', description: 'A test', status: 'active' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Test Project');
      expect(res.body.description).toBe('A test');
      expect(res.body.status).toBe('active');
      expect(res.body.user_id).toBe(testUser.id);
      projectId = res.body.id;
    });

    it('should default status to active when not provided', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Default Status Project' });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('active');

      // Clean up
      await pool.query('DELETE FROM projects WHERE id = $1', [res.body.id]);
    });

    it('should return 400 when title is missing', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'No title' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/title/i);
    });

    it('should return 401 without a token', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({ title: 'No Auth' });

      expect(res.statusCode).toBe(401);
    });

    it('should use the authenticated user id, not a body-supplied user_id', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Owned Project', user_id: otherUser.id });

      expect(res.statusCode).toBe(201);
      expect(res.body.user_id).toBe(testUser.id);

      await pool.query('DELETE FROM projects WHERE id = $1', [res.body.id]);
    });
  });

  describe('GET /api/projects', () => {
    it('should return projects for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body.every((p) => p.user_id === testUser.id)).toBe(true);
    });

    it('should not return other users projects', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.every((p) => p.user_id === otherUser.id)).toBe(true);
      expect(res.body.find((p) => p.id === projectId)).toBeUndefined();
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return a project by id for the owner', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(projectId);
      expect(res.body.title).toBe('Test Project');
    });

    it('should return 404 when another user requests the project', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.statusCode).toBe(404);
    });

    it('should return 404 for a non-existent project', async () => {
      const res = await request(app)
        .get('/api/projects/999999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update a project', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title', status: 'on-hold' });

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Updated Title');
      expect(res.body.status).toBe('on-hold');
    });

    it('should return 404 when another user tries to update', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hijacked' });

      expect(res.statusCode).toBe(404);

      // Verify it was not actually changed
      const check = await pool.query('SELECT title FROM projects WHERE id = $1', [projectId]);
      expect(check.rows[0].title).toBe('Updated Title');
    });

    it('should return 404 for a non-existent project', async () => {
      const res = await request(app)
        .put('/api/projects/999999')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Ghost' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should return 404 when another user tries to delete', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.statusCode).toBe(404);

      // Verify it still exists
      const check = await pool.query('SELECT id FROM projects WHERE id = $1', [projectId]);
      expect(check.rowCount).toBe(1);
    });

    it('should delete a project', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);
    });

    it('should return 404 when deleting an already-deleted project', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
