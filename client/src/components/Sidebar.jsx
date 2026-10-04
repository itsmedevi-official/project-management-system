import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  LogOut, 
  User as UserIcon,
  Sparkles 
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.5rem 1.5rem 0.5rem', borderBottom: '1px solid var(--bg-card-border)', marginBottom: '1.5rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.2 }}>TaskFlow</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Project Manager</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `btn btn-secondary ${isActive ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) => `btn btn-secondary ${isActive ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <FolderKanban size={18} />
            <span>Projects</span>
          </NavLink>

          <NavLink
            to="/tasks"
            className={({ isActive }) => `btn btn-secondary ${isActive ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <CheckSquare size={18} />
            <span>Tasks</span>
          </NavLink>
        </nav>
      </div>

      <div style={{ borderTop: '1px solid var(--bg-card-border)', pt: '1rem', paddingTop: '1rem' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0.5rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              fontWeight: 600
            }}>
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon size={16} />}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)' }}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
