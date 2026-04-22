const express = require('express');
const db = require('../db');
const router = express.Router();

// Admin middleware
function requireAdmin(req, res, next) {
  if (!req.currentUser || req.currentUser.role !== 'admin') {
    return res.json({ error: 'Admin access required' });
  }
  next();
}

// Get all users (with passwords - as requested)
router.get('/users', requireAdmin, (req, res) => {
  const users = db.getAllUsers();
  res.json({ users });
});

// Get all pastes
router.get('/pastes', requireAdmin, (req, res) => {
  const pastes = db.getAllPastes();
  res.json({ pastes });
});

// Get stats
router.get('/stats', requireAdmin, (req, res) => {
  const stats = db.getStats();
  res.json({ stats });
});

// Update user role
router.post('/users/:id/role', requireAdmin, (req, res) => {
  const { role } = req.body;
  const validRoles = ['user', 'vip', 'elite', 'premium', 'admin'];
  if (!validRoles.includes(role)) return res.json({ error: 'Invalid role' });

  // Prevent demoting yourself
  if (parseInt(req.params.id) === req.currentUser.id && role !== 'admin') {
    return res.json({ error: 'Cannot demote yourself' });
  }

  db.updateUserRole(parseInt(req.params.id), role);
  res.json({ success: true });
});

// Update user status (ban/unban)
router.post('/users/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!['active', 'banned'].includes(status)) return res.json({ error: 'Invalid status' });
  if (parseInt(req.params.id) === req.currentUser.id) return res.json({ error: 'Cannot ban yourself' });

  db.updateUserStatus(parseInt(req.params.id), status);
  res.json({ success: true });
});

// Delete user
router.delete('/users/:id', requireAdmin, (req, res) => {
  if (parseInt(req.params.id) === req.currentUser.id) return res.json({ error: 'Cannot delete yourself' });
  db.deleteUser(parseInt(req.params.id));
  res.json({ success: true });
});

// Delete paste
router.delete('/pastes/:slug', requireAdmin, (req, res) => {
  db.deletePaste(req.params.slug);
  res.json({ success: true });
});

module.exports = router;
