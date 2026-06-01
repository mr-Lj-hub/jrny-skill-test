const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://admin:password123@localhost:5432/taskflow'
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.log('Unexpected database error', err);
});

// function query(text, params) {
//   return pool.query(text, params);
// }

module.exports = pool;
