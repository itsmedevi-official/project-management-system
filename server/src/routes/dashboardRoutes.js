const express = require('express');
const { get } = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    const projectStats = await get(
      `SELECT 
        COUNT(*) as total_projects,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as projects_in_progress,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_projects,
        SUM(CASE WHEN status = 'Not Started' THEN 1 ELSE 0 END) as not_started_projects
       FROM projects WHERE user_id = ?`,
      [userId]
    );

    const taskStats = await get(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tasks
       FROM tasks WHERE user_id = ?`,
      [userId]
    );

    res.status(200).json({
      totalProjects: projectStats.total_projects || 0,
      projectsInProgress: projectStats.projects_in_progress || 0,
      completedProjects: projectStats.completed_projects || 0,
      notStartedProjects: projectStats.not_started_projects || 0,
      totalTasks: taskStats.total_tasks || 0,
      completedTasks: taskStats.completed_tasks || 0,
      pendingTasks: taskStats.pending_tasks || 0,
      inProgressTasks: taskStats.in_progress_tasks || 0
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ error: 'Internal server error fetching dashboard statistics.' });
  }
});

module.exports = router;
