const express = require('express');
const { query, get, run } = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

const VALID_STATUSES = ['Not Started', 'In Progress', 'Completed'];

// Apply auth middleware to all project endpoints
router.use(authenticateToken);

// GET /api/projects - List all projects for authenticated user with search & status filter
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { search, status } = req.query;

    let sql = 'SELECT * FROM projects WHERE user_id = ?';
    const params = [userId];

    if (search) {
      sql += ' AND project_name LIKE ?';
      params.push(`%${search}%`);
    }

    if (status && VALID_STATUSES.includes(status)) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const projects = await query(sql, params);
    
    // Attach task summary counts to each project
    const projectsWithTaskCounts = await Promise.all(
      projects.map(async (project) => {
        const counts = await get(
          `SELECT 
            COUNT(*) as total_tasks,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks
           FROM tasks WHERE project_id = ?`,
          [project.id]
        );
        return {
          ...project,
          total_tasks: counts.total_tasks || 0,
          completed_tasks: counts.completed_tasks || 0
        };
      })
    );

    res.status(200).json(projectsWithTaskCounts);
  } catch (error) {
    console.error('Fetch Projects Error:', error);
    res.status(500).json({ error: 'Internal server error fetching projects.' });
  }
});

// GET /api/projects/:id - Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;

    const project = await get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied.' });
    }

    const tasks = await query('SELECT * FROM tasks WHERE project_id = ? AND user_id = ? ORDER BY created_at DESC', [projectId, userId]);

    res.status(200).json({
      ...project,
      tasks
    });
  } catch (error) {
    console.error('Fetch Single Project Error:', error);
    res.status(500).json({ error: 'Internal server error fetching project details.' });
  }
});

// POST /api/projects - Create a new project
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { project_name, description, status, start_date, end_date } = req.body;

    if (!project_name || !project_name.trim()) {
      return res.status(400).json({ error: 'Project name is required.' });
    }

    const projectStatus = status && VALID_STATUSES.includes(status) ? status : 'Not Started';

    const result = await run(
      `INSERT INTO projects (user_id, project_name, description, status, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, project_name.trim(), description || '', projectStatus, start_date || null, end_date || null]
    );

    const createdProject = await get('SELECT * FROM projects WHERE id = ?', [result.lastID]);

    res.status(201).json(createdProject);
  } catch (error) {
    console.error('Create Project Error:', error);
    res.status(500).json({ error: 'Internal server error creating project.' });
  }
});

// PUT /api/projects/:id - Edit project
router.get('/:id', async (req, res) => {
  // handled above
});

router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;

    const existing = await get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found or access denied.' });
    }

    const { project_name, description, status, start_date, end_date } = req.body;

    const updatedName = project_name !== undefined ? project_name.trim() : existing.project_name;
    const updatedDesc = description !== undefined ? description : existing.description;
    const updatedStatus = status && VALID_STATUSES.includes(status) ? status : existing.status;
    const updatedStartDate = start_date !== undefined ? start_date : existing.start_date;
    const updatedEndDate = end_date !== undefined ? end_date : existing.end_date;

    if (!updatedName) {
      return res.status(400).json({ error: 'Project name cannot be empty.' });
    }

    await run(
      `UPDATE projects 
       SET project_name = ?, description = ?, status = ?, start_date = ?, end_date = ?
       WHERE id = ? AND user_id = ?`,
      [updatedName, updatedDesc, updatedStatus, updatedStartDate, updatedEndDate, projectId, userId]
    );

    const updatedProject = await get('SELECT * FROM projects WHERE id = ?', [projectId]);

    res.status(200).json(updatedProject);
  } catch (error) {
    console.error('Update Project Error:', error);
    res.status(500).json({ error: 'Internal server error updating project.' });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;

    const existing = await get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found or access denied.' });
    }

    // Delete associated tasks first (or cascade via DB foreign keys)
    await run('DELETE FROM tasks WHERE project_id = ? AND user_id = ?', [projectId, userId]);
    await run('DELETE FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);

    res.status(200).json({ message: 'Project and all associated tasks deleted successfully.' });
  } catch (error) {
    console.error('Delete Project Error:', error);
    res.status(500).json({ error: 'Internal server error deleting project.' });
  }
});

module.exports = router;
