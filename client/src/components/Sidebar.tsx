import React from 'react';

interface SidebarProps {
  role: 'faculty' | 'student';
  userName: string;
  activePage: string;
  setActivePage: (page: string) => void;
  handleLogout: () => void;
  pendingTasksCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ role, userName, activePage, setActivePage, handleLogout, pendingTasksCount }) => {
  return (
    <div className="sidebar">
      <div className="brand">
        Lumina <span className="text-muted" style={{ fontWeight: 400 }}>Academic</span>
      </div>
      <div className="nav-menu">
        <label className="label mb-4">Main Navigation</label>
        {role === 'faculty' ? (
          <>
            <div className={`nav-item ${activePage === 'f-dashboard' ? 'active' : ''}`} onClick={() => setActivePage('f-dashboard')}>
              Dashboard
            </div>
            <div className={`nav-item ${activePage === 'f-courses' ? 'active' : ''}`} onClick={() => setActivePage('f-courses')}>
              Manage Courses
            </div>
            <div className={`nav-item ${activePage === 'f-tasks' ? 'active' : ''}`} onClick={() => setActivePage('f-tasks')}>
              Manage Tasks
            </div>
            <div className={`nav-item ${activePage === 'f-doubts' ? 'active' : ''}`} onClick={() => setActivePage('f-doubts')}>
              Answer Doubts
            </div>
            <div className={`nav-item ${activePage === 'f-reports' ? 'active' : ''}`} onClick={() => setActivePage('f-reports')}>
              Reports
            </div>
            <div className={`nav-item ${activePage === 'f-notifications' ? 'active' : ''}`} onClick={() => setActivePage('f-notifications')}>
              Notifications
            </div>
          </>
        ) : (
          <>
            <div className={`nav-item ${activePage === 's-dashboard' ? 'active' : ''}`} onClick={() => setActivePage('s-dashboard')}>
              Dashboard
            </div>
            <div className={`nav-item ${activePage === 's-tasks' ? 'active' : ''}`} onClick={() => setActivePage('s-tasks')}>
              My Tasks
            </div>
            <div className={`nav-item ${activePage === 's-doubts' ? 'active' : ''}`} onClick={() => setActivePage('s-doubts')}>
              Raise a Doubt
            </div>
            <div className={`nav-item ${activePage === 's-notifications' ? 'active' : ''}`} onClick={() => setActivePage('s-notifications')}>
              Notifications
              {pendingTasksCount > 0 && (
                <span className="badge badge-pending" style={{ marginLeft: 'auto' }}>{pendingTasksCount}</span>
              )}
            </div>
          </>
        )}
      </div>
      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--outline)', paddingTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ maxWidth: '160px' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
          <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{role === 'faculty' ? 'Faculty' : 'Student'}</div>
        </div>
        <button className="btn-ghost" onClick={handleLogout} style={{ border: 'none', cursor: 'pointer', fontSize: '1rem' }}>⏻</button>
      </div>
    </div>
  );
};

export default Sidebar;
