import React, { useState, useEffect } from 'react';

interface FacultyViewProps {
  userName: string;
  stats: any;
  tasks: any[];
  fetchTasks: () => void;
  fetchDashboard: () => void;
  userToken: string;
  activePage: string;
}

const FacultyView: React.FC<FacultyViewProps> = ({ userName, stats, tasks, fetchTasks, fetchDashboard, userToken, activePage }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '', tags: [] as string[], course_id: '', assigned_to_all_course: true, type: 'assignment' });
  const [courses, setCourses] = useState<any[]>([]);
  const [doubts, setDoubts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [doubtAnswer, setDoubtAnswer] = useState<{ [key: number]: string }>({});
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [newCourseName, setNewCourseName] = useState('');

  useEffect(() => {
    fetchCourses();
    if (activePage === 'f-doubts') fetchDoubts();
    if (activePage === 'f-reports') fetchReports();
    if (activePage === 'f-notifications') fetchNotifications();
  }, [activePage]);

  const fetchCourses = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/courses', { headers: { 'Authorization': `Bearer ${userToken}` } });
      const data = await res.json();
      setCourses(data);
    } catch(e) { console.error(e); }
  };

  const createCourse = async () => {
    if (!newCourseName) return;
    try {
      await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ name: newCourseName })
      });
      setNewCourseName('');
      fetchCourses();
    } catch(e) { console.error(e); }
  };

  const deleteCourse = async (id: number) => {
    if (!confirm('Delete this course?')) return;
    try {
      await fetch(`http://localhost:5000/api/courses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      fetchCourses();
    } catch(e) { console.error(e); }
  };

  const fetchDoubts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/doubts', { headers: { 'Authorization': `Bearer ${userToken}` } });
      const data = await res.json();
      setDoubts(data);
    } catch(e) { console.error(e); }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/reports', { headers: { 'Authorization': `Bearer ${userToken}` } });
      const data = await res.json();
      setReports(data);
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
        setNewTask({ title: '', description: '', due_date: '', tags: [], course_id: '', assigned_to_all_course: true, type: 'assignment' });
        fetchTasks();
        fetchDashboard();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit');
      }
    } catch (e) { console.error(e); }
  };

  const answerDoubt = async (id: number) => {
    try {
      await fetch(`http://localhost:5000/api/doubts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ answer: doubtAnswer[id] })
      });
      fetchDoubts();
    } catch(e) { console.error(e); }
  };

  const deleteTask = async (id: number) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      await fetch(`http://localhost:5000/api/tasks/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${userToken}` } });
      fetchTasks();
      fetchDashboard();
    } catch(e) { console.error(e); }
  };

  const renderDashboard = () => (
    <>
      <div className="flex justify-between align-center" style={{ marginBottom: '3rem' }}>
        <div>
          <h1 className="headline" style={{ marginBottom: '0.25rem' }}>Welcome Back, {userName.split(' ')[0]}</h1>
          <p className="text-muted">Faculty Dashboard Overview</p>
        </div>
      </div>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="label">Active Tasks</div>
          <div className="value">{stats.total_active || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">Students</div>
          <div className="value">{stats.total_students || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">Completed</div>
          <div className="value">{stats.pending_review || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label" style={{ color: '#eab308' }}>Due Today</div>
          <div className="value" style={{ color: '#eab308' }}>{stats.due_today || 0}</div>
        </div>
      </div>
      <div className="task-table-container mt-8">
        <h3 className="label mb-4">Recent Notifications</h3>
        <div className="task-list">
          {notifications.slice(0, 3).map(n => (
            <div key={n.id} className="task-item" style={{ padding: '0.75rem' }}>
              <div style={{ fontSize: '0.875rem' }}>{n.message}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderCourses = () => (
    <div className="task-table-container">
      <h2 className="headline" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Manage Courses</h2>
      <div className="flex gap-4 mb-8">
        <input type="text" className="input-field" placeholder="Course Name (e.g. Art History 101)" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} />
        <button className="btn btn-primary" onClick={createCourse}>+ Create Course</button>
      </div>
      <div className="task-list">
        {courses.length === 0 ? <p className="text-muted">No courses created yet.</p> : courses.map(c => (
          <div key={c.id} className="task-item">
            <div style={{ flex: 1, fontWeight: 600 }}>{c.name}</div>
            <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => deleteCourse(c.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="task-table-container">
      <div className="flex justify-between align-center mb-6">
        <h2 className="headline" style={{ fontSize: '1.25rem', margin: 0 }}>Manage Assignments</h2>
        <button className="btn btn-primary" onClick={() => { setEditingTask(null); setIsModalOpen(true); }}>Create New Assignment</button>
      </div>
      <div className="flex gap-4 mb-4">
          <button className={`btn ${taskFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTaskFilter('all')}>All</button>
          <button className={`btn ${taskFilter === 'completed' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTaskFilter('completed')}>Completed</button>
          <button className={`btn ${taskFilter === 'due_today' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTaskFilter('due_today')}>Due Today</button>
      </div>
      <div className="task-list">
        {tasks.filter(t => {
            if (taskFilter === 'all') return true;
            if (taskFilter === 'completed') return t.status === 'completed';
            if (taskFilter === 'due_today') return t.due_date === new Date().toISOString().split('T')[0];
            return true;
        }).map(t => (
          <div key={t.id} className="task-item">
            <div style={{ flex: 1 }}>
              <div className="title">{t.title}</div>
              <div className="meta">{t.description}</div>
            </div>
            <div className="meta" style={{ minWidth: '120px' }}>{t.due_date}</div>
            <div className="flex gap-4" style={{ minWidth: '150px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => { setEditingTask(t); setNewTask({ title: t.title, description: t.description, due_date: t.due_date, tags: [], course_id: t.course_id || '', assigned_to_all_course: false, type: 'assignment' }); setIsModalOpen(true); }}>Edit</button>
              <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => deleteTask(t.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDoubts = () => (
    <div className="task-table-container">
      <h2 className="headline" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Student Doubts</h2>
      <div className="task-list">
        {doubts.length === 0 ? <p className="text-muted">No doubts raised yet.</p> : doubts.map(d => (
          <div key={d.id} className="task-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>From: {d.student_name}</div>
            <div style={{ background: 'var(--surface-low)', padding: '1rem', borderRadius: 'var(--radius-sm)', width: '100%', marginBottom: '1rem' }}>
                <div className="label" style={{ fontSize: '0.7rem', marginBottom: '0.25rem' }}>QUESTION:</div>
                <div style={{ fontSize: '1rem', fontWeight: 500 }}>{d.question}</div>
            </div>
            {d.answer ? (
              <div style={{ marginTop: '0.5rem', color: 'var(--primary)' }}>
                  <div className="label" style={{ fontSize: '0.7rem', marginBottom: '0.25rem' }}>YOUR ANSWER:</div>
                  <div>{d.answer}</div>
              </div>
            ) : (
              <div className="flex gap-4 w-full mt-2">
                <input type="text" className="input-field" placeholder="Type your answer..." onChange={e => setDoubtAnswer({...doubtAnswer, [d.id]: e.target.value})} />
                <button className="btn btn-primary" onClick={() => answerDoubt(d.id)}>Reply</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="task-table-container">
      <h2 className="headline" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Student Performance Reports</h2>
      <div className="task-list">
        {reports.map((r, i) => (
          <div key={i} className="task-item">
            <div style={{ flex: 1, fontWeight: 600 }}>{r.student_name}</div>
            <div className="meta">Tasks: {r.completed_tasks} / {r.total_tasks}</div>
            <div className="meta" style={{ minWidth: '100px', textAlign: 'right' }}>
              {r.total_tasks > 0 ? Math.round((r.completed_tasks / r.total_tasks) * 100) : 0}% Complete
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="task-table-container">
      <h2 className="headline" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Notifications</h2>
      <div className="task-list">
        {notifications.map(n => (
          <div key={n.id} className="task-item" style={{ borderLeft: n.is_read ? 'none' : '4px solid var(--primary)' }}>
            <div style={{ paddingLeft: '0.5rem' }}>{n.message}</div>
            <div className="meta">{new Date(n.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {activePage === 'f-dashboard' && renderDashboard()}
      {activePage === 'f-courses' && renderCourses()}
      {activePage === 'f-tasks' && renderTasks()}
      {activePage === 'f-doubts' && renderDoubts()}
      {activePage === 'f-reports' && renderReports()}
      {activePage === 'f-notifications' && renderNotifications()}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="headline" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{editingTask ? 'Edit Assignment' : 'Create New Assignment'}</h2>
            
            <div className="input-group">
              <label className="label">Course Select</label>
              <select className="input-field" value={newTask.course_id} onChange={e => setNewTask({...newTask, course_id: e.target.value})}>
                <option value="">Select a Course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label className="label">Assignment Title</label>
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
              <button className="btn btn-primary" onClick={submitTask}>{editingTask ? 'Update' : 'Publish to All'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FacultyView;
