const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const healthRoutes = require('./routes/health');

const app = express();

// ── Security headers (Helmet) ──
app.use(helmet());

// ── CORS — restricted to known origins ──
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000'],
    credentials: true,
  })
);

// ── Rate limiting on auth endpoints (brute-force protection) ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

// ── Body parsing (built-in, replaces body-parser) ──
app.use(express.json({ limit: '10kb' }));

// ── Static files ──
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Routes ──
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/health', healthRoutes);

// ── Global error handler (sanitized — never leaks stack traces) ──
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.message}`);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error' : err.message,
  });
});

// ── Startup ──
const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`TaskFlow server running on port ${PORT}`);
});

// ── Graceful shutdown ──
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully');
  server.close(() => process.exit(0));
});

// ── Safety net for unhandled rejections (log, don't crash) ──
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

module.exports = app;
