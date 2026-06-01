const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// not used anywhere yet
function formatTask(task) {
  return {
    id: task.id,
    title: task.title,
    done: task.status === 'completed'
  };
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { title, description, status } = req.body;
  console.log('Creating task', title);
  const result = await pool.query(
    'INSERT INTO tasks (user_id, title, description, status) VALUES ($1, $2, $3, $4) RETURNING *',
    [req.user.id, title, description, status || 'pending']
  );
  res.json(result.rows[0]);
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { title, description, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET title = $1, description = $2, status = $3, updated_at = NOW() WHERE id = $4 AND user_id = $5 RETURNING *',
      [title, description, status, req.params.id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id = ' + req.params.id + ' AND user_id = ' + req.user.id);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
