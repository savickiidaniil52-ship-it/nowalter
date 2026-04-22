const express = require('express');
const db = require('../db');
const router = express.Router();

function generateSlug() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) slug += chars[Math.floor(Math.random() * chars.length)];
  return slug;
}

// Get all public pastes
router.get('/', (req, res) => {
  const search = req.query.search || '';
  const pastes = db.getPublicPastes(search);
  res.json({ pastes });
});

// Create paste
router.post('/', (req, res) => {
  try {
    const { title, content, visibility } = req.body;
    if (!title || !content) return res.json({ error: 'Title and content required' });

    let slug;
    do { slug = generateSlug(); } while (db.getPasteBySlug(slug));

    const userId = req.currentUser ? req.currentUser.id : null;
    const vis = visibility === 'private' ? 'private' : 'public';

    db.createPaste(slug, title.trim(), content, vis, userId);
    res.json({ success: true, slug });
  } catch (e) {
    res.json({ error: 'Failed to create paste' });
  }
});

// Get single paste
router.get('/:slug', (req, res) => {
  const paste = db.getPasteBySlug(req.params.slug);
  if (!paste) return res.json({ error: 'Paste not found' });

  if (paste.visibility === 'private') {
    if (!req.currentUser || (req.currentUser.id !== paste.user_id && req.currentUser.role !== 'admin')) {
      return res.json({ error: 'This paste is private' });
    }
  }

  db.incrementViews(req.params.slug);
  res.json({ paste });
});

// Delete paste
router.delete('/:slug', (req, res) => {
  if (!req.currentUser) return res.json({ error: 'Not authenticated' });
  const paste = db.getPasteBySlug(req.params.slug);
  if (!paste) return res.json({ error: 'Not found' });

  const isOwner = paste.user_id === req.currentUser.id;
  const isAdmin = req.currentUser.role === 'admin';
  if (!isOwner && !isAdmin) return res.json({ error: 'No permission' });

  db.deletePaste(req.params.slug);
  res.json({ success: true });
});

// Get my pastes
router.get('/user/mine', (req, res) => {
  if (!req.currentUser) return res.json({ error: 'Not authenticated' });
  const pastes = db.getUserPastes(req.currentUser.id);
  res.json({ pastes });
});

module.exports = router;
