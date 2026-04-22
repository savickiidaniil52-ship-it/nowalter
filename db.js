const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = './data';
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new sqlite3.Database('./data/nowalter.db');

db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'active',
    last_seen DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Pastes table with slug
  db.run(`CREATE TABLE IF NOT EXISTS pastes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE,
    title TEXT,
    content TEXT,
    visibility TEXT DEFAULT 'public',
    user_id INTEGER,
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

// ============ USER FUNCTIONS ============
function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function createUser(username, hashedPassword) {
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], function(err) {
      if (err) reject(err);
      else resolve({ lastInsertRowid: this.lastID });
    });
  });
}

function updateLastSeen(userId) {
  db.run("UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?", [userId]);
}

function getAllUsers() {
  return new Promise((resolve, reject) => {
    db.all("SELECT id, username, password, role, status, created_at FROM users", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function updateUserRole(userId, role) {
  db.run("UPDATE users SET role = ? WHERE id = ?", [role, userId]);
}

function updateUserStatus(userId, status) {
  db.run("UPDATE users SET status = ? WHERE id = ?", [status, userId]);
}

function deleteUser(userId) {
  db.run("DELETE FROM users WHERE id = ?", [userId]);
  db.run("DELETE FROM pastes WHERE user_id = ?", [userId]);
}

// ============ PASTE FUNCTIONS ============
function getPasteBySlug(slug) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT p.*, u.username FROM pastes p 
            LEFT JOIN users u ON p.user_id = u.id 
            WHERE p.slug = ?`, [slug], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function getPublicPastes(search = '') {
  return new Promise((resolve, reject) => {
    let sql = `SELECT p.*, u.username FROM pastes p 
               LEFT JOIN users u ON p.user_id = u.id 
               WHERE p.visibility = 'public'`;
    let params = [];
    if (search) {
      sql += ` AND (p.title LIKE ? OR p.content LIKE ?)`;
      params = [`%${search}%`, `%${search}%`];
    }
    sql += ` ORDER BY p.created_at DESC LIMIT 50`;
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getAllPastes() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT p.*, u.username FROM pastes p 
            LEFT JOIN users u ON p.user_id = u.id 
            ORDER BY p.created_at DESC`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function createPaste(slug, title, content, visibility, userId) {
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO pastes (slug, title, content, visibility, user_id) VALUES (?, ?, ?, ?, ?)",
      [slug, title, content, visibility, userId], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
  });
}

function incrementViews(slug) {
  db.run("UPDATE pastes SET views = views + 1 WHERE slug = ?", [slug]);
}

function deletePaste(slug) {
  db.run("DELETE FROM pastes WHERE slug = ?", [slug]);
}

function getUserPastes(userId) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM pastes WHERE user_id = ? ORDER BY created_at DESC", [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getStats() {
  return new Promise((resolve, reject) => {
    db.get(`SELECT 
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM pastes) as pastes,
      (SELECT COUNT(*) FROM pastes WHERE visibility = 'public') as publicPastes,
      (SELECT COALESCE(SUM(views), 0) FROM pastes) as totalViews
    `, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Wrap db.get for async/await compatibility
db.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT id, username, role, status FROM users WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

module.exports = {
  db,
  getUserById,
  getUserByUsername,
  createUser,
  updateLastSeen,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getPasteBySlug,
  getPublicPastes,
  getAllPastes,
  createPaste,
  incrementViews,
  deletePaste,
  getUserPastes,
  getStats
};