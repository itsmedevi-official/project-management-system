import React, { useState, useEffect } from 'react';
import { fetchApi } from '../utils/api';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  CheckSquare, 
  Calendar,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [formData, setFormData] = useState({
    project_id: '',
    task_name: '',
    description: '',
    priority: 'Medium',
    status: 'Pending',
    due_date: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjectsList();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [search, statusFilter, priorityFilter, projectFilter]);

  const fetchProjectsList = async () => {
    try {
      const data = await fetchApi('/projects');
      setProjects(data);
      if (data.length > 0 && !formData.project_id) {
        setFormData(prev => ({ ...prev, project_id: data[0].id }));
      }
    } catch (err) {
      console.error('Failed to load project list for task assignment:', err);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (statusFilter) queryParams.append('status', statusFilter);
      if (priorityFilter) queryParams.append('priority', priorityFilter);
      if (projectFilter) queryParams.append('project_id', projectFilter);

      const data = await fetchApi(`/tasks?${queryParams.toString()}`);
      setTasks(data);
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        project_id: task.project_id,
        task_name: task.task_name,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        due_date: task.due_date || ''
      });
    } else {
      setEditingTask(null);
      setFormData({
        project_id: projects.length > 0 ? projects[0].id : '',
        task_name: '',
        description: '',
        priority: 'Medium',
        status: 'Pending',
        due_date: ''
      });
    }
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.project_id) {
      setError('Please select or create a project first.');
      return;
    }

    try {
      if (editingTask) {
        await fetchApi(`/tasks/${editingTask.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await fetchApi('/tasks', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      loadTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await fetchApi(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...task, status: newStatus })
      });
      loadTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await fetchApi(`/tasks/${id}`, { method: 'DELETE' });
      loadTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Tasks</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Organize, filter, and complete your individual task items.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => handleOpenModal()}
          disabled={projects.length === 0}
        >
          <Plus size={18} />
          <span>Create Task</span>
        </button>
      </div>

      {projects.length === 0 && (
        <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <span>You need to create at least one project before you can create tasks.</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Project Filter */}
        <div style={{ width: '180px' }}>
          <select
            className="form-select"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.project_name}</option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div style={{ width: '150px' }}>
          <select
            className="form-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ width: '150px' }}>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <div className="spinner" style={{ width: '36px', height: '36px' }} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <CheckSquare size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h3>No tasks found</h3>
          <p style={{ marginTop: '0.25rem' }}>Create a task or change your filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tasks.map((task) => (
            <div
              key={task.id}
              className="glass-panel"
              style={{
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                opacity: task.status === 'Completed' ? 0.75 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <button
                  onClick={() => handleToggleComplete(task)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.status === 'Completed' ? 'var(--success)' : 'var(--text-muted)' }}
                >
                  <CheckCircle2 size={24} />
                </button>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      textDecoration: task.status === 'Completed' ? 'line-through' : 'none'
                    }}>
                      {task.task_name}
                    </h3>
                    <span className={`badge badge-${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                    <span className={`badge badge-${task.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {task.status}
                    </span>
                  </div>

                  {task.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {task.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    <span>Project: <strong>{task.project_name}</strong></span>
                    {task.due_date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} />
                        <span>Due: {task.due_date}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => handleOpenModal(task)}>
                  <Edit3 size={14} />
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem', color: '#ef4444', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Associated Project *</label>
                <select
                  className="form-select"
                  required
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.project_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Task Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Design Wireframes"
                  value={formData.task_name}
                  onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  placeholder="Detailed task instructions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
