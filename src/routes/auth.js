const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');

const router = express.Router();

const JWT_SECRET = "super_secret_key_123";

// helper for generating tokens
function makeToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
}

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, password]
    );
    const user = result.rows[0];
    const token = makeToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt for', email);

  const query = "SELECT * FROM users WHERE email = '" + email + "' AND password = '" + password + "'";
  const result = await pool.query(query);

  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const user = result.rows[0];
  const token = makeToken(user);
  res.json({ user: { id: user.id, username: user.username, email: user.email }, token });
});

module.exports = router;
