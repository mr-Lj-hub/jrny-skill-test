const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');
const {
  createTaskRules,
  updateTaskRules,
  deleteTaskRules,
} = require('../middleware/validate');

const router = express.Router();

// GET /api/tasks — list all tasks for authenticated user
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks — create a task
router.post('/', authMiddleware, createTaskRules, async (req, res, next) => {
  try {
    const { title, description, status } = req.body;

    const allowedStatuses = ['pending', 'in_progress', 'completed'];
    const taskStatus = allowedStatuses.includes(status) ? status : 'pending';

    const result = await pool.query(
      'INSERT INTO tasks (user_id, title, description, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, title.trim(), description || '', taskStatus]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id — update a task
router.put('/:id', authMiddleware, updateTaskRules, async (req, res, next) => {
  try {
    const { title, description, status } = req.body;
    const result = await pool.query(
      'UPDATE tasks SET title = $1, description = $2, status = $3, updated_at = NOW() WHERE id = $4 AND user_id = $5 RETURNING *',
      [title, description, status, req.params.id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id — delete a task
// FIXED: was using string concatenation (SQL injection) — now parameterized
router.delete('/:id', authMiddleware, deleteTaskRules, async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
