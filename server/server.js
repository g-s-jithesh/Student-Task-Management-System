require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dev_key';

// Middleware to authenticate
const authenticate = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ error: 'Access denied' });
  
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// --- AUTH ---
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  
  // Restriction: Only accept mails ending with "@srmist.edu.in"
  if (!email.endsWith('@srmist.edu.in')) {
    return res.status(400).json({ error: 'Only @srmist.edu.in emails are allowed' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  db.run('INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', 
    [name, email, hashPassword, role || 'student'], function(err) {
      if (err) return res.status(400).json({ error: 'Email already exists' });
      res.json({ id: this.lastID, message: 'User created successfully' });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM Users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'Email not found' });

    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET);
    res.json({ token, role: user.role, name: user.name, email: user.email });
  });
});

// --- TASKS & ASSIGNMENTS ---
app.get('/api/tasks', authenticate, (req, res) => {
  let query = 'SELECT * FROM Tasks WHERE assigned_to = ? ORDER BY date(due_date) ASC';
  let params = [req.user.id];

  if (req.user.role === 'faculty') {
    query = 'SELECT * FROM Tasks WHERE created_by = ? ORDER BY date(due_date) ASC';
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/tasks', authenticate, (req, res) => {
  const { title, description, due_date, tags, assigned_to_all_course, type } = req.body;
  const created_by = req.user.id;
  const taskType = type || (req.user.role === 'faculty' ? 'assignment' : 'personal');
  
  if (req.user.role === 'faculty' && assigned_to_all_course) {
    const course_id = req.body.course_id;
    if (!course_id) return res.status(400).json({ error: 'Course ID required' });

    db.all('SELECT student_id FROM Course_Students WHERE course_id = ?', [course_id], (err, students) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const stmt = db.prepare('INSERT INTO Tasks (title, description, created_by, assigned_to, due_date, tags, type, course_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      students.forEach(s => {
        stmt.run([title, description, created_by, s.student_id, due_date, JSON.stringify(tags || []), taskType, course_id]);
        db.run('INSERT INTO Notifications (user_id, message) VALUES (?, ?)', [s.student_id, `New assignment assigned: ${title}`]);
      });
      stmt.finalize();
      res.json({ message: 'Assigned to all students in course' });
    });
  } else {
    const assigned_to = req.body.assigned_to || req.user.id;
    db.run('INSERT INTO Tasks (title, description, created_by, assigned_to, due_date, tags, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, created_by, assigned_to, due_date, JSON.stringify(tags || []), taskType], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Task created' });
    });
  }
});

