import React, { useState, useEffect } from 'react';

const UniTaskApp: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<'faculty' | 'student'>('faculty');
  const [activePage, setActivePage] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize view and role-specific data based on login state
  useEffect(() => {
    setActivePage(role === 'faculty' ? 'f-dashboard' : 's-dashboard');
  }, [isLoggedIn, role]);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  const FacultyNav = (
    <div className="nav-section">
      <div className="nav-label">Main</div>
      <div className={`nav-item ${activePage === 'f-dashboard' ? 'active' : ''}`} onClick={() => setActivePage('f-dashboard')}><span className="icon">⊞</span>Dashboard</div>
      <div className={`nav-item ${activePage === 'f-tasks' ? 'active' : ''}`} onClick={() => setActivePage('f-tasks')}><span className="icon">✦</span>Manage Tasks</div>
      <div className={`nav-item ${activePage === 'f-evaluate' ? 'active' : ''}`} onClick={() => setActivePage('f-evaluate')}><span className="icon">◈</span>Evaluate <span className="nav-badge">5</span></div>
    </div>
  );

  const StudentNav = (
    <div className="nav-section">
      <div className="nav-label">Main</div>
      <div className={`nav-item ${activePage === 's-dashboard' ? 'active' : ''}`} onClick={() => setActivePage('s-dashboard')}><span className="icon">⊞</span>Dashboard</div>
      <div className={`nav-item ${activePage === 's-tasks' ? 'active' : ''}`} onClick={() => setActivePage('s-tasks')}><span className="icon">✦</span>My Tasks <span className="nav-badge">3</span></div>
    </div>
  );

  if (!isLoggedIn) {
    return (
      <div id="login-screen">
        <style>{styles}</style>
        <div className="login-card">
          <div className="login-logo">UniTask</div>
          <div className="login-sub">University Task Management System</div>
          <div className="role-toggle">
            <button className={`role-btn ${role === 'faculty' ? 'active' : ''}`} onClick={() => setRole('faculty')}>👩‍🏫 Faculty</button>
            <button className={`role-btn ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>🎓 Student</button>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="text" defaultValue={role === 'faculty' ? 'prof.sarah@university.edu' : 'john.doe@student.edu'} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" defaultValue="••••••••" />
          </div>
          <button className="login-btn" onClick={handleLogin}>Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div id="app" style={{ display: 'block' }}>
      <style>{styles}</style>
      <div className="layout">
        <nav className="sidebar">
          <div className="sidebar-logo">
            <span>UniTask</span>
            <span style={{ fontSize: '0.7rem', fontFamily: 'DM Mono, monospace', color: 'var(--accent)' }}>
              ● {role.toUpperCase()}
            </span>
          </div>
          <div id="sidebar-nav">
            {role === 'faculty' ? FacultyNav : StudentNav}
          </div>
          <div className="sidebar-user">
            <div className="user-avatar" style={{ background: role === 'faculty' ? '#c4f04520' : '#b39ddb20', color: role === 'faculty' ? 'var(--accent)' : 'var(--student)' }}>
              {role === 'faculty' ? 'PB' : 'JD'}
            </div>
            <div className="user-info">
              <div className="name">{role === 'faculty' ? 'Prof. Baker' : 'John Doe'}</div>
              <div className="role-tag">{role === 'faculty' ? 'Faculty · CS Dept' : 'Student · CSE-3A'}</div>
            </div>
            <div className="logout-btn" onClick={handleLogout}>⏻</div>
          </div>
        </nav>

        <main className="main">
          {activePage === 'f-dashboard' && (
            <div className="page active">
              <div className="page-header">
                <div className="page-title">Good Morning, <span>Prof. Baker</span> 👋</div>
                <div className="page-sub">Monday, 16 March 2026 — 5 submissions awaiting review</div>
              </div>
              <div className="stats-grid">
                <div className="stat-card green"><div className="stat-label">Active Tasks</div><div className="stat-value green">12</div></div>
                <div className="stat-card purple"><div className="stat-label">Students</div><div className="stat-value purple">84</div></div>
                <div className="stat-card red"><div className="stat-label">Pending Review</div><div className="stat-value red">5</div></div>
                <div className="stat-card blue"><div className="stat-label">Avg Score</div><div className="stat-value blue">73%</div></div>
              </div>
            </div>
          )}

          {activePage === 's-dashboard' && (
            <div className="page active">
              <div className="page-header">
                <div className="page-title">Hey, <span>John!</span> 👋</div>
                <div className="page-sub">You have 3 pending tasks</div>
              </div>
              <div className="stats-grid">
                <div className="stat-card blue"><div className="stat-label">Assigned</div><div className="stat-value blue">12</div></div>
                <div className="stat-card green"><div className="stat-label">Completed</div><div className="stat-value green">9</div></div>
                <div className="stat-card red"><div className="stat-label">Pending</div><div className="stat-value red">3</div></div>
                <div className="stat-card purple"><div className="stat-label">Perf. Score</div><div className="stat-value purple">74</div></div>
              </div>
            </div>
          )}
          {/* Add more page conditionals here as needed */}
        </main>
      </div>

      {isModalOpen && (
        <div className="modal-overlay open">
          <div className="modal">
            <div className="modal-title">Create New Task</div>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Global CSS string to maintain original styling within TSX
const styles = `
  :root {
    --bg: #0a0a0f; --surface: #111118; --surface2: #1a1a24;
    --border: #ffffff12; --border2: #ffffff20; --text: #f0eff5;
    --muted: #8884a0; --accent: #c4f045; --accent2: #7c6fcd;
    --danger: #ff5e5e; --warn: #ffba3b; --info: #4fc3f7;
    --success: #69f0ae; --faculty: #c4f045; --student: #b39ddb;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: 'Syne', sans-serif; }
  #login-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  .login-card { background: var(--surface); border: 1px solid var(--border2); border-radius: 20px; padding: 48px 40px; width: 420px; }
  .login-logo { font-family: 'DM Serif Display', serif; font-size: 2.2rem; color: var(--accent); margin-bottom: 6px; }
  .role-toggle { display: flex; background: var(--surface2); border-radius: 10px; padding: 4px; margin-bottom: 28px; }
  .role-btn { flex: 1; padding: 10px; border: none; border-radius: 7px; cursor: pointer; background: transparent; color: var(--muted); }
  .role-btn.active { background: var(--accent); color: #0a0a0f; }
  .form-group { margin-bottom: 18px; }
  .form-group label { display: block; font-size: 0.78rem; color: var(--muted); margin-bottom: 8px; }
  .form-group input { width: 100%; padding: 13px 16px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 10px; color: var(--text); }
  .login-btn { width: 100%; padding: 15px; background: var(--accent); color: #0a0a0f; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; }
  .layout { display: flex; min-height: 100vh; }
  .sidebar { width: 240px; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 28px 0; position: fixed; height: 100vh; }
  .sidebar-logo { padding: 0 24px 28px; border-bottom: 1px solid var(--border); }
  .nav-item { display: flex; align-items: center; gap: 12px; padding: 11px 10px; margin: 0 14px; border-radius: 9px; cursor: pointer; color: var(--muted); }
  .nav-item.active { background: var(--accent); color: #0a0a0f; }
  .main { margin-left: 240px; padding: 36px 40px; flex: 1; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 22px; }
  .stat-value { font-size: 2.2rem; font-weight: 500; }
  .green { color: var(--accent); } .purple { color: var(--accent2); } .red { color: var(--danger); } .blue { color: var(--info); }
  .sidebar-user { margin-top: auto; padding: 16px 24px; border-top: 1px solid var(--border); display: flex; align-items: center; gap: 12px; }
  .user-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
`;

export default UniTaskApp;