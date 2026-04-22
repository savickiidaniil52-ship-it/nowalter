const express = require('express');
const db = require('../db');
const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.currentUser || req.currentUser.role !== 'admin') {
    return res.json({ error: 'Admin access required' });
  }
  next();
}

router.get('/users', requireAdmin, async (req, res) => {
  const users = await db.getAllUsers();
  res.json({ users });
});

router.get('/pastes', requireAdmin, async (req, res) => {
  const pastes = await db.getAllPastes();
  res.json({ pastes });
});

router.get('/stats', requireAdmin, async (req, res) => {
  const stats = await db.getStats();
  res.json({ stats });
});

router.post('/users/:id/role', requireAdmin, async (req, res) => {
  const { role } = req.body;
  const validRoles = ['user', 'vip', 'elite', 'premium', 'admin'];
  if (!validRoles.includes(role)) return res.json({ error: 'Invalid role' });

  if (parseInt(req.params.id) === req.currentUser.id && role !== 'admin') {
    return res.json({ error: 'Cannot demote yourself' });
  }

  await db.updateUserRole(parseInt(req.params.id), role);
  res.json({ success: true });
});

router.post('/users/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['active', 'banned'].includes(status)) return res.json({ error: 'Invalid status' });
  if (parseInt(req.params.id) === req.currentUser.id) return res.json({ error: 'Cannot ban yourself' });

  await db.updateUserStatus(parseInt(req.params.id), status);
  res.json({ success: true });
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  if (parseInt(req.params.id) === req.currentUser.id) return res.json({ error: 'Cannot delete yourself' });
  await db.deleteUser(parseInt(req.params.id));
  res.json({ success: true });
});

router.delete('/pastes/:slug', requireAdmin, async (req, res) => {
  await db.deletePaste(req.params.slug);
  res.json({ success: true });
});

module.exports = router;