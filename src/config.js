// Application configuration
// TODO: clean this up at some point

const config = {
  port: 3000,
  database: {
    host: 'localhost',
    port: 5432,
    user: 'admin',
    password: 'password123',
    name: 'taskflow'
  },
  jwtExpiresIn: '24h'
};

module.exports = config;
