require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const projectTasksRoutes = require('./routes/projectTasksRoutes');
const projectsRoutes = require('./routes/projectsRoutes');
const tasksRoutes = require('./routes/tasksRoutes');
const errorHandler = require('./middleware/errorHandler');
const verifyToken = require('./middleware/verifyToken');
require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

const parseOrigins = (value) =>
  (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = [
  ...parseOrigins(process.env.CLIENT_URL),
  ...parseOrigins(process.env.VERCEL_FRONTEND_URL),
  ...parseOrigins(process.env.ALLOWED_ORIGINS),
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Non-browser requests (no Origin header) should pass through.
  if (!origin) {
    return next();
  }

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    return next();
  }

  if (req.method === 'OPTIONS') {
    return res.status(403).json({ message: 'CORS origin not allowed' });
  }

  return res.status(403).json({ message: 'CORS origin not allowed' });
});

app.use(cors({ credentials: true }));
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', verifyToken, projectsRoutes);
app.use('/api/projects/:id/tasks', verifyToken, projectTasksRoutes);
app.use('/api/tasks', verifyToken, tasksRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
