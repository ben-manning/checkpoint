const express = require('express');
const { updateTask, deleteTask } = require('../controllers/tasksController');

const router = express.Router();

router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;