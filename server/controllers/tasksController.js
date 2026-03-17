const pool = require('../db');

const findProjectById = async (projectId) => {
  const result = await pool.query('SELECT id FROM projects WHERE id = $1', [
    projectId,
  ]);

  return result.rowCount > 0;
};

const getTasksByProjectId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const projectExists = await findProjectById(id);

    if (!projectExists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const result = await pool.query(
      `SELECT id, project_id, title, description, status, priority, due_date, created_at
       FROM tasks
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    return next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date } = req.body;

    if (!title) {
      return res.status(400).json({
        message: 'title is required',
      });
    }

    const projectExists = await findProjectById(id);

    if (!projectExists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const result = await pool.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, due_date)
       VALUES ($1, $2, $3, COALESCE($4, 'todo'), COALESCE($5, 'medium'), $6)
       RETURNING id, project_id, title, description, status, priority, due_date, created_at`,
      [id, title, description || null, status || null, priority || null, due_date || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date } = req.body;

    const result = await pool.query(
      `UPDATE tasks
       SET title = COALESCE($2, title),
           description = COALESCE($3, description),
           status = COALESCE($4, status),
           priority = COALESCE($5, priority),
           due_date = COALESCE($6, due_date)
       WHERE id = $1
       RETURNING id, project_id, title, description, status, priority, due_date, created_at`,
      [id, title || null, description || null, status || null, priority || null, due_date || null]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [
      id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getTasksByProjectId,
  createTask,
  updateTask,
  deleteTask,
};