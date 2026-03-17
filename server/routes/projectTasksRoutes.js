const express = require('express');
const {
  getTasksByProjectId,
  createTask,
} = require('../controllers/tasksController');

const router = express.Router({ mergeParams: true });

router.get('/', getTasksByProjectId);
router.post('/', createTask);

module.exports = router;