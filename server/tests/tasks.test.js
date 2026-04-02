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
let testProjectId;
let otherProjectId;

beforeAll(async () => {
  const userRes = await pool.query(
    "INSERT INTO users (name, email, password_hash) VALUES ('Tasks User', 'tasks-test@example.com', 'hashed') RETURNING id"
  );
  testUser = userRes.rows[0];
  token = generateToken(testUser.id);

  const otherRes = await pool.query(
    "INSERT INTO users (name, email, password_hash) VALUES ('Tasks Other', 'tasks-other@example.com', 'hashed') RETURNING id"
  );
  otherUser = otherRes.rows[0];
  otherToken = generateToken(otherUser.id);

  const projRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Tasks Test Project' });
  testProjectId = projRes.body.id;

  const otherProjRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${otherToken}`)
    .send({ title: 'Other Tasks Project' });
  otherProjectId = otherProjRes.body.id;
});

afterAll(async () => {
  await pool.query('DELETE FROM projects WHERE user_id = $1 OR user_id = $2', [
    testUser.id,
    otherUser.id,
  ]);
  await pool.query('DELETE FROM users WHERE id = $1 OR id = $2', [testUser.id, otherUser.id]);
  await pool.end();
});

describe('Tasks API', () => {
  let taskId;

  describe('POST /api/projects/:id/tasks', () => {
    it('should create a task', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test Task', description: 'A task', status: 'in-progress', priority: 'high' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Test Task');
      expect(res.body.project_id).toBe(testProjectId);
      taskId = res.body.id;
    });

    it('should include all expected fields in the task response', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Fields Task', description: 'check fields', priority: 'low' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('project_id', testProjectId);
      expect(res.body).toHaveProperty('title', 'Fields Task');
      expect(res.body).toHaveProperty('description', 'check fields');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('priority', 'low');
      expect(res.body).toHaveProperty('due_date');
      expect(res.body).toHaveProperty('created_at');
      expect(new Date(res.body.created_at).getTime()).not.toBeNaN();

      await pool.query('DELETE FROM tasks WHERE id = $1', [res.body.id]);
    });

    it('should set description to null when not provided', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'No Description Task' });

      expect(res.statusCode).toBe(201);
      expect(res.body.description).toBeNull();

      await pool.query('DELETE FROM tasks WHERE id = $1', [res.body.id]);
    });

    it('should default status to todo when not provided', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Default Status Task' });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('todo');

      await pool.query('DELETE FROM tasks WHERE id = $1', [res.body.id]);
    });

    it('should default priority to medium when not provided', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Default Priority Task' });

      expect(res.statusCode).toBe(201);
      expect(res.body.priority).toBe('medium');

      await pool.query('DELETE FROM tasks WHERE id = $1', [res.body.id]);
    });

    it('should accept and return a due_date', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Dated Task', due_date: '2026-12-31' });

      expect(res.statusCode).toBe(201);
      expect(res.body.due_date).toBeTruthy();
      const returned = new Date(res.body.due_date);
      expect(returned.getUTCFullYear()).toBe(2026);
      expect(returned.getUTCMonth()).toBe(11); // December
      expect(returned.getUTCDate()).toBe(31);

      await pool.query('DELETE FROM tasks WHERE id = $1', [res.body.id]);
    });

    it('should return 400 when title is missing', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'No title' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/title/i);
    });

    it('should return 404 when the project belongs to another user', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/tasks`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Unauthorized Task' });

      expect(res.statusCode).toBe(404);
    });

    it('should return 404 for a non-existent project', async () => {
      const res = await request(app)
        .post('/api/projects/999999/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Ghost Task' });

      expect(res.statusCode).toBe(404);
    });

    it('should return 401 without a token', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/tasks`)
        .send({ title: 'No Auth Task' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/projects/:id/tasks', () => {
    it('should return 200 with an empty array when the project has no tasks', async () => {
      const projRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Empty Project' });
      const emptyProjectId = projRes.body.id;

      const res = await request(app)
        .get(`/api/projects/${emptyProjectId}/tasks`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);

      await pool.query('DELETE FROM projects WHERE id = $1', [emptyProjectId]);
    });

    it('should return 200 with all tasks for the project', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/tasks`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body.every((t) => t.project_id === testProjectId)).toBe(true);
    });

    it('should return all expected fields for each task', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/tasks`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const task = res.body[0];
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('project_id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('description');
      expect(task).toHaveProperty('status');
      expect(task).toHaveProperty('priority');
      expect(task).toHaveProperty('due_date');
      expect(task).toHaveProperty('created_at');
    });

    it('should not return tasks from a different project', async () => {
      const otherTaskRes = await request(app)
        .post(`/api/projects/${otherProjectId}/tasks`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Other Project Task' });
      const otherTaskId = otherTaskRes.body.id;

      const res = await request(app)
        .get(`/api/projects/${testProjectId}/tasks`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.find((t) => t.id === otherTaskId)).toBeUndefined();

      await pool.query('DELETE FROM tasks WHERE id = $1', [otherTaskId]);
    });

    it('should return tasks ordered newest-first', async () => {
      const secondRes = await request(app)
        .post(`/api/projects/${testProjectId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Ordering Task' });
      const secondTaskId = secondRes.body.id;

      const res = await request(app)
        .get(`/api/projects/${testProjectId}/tasks`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      const timestamps = res.body.map((t) => new Date(t.created_at).getTime());
      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
      }

      await pool.query('DELETE FROM tasks WHERE id = $1', [secondTaskId]);
    });

    it('should return 404 when the project belongs to another user', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/tasks`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.statusCode).toBe(404);
    });

    it('should return 404 for a non-existent project', async () => {
      const res = await request(app)
        .get('/api/projects/999999/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).get(`/api/projects/${testProjectId}/tasks`);
      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should return 200 with updated fields on success', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Task', status: 'done' });

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Updated Task');
      expect(res.body.status).toBe('done');
    });

    it('should preserve unset fields on a partial update', async () => {
      const before = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
      const { description, status, priority } = before.rows[0];

      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Partial Update Title' });

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Partial Update Title');
      expect(res.body.description).toBe(description);
      expect(res.body.status).toBe(status);
      expect(res.body.priority).toBe(priority);
    });

    it('should update status alone', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in-progress' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('in-progress');
    });

    it('should update priority alone', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ priority: 'low' });

      expect(res.statusCode).toBe(200);
      expect(res.body.priority).toBe('low');
    });

    it('should update due_date alone', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ due_date: '2026-06-01' });

      expect(res.statusCode).toBe(200);
      expect(res.body.due_date).toBeTruthy();
      const returned = new Date(res.body.due_date);
      expect(returned.getUTCFullYear()).toBe(2026);
      expect(returned.getUTCMonth()).toBe(5); // June
      expect(returned.getUTCDate()).toBe(1);
    });

    it('should return 404 when the task does not exist', async () => {
      const res = await request(app)
        .put('/api/tasks/999999')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Ghost' });

      expect(res.statusCode).toBe(404);
    });

    it("should return 404 when the task belongs to another user's project", async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hijacked' });

      expect(res.statusCode).toBe(404);
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).put(`/api/tasks/${taskId}`).send({ title: 'No Auth' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it("should return 404 when the task belongs to another user's project", async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.statusCode).toBe(404);

      const check = await pool.query('SELECT id FROM tasks WHERE id = $1', [taskId]);
      expect(check.rowCount).toBe(1);
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).delete(`/api/tasks/${taskId}`);
      expect(res.statusCode).toBe(401);
    });

    it('should return 404 when the task does not exist', async () => {
      const res = await request(app)
        .delete('/api/tasks/999999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });

    it('should delete a task and return 200', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);
    });

    it('should return 404 when deleting an already-deleted task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('Cascade delete', () => {
    it('should delete all tasks when their parent project is deleted', async () => {
      const projRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Cascade Project' });
      const cascadeProjectId = projRes.body.id;

      const taskRes = await request(app)
        .post(`/api/projects/${cascadeProjectId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Cascade Task' });
      const cascadeTaskId = taskRes.body.id;

      await request(app)
        .delete(`/api/projects/${cascadeProjectId}`)
        .set('Authorization', `Bearer ${token}`);

      const check = await pool.query('SELECT id FROM tasks WHERE id = $1', [cascadeTaskId]);
      expect(check.rowCount).toBe(0);
    });
  });
});
