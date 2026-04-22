const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) return res.json({ error: 'Fill all fields' });
    if (username.length < 3) return res.json({ error: 'Username min 3 chars' });
    if (password.length < 4) return res.json({ error: 'Password min 4 chars' });
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return res.json({ error: 'Only letters, numbers, underscore' });

    const existing = db.getUserByUsername(username);
    if (existing) return res.json({ error: 'Username taken' });

    const hashed = await bcrypt.hash(password, 10);
    const result = db.createUser(username, hashed);

    const user = db.getUserById(result.lastInsertRowid);
    req.session.userId = user.id;

    res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
  } catch (e) {
    res.json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db.getUserByUsername(username);
    if (!user) return res.json({ error: 'Invalid credentials' });
    if (user.status === 'banned') return res.json({ error: 'You are banned' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ error: 'Invalid credentials' });

    req.session.userId = user.id;
    db.updateLastSeen(user.id);

    res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
  } catch (e) {
    res.json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.currentUser) return res.json({ user: null });
  const u = req.currentUser;
  res.json({ user: { id: u.id, username: u.username, role: u.role, status: u.status } });
});

module.exports = router;
