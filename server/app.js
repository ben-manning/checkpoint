require('dotenv').config();

const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/healthRoutes');
const projectTasksRoutes = require('./routes/projectTasksRoutes');
const projectsRoutes = require('./routes/projectsRoutes');
const tasksRoutes = require('./routes/tasksRoutes');
const errorHandler = require('./middleware/errorHandler');
require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/projects/:id/tasks', projectTasksRoutes);
app.use('/api/tasks', tasksRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
