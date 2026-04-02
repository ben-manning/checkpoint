const pool = require('../db');

const getProjects = async (req, res, next) => {
  let userId = req.user.userId;
  try {
    const result = await pool.query(
      `SELECT id, user_id, title, description, status, created_at FROM projects WHERE user_id=${userId} ORDER BY created_at DESC`
    );

    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, user_id, title, description, status, created_at FROM projects WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const { user_id, title, description, status } = req.body;

    if (!user_id || !title) {
      return res.status(400).json({
        message: 'user_id and title are required',
      });
    }

    const result = await pool.query(
      `INSERT INTO projects (user_id, title, description, status)
       VALUES ($1, $2, $3, COALESCE($4, 'active'))
       RETURNING id, user_id, title, description, status, created_at`,
      [user_id, title, description || null, status || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    const result = await pool.query(
      `UPDATE projects
       SET title = COALESCE($2, title),
           description = COALESCE($3, description),
           status = COALESCE($4, status)
       WHERE id = $1
       RETURNING id, user_id, title, description, status, created_at`,
      [id, title || null, description || null, status || null]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
