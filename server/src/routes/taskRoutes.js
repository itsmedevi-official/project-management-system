const express = require('express');
const { query, get, run } = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

const VALID_PRIORITIES = ['Low', 'Medium', 'High'];
const VALID_STATUSES = ['Pending', 'In Progress', 'Completed'];

router.use(authenticateToken);

// GET /api/tasks - List tasks for authenticated user with search & filters
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { search, status, priority, project_id } = req.query;

    let sql = `
      SELECT t.*, p.project_name 
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.user_id = ?
    `;
    const params = [userId];

    if (project_id) {
      sql += ' AND t.project_id = ?';
      params.push(project_id);
    }

    if (search) {
      sql += ' AND t.task_name LIKE ?';
      params.push(`%${search}%`);
    }

    if (status && VALID_STATUSES.includes(status)) {
      sql += ' AND t.status = ?';
      params.push(status);
    }

    if (priority && VALID_PRIORITIES.includes(priority)) {
      sql += ' AND t.priority = ?';
      params.push(priority);
    }

    sql += ' ORDER BY t.created_at DESC';

    const tasks = await query(sql, params);
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Fetch Tasks Error:', error);
    res.status(500).json({ error: 'Internal server error fetching tasks.' });
  }
});

// GET /api/tasks/:id - Get single task
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    const task = await get(
      `SELECT t.*, p.project_name 
       FROM tasks t 
       JOIN projects p ON t.project_id = p.id 
       WHERE t.id = ? AND t.user_id = ?`,
      [taskId, userId]
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found or access denied.' });
    }

    res.status(200).json(task);
  } catch (error) {
    console.error('Fetch Task Error:', error);
    res.status(500).json({ error: 'Internal server error fetching task.' });
  }
});

// POST /api/tasks - Create task under a project
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { project_id, task_name, description, priority, status, due_date } = req.body;

    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required.' });
    }
    if (!task_name || !task_name.trim()) {
      return res.status(400).json({ error: 'Task name is required.' });
    }

    // Verify user owns the project
    const project = await get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [project_id, userId]);
    if (!project) {
      return res.status(404).json({ error: 'Associated project not found or access denied.' });
    }

    const taskPriority = priority && VALID_PRIORITIES.includes(priority) ? priority : 'Medium';
    const taskStatus = status && VALID_STATUSES.includes(status) ? status : 'Pending';

    const result = await run(
      `INSERT INTO tasks (project_id, user_id, task_name, description, priority, status, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [project_id, userId, task_name.trim(), description || '', taskPriority, taskStatus, due_date || null]
    );

    const createdTask = await get(
      `SELECT t.*, p.project_name 
       FROM tasks t 
       JOIN projects p ON t.project_id = p.id 
       WHERE t.id = ?`,
      [result.lastID]
    );

    res.status(201).json(createdTask);
  } catch (error) {
    console.error('Create Task Error:', error);
    res.status(500).json({ error: 'Internal server error creating task.' });
  }
});

// PUT /api/tasks/:id - Edit task
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    const existing = await get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found or access denied.' });
    }

    const { task_name, description, priority, status, due_date, project_id } = req.body;

    const updatedName = task_name !== undefined ? task_name.trim() : existing.task_name;
    const updatedDesc = description !== undefined ? description : existing.description;
    const updatedPriority = priority && VALID_PRIORITIES.includes(priority) ? priority : existing.priority;
    const updatedStatus = status && VALID_STATUSES.includes(status) ? status : existing.status;
    const updatedDueDate = due_date !== undefined ? due_date : existing.due_date;
    const updatedProjectId = project_id !== undefined ? project_id : existing.project_id;

    if (!updatedName) {
      return res.status(400).json({ error: 'Task name cannot be empty.' });
    }

    // If changing project_id, check ownership
    if (updatedProjectId !== existing.project_id) {
      const proj = await get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [updatedProjectId, userId]);
      if (!proj) {
        return res.status(400).json({ error: 'Target project not found or access denied.' });
      }
    }

    await run(
      `UPDATE tasks 
       SET project_id = ?, task_name = ?, description = ?, priority = ?, status = ?, due_date = ?
       WHERE id = ? AND user_id = ?`,
      [updatedProjectId, updatedName, updatedDesc, updatedPriority, updatedStatus, updatedDueDate, taskId, userId]
    );

    const updatedTask = await get(
      `SELECT t.*, p.project_name 
       FROM tasks t 
       JOIN projects p ON t.project_id = p.id 
       WHERE t.id = ?`,
      [taskId]
    );

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Update Task Error:', error);
    res.status(500).json({ error: 'Internal server error updating task.' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    const existing = await get('SELECT id FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found or access denied.' });
    }

    await run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);

    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Delete Task Error:', error);
    res.status(500).json({ error: 'Internal server error deleting task.' });
  }
});

module.exports = router;
