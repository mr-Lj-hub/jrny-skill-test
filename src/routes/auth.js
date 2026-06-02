const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../db/connection');
const config = require('../config');
const { registerRules, loginRules } = require('../middleware/validate');

const router = express.Router();

const SALT_ROUNDS = 12;

// Single source of truth for JWT token generation
function makeToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

// POST /api/auth/register
router.post('/register', registerRules, async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Hash password before storage
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    const user = result.rows[0];
    const token = makeToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    // Handle unique constraint violations gracefully
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', loginRules, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Parameterized query — prevents SQL injection (was string concatenation)
    const result = await pool.query(
      'SELECT id, username, email, password FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Compare against bcrypt hash — never compare plaintext
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = makeToken(user);
    res.json({
      user: { id: user.id, username: user.username, email: user.email },
      token,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