app.put('/api/tasks/:id', authenticate, (req, res) => {
  const { status, title, description, tags, due_date } = req.body;
  const taskId = req.params.id;
  
  const updates = [];
  const params = [];

  if (status) {
    updates.push('status = ?');
    params.push(status);
    if (status === 'completed') {
      updates.push('completed_date = ?');
      params.push(new Date().toISOString().split('T')[0]);
    }
  }
  if (title) { updates.push('title = ?'); params.push(title); }
  if (description) { updates.push('description = ?'); params.push(description); }
  if (tags) { updates.push('tags = ?'); params.push(JSON.stringify(tags)); }
  if (due_date) { updates.push('due_date = ?'); params.push(due_date); }

  if (updates.length === 0) return res.json({ message: 'No changes' });

  params.push(taskId);
  db.run(`UPDATE Tasks SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Task updated' });
  });
});

app.delete('/api/tasks/:id', authenticate, (req, res) => {
  db.run('DELETE FROM Tasks WHERE id = ? AND (created_by = ? OR assigned_to = ?)', [req.params.id, req.user.id, req.user.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Task deleted' });
  });
});

// --- DOUBTS ---
app.post('/api/doubts', authenticate, (req, res) => {
  const { question, teacher_id } = req.body;
  const student_id = req.user.id;

  db.run('INSERT INTO Doubts (student_id, teacher_id, question) VALUES (?, ?, ?)', [student_id, teacher_id, question], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    // Notify teacher
    db.run('INSERT INTO Notifications (user_id, message) VALUES (?, ?)', [teacher_id, `New doubt raised by ${req.user.name}`]);
    res.json({ id: this.lastID, message: 'Doubt raised' });
  });
});

app.get('/api/doubts', authenticate, (req, res) => {
  let query = '';
  let params = [];
  
  if (req.user.role === 'faculty') {
    query = 'SELECT Doubts.*, Users.name as student_name FROM Doubts JOIN Users ON Doubts.student_id = Users.id WHERE Doubts.teacher_id = ? ORDER BY Doubts.created_at DESC';
    params = [req.user.id];
  } else {
    query = 'SELECT Doubts.*, Users.name as student_name FROM Doubts JOIN Users ON Doubts.student_id = Users.id WHERE Doubts.student_id = ? ORDER BY Doubts.created_at DESC';
    params = [req.user.id];
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/api/doubts/:id', authenticate, (req, res) => {
  const { answer } = req.body;
  const doubtId = req.params.id;
  const answered_at = new Date().toISOString();

  db.get('SELECT student_id FROM Doubts WHERE id = ?', [doubtId], (err, doubt) => {
    if (err || !doubt) return res.status(404).json({ error: 'Doubt not found' });
    
    db.run('UPDATE Doubts SET answer = ?, answered_at = ? WHERE id = ?', [answer, answered_at, doubtId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      // Notify student
      db.run('INSERT INTO Notifications (user_id, message) VALUES (?, ?)', [doubt.student_id, `Your doubt has been answered by ${req.user.name}`]);
      res.json({ message: 'Answer posted' });
    });
  });
});

// --- NOTIFICATIONS ---
app.get('/api/notifications', authenticate, (req, res) => {
  db.all('SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/api/notifications/read', authenticate, (req, res) => {
  db.run('UPDATE Notifications SET is_read = 1 WHERE user_id = ?', [req.user.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Notifications marked as read' });
  });
});

// --- REPORTS ---
app.get('/api/reports', authenticate, (req, res) => {
  if (req.user.role !== 'faculty') return res.status(403).json({ error: 'Unauthorized' });

  db.all(`
    SELECT 
      Users.name as student_name,
      COUNT(Tasks.id) as total_tasks,
      SUM(CASE WHEN Tasks.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
    FROM Users
    LEFT JOIN Tasks ON Users.id = Tasks.assigned_to
    WHERE Users.role = 'student'
    GROUP BY Users.id
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// --- DASHBOARD ANALYTICS ---
app.get('/api/dashboard/stats', authenticate, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  if (req.user.role === 'faculty') {
    db.get(`
      SELECT 
        (SELECT COUNT(*) FROM Tasks WHERE created_by = ?) as total_active,
        (SELECT COUNT(*) FROM Users WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM Tasks WHERE created_by = ? AND status = 'completed') as pending_review,
        (SELECT COUNT(*) FROM Tasks WHERE created_by = ? AND due_date = ?) as due_today
    `, [req.user.id, req.user.id, req.user.id, today], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  } else {
    db.get(`
      SELECT 
        (SELECT COUNT(*) FROM Tasks WHERE assigned_to = ?) as total_assigned,
        (SELECT COUNT(*) FROM Tasks WHERE assigned_to = ? AND status = 'completed') as total_completed,
        (SELECT COUNT(*) FROM Tasks WHERE assigned_to = ? AND status != 'completed') as total_pending,
        (SELECT COUNT(*) FROM Tasks WHERE assigned_to = ? AND due_date = ?) as due_today
    `, [req.user.id, req.user.id, req.user.id, req.user.id, today], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  }
});

app.get('/api/courses', authenticate, (req, res) => {
  let query = 'SELECT * FROM Courses';
  let params = [];
  if (req.user.role === 'faculty') {
    query = 'SELECT * FROM Courses WHERE faculty_id = ?';
    params = [req.user.id];
  }
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/courses', authenticate, (req, res) => {
  const { name } = req.body;
  if (req.user.role !== 'faculty') return res.status(403).json({ error: 'Only faculty can create courses' });
  
  db.run('INSERT INTO Courses (name, faculty_id) VALUES (?, ?)', [name, req.user.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, message: 'Course created' });
  });
});

app.delete('/api/courses/:id', authenticate, (req, res) => {
  if (req.user.role !== 'faculty') return res.status(403).json({ error: 'Unauthorized' });
  
  db.run('DELETE FROM Courses WHERE id = ? AND faculty_id = ?', [req.params.id, req.user.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Course deleted' });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));

app.post('/api/mock-seed', async (req, res) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('password123', salt);
  
  db.serialize(() => {
    // Seed Users
    db.run('INSERT OR IGNORE INTO Users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', [1, 'Prof. Sarah Baker', 'prof.sarah@srmist.edu.in', hash, 'faculty']);
    db.run('INSERT OR IGNORE INTO Users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', [2, 'John Doe', 'john.doe@srmist.edu.in', hash, 'student']);
    db.run('INSERT OR IGNORE INTO Users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', [3, 'Jane Smith', 'jane.smith@srmist.edu.in', hash, 'student']);

    // Seed Courses
    db.run('INSERT OR IGNORE INTO Courses (id, name, faculty_id) VALUES (?, ?, ?)', [1, 'Art History 101', 1]);
    db.run('INSERT OR IGNORE INTO Courses (id, name, faculty_id) VALUES (?, ?, ?)', [2, 'Mathematics Research', 1]);

    // Seed Course Students (Enroll John in Art History, Jane in both)
    db.run('INSERT OR IGNORE INTO Course_Students (course_id, student_id) VALUES (?, ?)', [1, 2]);
    db.run('INSERT OR IGNORE INTO Course_Students (course_id, student_id) VALUES (?, ?)', [1, 3]);
    db.run('INSERT OR IGNORE INTO Course_Students (course_id, student_id) VALUES (?, ?)', [2, 3]);
  });
  
  res.json({ message: 'Mock users, courses, and enrollments seeded' });
});
