const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite Database.');

    db.serialize(() => {
      // Users
      db.run(`CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student'
      )`);

      // Courses
      db.run(`CREATE TABLE IF NOT EXISTS Courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        faculty_id INTEGER,
        FOREIGN KEY(faculty_id) REFERENCES Users(id)
      )`);

      // Course Students map
      db.run(`CREATE TABLE IF NOT EXISTS Course_Students (
        course_id INTEGER,
        student_id INTEGER,
        FOREIGN KEY(course_id) REFERENCES Courses(id),
        FOREIGN KEY(student_id) REFERENCES Users(id),
        PRIMARY KEY (course_id, student_id)
      )`);
      
      // Tasks
      db.run(`CREATE TABLE IF NOT EXISTS Tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        course_id INTEGER,
        assigned_to INTEGER,
        created_by INTEGER,
        due_date TEXT,
        status TEXT DEFAULT 'pending',
        completed_date TEXT,
        tags TEXT, 
        type TEXT DEFAULT 'personal', 
        FOREIGN KEY(course_id) REFERENCES Courses(id),
        FOREIGN KEY(assigned_to) REFERENCES Users(id),
        FOREIGN KEY(created_by) REFERENCES Users(id)
      )`);

      // Migration: Add type column if it doesn't exist
      db.run("ALTER TABLE Tasks ADD COLUMN type TEXT DEFAULT 'personal'", (err) => {
        if (err) {
          // If error is because column already exists, that's fine
          if (!err.message.includes("duplicate column name")) {
            // console.log("Note: Tasks table already has 'type' column or other non-critical error.");
          }
        } else {
          console.log("Added 'type' column to Tasks table.");
        }
      });

      // Doubts
      db.run(`CREATE TABLE IF NOT EXISTS Doubts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        teacher_id INTEGER,
        question TEXT NOT NULL,
        answer TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        answered_at DATETIME,
        FOREIGN KEY(student_id) REFERENCES Users(id),
        FOREIGN KEY(teacher_id) REFERENCES Users(id)
      )`);

      // Notifications
      db.run(`CREATE TABLE IF NOT EXISTS Notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES Users(id)
      )`);
    });
  }
});

module.exports = db;
