const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');

const config = require('./config');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const healthRoutes = require('./routes/health');

const app = express();

app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/health', healthRoutes);

app.use((err, req, res, next) => {
  console.log('Something went wrong:', err.message);
  res.status(500).json({ error: err.message, stack: err.stack });
});

const PORT = config.port || 3000;

app.listen(PORT, () => {
  console.log('TaskFlow server running on port ' + PORT);
});

module.exports = app;
