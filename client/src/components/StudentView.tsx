import React, { useState, useEffect } from 'react';

interface StudentViewProps {
  userName: string;
  stats: any;
  tasks: any[];
  userToken: string;
  fetchTasks: () => void;
  fetchDashboard: () => void;
  activePage: string;
}

const StudentView: React.FC<StudentViewProps> = ({ userName, stats, tasks, userToken, fetchTasks, fetchDashboard, activePage }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '', type: 'personal' });
  const [doubts, setDoubts] = useState<any[]>([]);
  const [newDoubt, setNewDoubt] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [taskFilter, setTaskFilter] = useState<string>('all');

  useEffect(() => {
    if (activePage === 's-doubts') fetchDoubts();
    if (activePage === 's-notifications') fetchNotifications();
  }, [activePage]);

  const fetchDoubts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/doubts', { headers: { 'Authorization': `Bearer ${userToken}` } });
      const data = await res.json();
      setDoubts(data);
    } catch(e) { console.error(e); }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications', { headers: { 'Authorization': `Bearer ${userToken}` } });
      const data = await res.json();
      setNotifications(data);
      await fetch('http://localhost:5000/api/notifications/read', { method: 'PUT', headers: { 'Authorization': `Bearer ${userToken}` } });
    } catch(e) { console.error(e); }
  };

  const submitTask = async () => {
    try {
      const url = editingTask ? `http://localhost:5000/api/tasks/${editingTask.id}` : 'http://localhost:5000/api/tasks';
      const method = editingTask ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingTask(null);
        setNewTask({ title: '', description: '', due_date: '', type: 'personal' });
        fetchTasks();
        fetchDashboard();
      }
    } catch (e) { console.error(e); }
  };

  const deleteTask = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    try {
      await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      fetchTasks();
      fetchDashboard();
    } catch(e) { console.error(e); }
  };

  const updateTaskStatus = async (taskId: number, status: string) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ status })
      });
      fetchTasks();
      fetchDashboard();
    } catch(e) { console.error(e); }
  };

  const raiseDoubt = async () => {
    try {
      await fetch('http://localhost:5000/api/doubts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ question: newDoubt, teacher_id: 1 })
      });
      setNewDoubt('');
      fetchDoubts();
    } catch(e) { console.error(e); }
  };

  const progress = stats.total_assigned > 0 ? Math.round((stats.total_completed / stats.total_assigned) * 100) : 0;

  const renderDashboard = () => (
    <>
      <div className="flex justify-between align-center" style={{ marginBottom: '3rem' }}>
        <div>
          <h1 className="headline" style={{ marginBottom: '0.25rem' }}>Hey, {userName.split(' ')[0]} 👋</h1>
          <p className="text-muted">Academic Progress Overview</p>
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card" style={{ cursor: 'pointer', border: taskFilter === 'all' ? '2px solid var(--primary)' : 'none' }} onClick={() => { setTaskFilter('all'); document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <div className="label">Total Tasks</div>
          <div className="value">{stats.total_assigned || 0}</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', border: taskFilter === 'completed' ? '2px solid #0058be' : 'none' }} onClick={() => { setTaskFilter('completed'); document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <div className="label" style={{ color: '#0058be' }}>Completed</div>
          <div className="value" style={{ color: '#0058be' }}>{stats.total_completed || 0}</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', border: taskFilter === 'pending' ? '2px solid var(--danger)' : 'none' }} onClick={() => { setTaskFilter('pending'); document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <div className="label" style={{ color: 'var(--danger)' }}>Pending</div>
          <div className="value" style={{ color: 'var(--danger)' }}>{stats.total_pending || 0}</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', border: taskFilter === 'due_today' ? '2px solid #eab308' : 'none' }} onClick={() => { setTaskFilter('due_today'); document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <div className="label" style={{ color: '#eab308' }}>Due Today</div>
          <div className="value" style={{ color: '#eab308' }}>{stats.due_today || 0}</div>
        </div>
      </div>

      <div className="task-table-container mb-4">
        <div className="label mb-4">Overall Completion</div>
        <div className="flex align-center gap-4">
          <div style={{ flex: 1, height: '12px', background: 'var(--surface-low)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary-gradient)', transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ fontWeight: 700, minWidth: '40px' }}>{progress}%</div>
        </div>
      </div>
    </>
  );

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'completed') return t.status === 'completed';
    if (taskFilter === 'pending') return t.status !== 'completed';
    if (taskFilter === 'due_today') {
        const today = new Date().toISOString().split('T')[0];
        return t.due_date === today;
    }
    return true;
  });

  const renderTasks = () => (
    <div className="task-table-container" id="tasks-section">
      <div className="flex justify-between align-center mb-4">
        <div>
            <h2 className="headline" style={{ fontSize: '1.25rem', margin: 0 }}>My Tasks & Assignments</h2>
            <p className="text-muted" style={{ fontSize: '0.8rem' }}>Showing: {taskFilter.replace('_', ' ')}</p>
        </div>
        <div className="flex gap-4">
            <button className="btn btn-ghost" onClick={() => setTaskFilter('all')}>Clear Filter</button>
            <button className="btn btn-primary" onClick={() => { setEditingTask(null); setIsModalOpen(true); }}>+ Create Task</button>
        </div>
      </div>
      <div className="task-list">
        {filteredTasks.length === 0 ? (
          <p className="text-muted">No tasks found for this filter.</p>
        ) : (
          filteredTasks.map(t => (
            <div key={t.id} className="task-item" style={{ opacity: t.status === 'completed' ? 0.6 : 1 }}>
              <div style={{ flex: 1 }}>
                <div className="title" style={{ textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>
                  {t.title} <span className="label" style={{ fontSize: '0.6rem', marginLeft: '0.5rem' }}>({t.type})</span>
                </div>
                <div className="meta">{t.description}</div>
              </div>
              <div className="meta" style={{ minWidth: '120px' }}>{t.due_date}</div>
              <div style={{ minWidth: '150px', textAlign: 'right' }}>
                <select 
                  className="input-field" 
                  style={{ padding: '0.4rem', fontSize: '0.75rem', width: '130px' }}
                  value={t.status}
                  onChange={(e) => updateTaskStatus(t.id, e.target.value)}
                >
                  <option value="pending">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex gap-4" style={{ minWidth: '80px', justifyContent: 'flex-end' }}>
                {t.type === 'personal' && (
                  <>
                    <button className="btn btn-ghost" style={{ padding: '0.5rem' }} onClick={() => { setEditingTask(t); setNewTask({ title: t.title, description: t.description, due_date: t.due_date, type: 'personal' }); setIsModalOpen(true); }}>✎</button>
                    <button className="btn btn-ghost" style={{ padding: '0.5rem', color: 'var(--danger)' }} onClick={() => deleteTask(t.id)}>✖</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      {(activePage === 's-dashboard' || activePage === 's-tasks') && (
          <>
            {renderDashboard()}
            {renderTasks()}
          </>
      )}
      {activePage === 's-doubts' && renderDoubts()}
      {activePage === 's-notifications' && renderNotifications()}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="headline" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{editingTask ? 'Edit Task' : 'Create Personal Task'}</h2>
            <div className="input-group">
              <label className="label">Task Title</label>
              <input type="text" className="input-field" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="label">Description</label>
              <textarea className="input-field" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="label">Deadline</label>
              <input type="date" className="input-field" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} />
            </div>
            <div className="flex" style={{ gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitTask}>{editingTask ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  function renderDoubts() {
    return (
      <div className="task-table-container">
        <h2 className="headline" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Raise a Doubt</h2>
        <div className="flex gap-4 mb-4">
          <input type="text" className="input-field" placeholder="Ask your teacher something..." value={newDoubt} onChange={e => setNewDoubt(e.target.value)} />
          <button className="btn btn-primary" onClick={raiseDoubt}>Ask Doubt</button>
        </div>
        <div className="task-list">
          {doubts.map(d => (
            <div key={d.id} className="task-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 600 }}>Q: {d.question}</div>
              <div className="meta" style={{ marginTop: '0.5rem' }}>
                {d.answer ? (
                  <div style={{ color: 'var(--primary)', background: 'var(--surface-low)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    A: {d.answer}
                  </div>
                ) : (
                  <span className="text-muted">Waiting for answer...</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderNotifications() {
    return (
      <div className="task-table-container">
        <h2 className="headline" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Notifications</h2>
        <div className="task-list">
          {notifications.length === 0 ? <p className="text-muted">No notifications.</p> : notifications.map(n => (
            <div key={n.id} className="task-item" style={{ borderLeft: n.is_read ? 'none' : '4px solid var(--primary)' }}>
              <div style={{ paddingLeft: '0.5rem' }}>{n.message}</div>
              <div className="meta">{new Date(n.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
};

export default StudentView;
