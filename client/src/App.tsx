import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import FacultyView from './components/FacultyView';
import StudentView from './components/StudentView';

const API_BASE = 'http://localhost:5000/api';

const UniTaskApp: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<'faculty' | 'student'>('faculty');
  const [activePage, setActivePage] = useState<string>('');
  
  const [userToken, setUserToken] = useState('');
  const [userName, setUserName] = useState('');

  const [stats, setStats] = useState<any>({});
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (isLoggedIn) {
      setActivePage(role === 'faculty' ? 'f-dashboard' : 's-dashboard');
      fetchDashboard();
      fetchTasks();
    }
  }, [isLoggedIn, role]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`, { headers: { 'Authorization': `Bearer ${userToken}` } });
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks`, { headers: { 'Authorization': `Bearer ${userToken}` } });
      const data = await res.json();
      setTasks(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (email: string, password: string, selectedRole: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: selectedRole })
      });
      const data = await res.json();
      if (res.ok) {
        setUserToken(data.token);
        setRole(data.role as 'faculty' | 'student');
        setUserName(data.name);
        setIsLoggedIn(true);
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (e) {
      alert('Network error connecting to backend API');
    }
  };

  const handleRegister = async (email: string, password: string, selectedRole: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New User', email, password, role: selectedRole })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Registered successfully! Please login.');
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Network error');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserToken('');
    setTasks([]);
    setStats({});
  };

  if (!isLoggedIn) {
    return <Login handleLogin={handleLogin} handleRegister={handleRegister} />;
  }

  return (
    <div className="app-container">
      <Sidebar 
        role={role} 
        userName={userName} 
        activePage={activePage} 
        setActivePage={setActivePage} 
        handleLogout={handleLogout}
        pendingTasksCount={tasks.filter(t => t.status !== 'completed').length}
      />
      <div className="main-content">
        {role === 'faculty' ? (
          <FacultyView 
            userName={userName} 
            stats={stats} 
            tasks={tasks}
            userToken={userToken}
            fetchTasks={fetchTasks}
            fetchDashboard={fetchDashboard}
            activePage={activePage}
          />
        ) : (
          <StudentView 
            userName={userName} 
            stats={stats} 
            tasks={tasks}
            userToken={userToken}
            fetchTasks={fetchTasks}
            fetchDashboard={fetchDashboard}
            activePage={activePage}
          />
        )}
      </div>
    </div>
  );
};

export default UniTaskApp;