import React, { useState, useEffect } from 'react';
import { fetchApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  FolderKanban, 
  CheckSquare, 
  Clock, 
  CheckCircle, 
  PlayCircle,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, projectsData] = await Promise.all([
        fetchApi('/dashboard/stats'),
        fetchApi('/projects')
      ]);
      setStats(statsData);
      setRecentProjects(projectsData.slice(0, 4));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Dashboard Overview</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user?.full_name}! Here is what's happening today.</p>
        </div>
        <Link to="/projects" className="btn btn-primary">
          <Plus size={18} />
          <span>New Project</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
            <FolderKanban size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Projects</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.totalProjects || 0}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <CheckSquare size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Tasks</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.totalTasks || 0}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Completed Tasks</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.completedTasks || 0}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Pending Tasks</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.pendingTasks || 0}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
            <PlayCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Projects In Progress</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.projectsInProgress || 0}</div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Active Projects</h2>
          <Link to="/projects" style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
            <span>View All</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
            <FolderKanban size={40} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
            <p>No projects created yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {recentProjects.map((project) => {
              const progressPct = project.total_tasks > 0 
                ? Math.round((project.completed_tasks / project.total_tasks) * 100)
                : 0;

              return (
                <div key={project.id} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--bg-card-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{project.project_name}</h3>
                    <span className={`badge badge-${project.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {project.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', height: '2.5em', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {project.description || 'No description provided.'}
                  </p>

                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      <span>Progress</span>
                      <span>{progressPct}% ({project.completed_tasks}/{project.total_tasks} tasks)</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)', transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
