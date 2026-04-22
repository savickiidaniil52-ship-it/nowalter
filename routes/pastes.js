const express = require('express');
const db = require('../db');
const router = express.Router();

function generateSlug() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) slug += chars[Math.floor(Math.random() * chars.length)];
  return slug;
}

router.get('/', async (req, res) => {
  const search = req.query.search || '';
  const pastes = await db.getPublicPastes(search);
  res.json({ pastes });
});

router.post('/', async (req, res) => {
  try {
    const { title, content, visibility } = req.body;
    if (!title || !content) return res.json({ error: 'Title and content required' });

    let slug;
    do { slug = generateSlug(); } while (await db.getPasteBySlug(slug));

    const userId = req.currentUser ? req.currentUser.id : null;
    const vis = visibility === 'private' ? 'private' : 'public';

    await db.createPaste(slug, title.trim(), content, vis, userId);
    res.json({ success: true, slug });
  } catch (e) {
    console.error(e);
    res.json({ error: 'Failed to create paste' });
  }
});

router.get('/user/mine', async (req, res) => {
  if (!req.currentUser) return res.json({ error: 'Not authenticated' });
  const pastes = await db.getUserPastes(req.currentUser.id);
  res.json({ pastes });
});

router.get('/:slug', async (req, res) => {
  const paste = await db.getPasteBySlug(req.params.slug);
  if (!paste) return res.json({ error: 'Paste not found' });

  if (paste.visibility === 'private') {
    if (!req.currentUser || (req.currentUser.id !== paste.user_id && req.currentUser.role !== 'admin')) {
      return res.json({ error: 'This paste is private' });
    }
  }

  await db.incrementViews(req.params.slug);
  res.json({ paste });
});

router.delete('/:slug', async (req, res) => {
  if (!req.currentUser) return res.json({ error: 'Not authenticated' });
  const paste = await db.getPasteBySlug(req.params.slug);
  if (!paste) return res.json({ error: 'Not found' });

  const isOwner = paste.user_id === req.currentUser.id;
  const isAdmin = req.currentUser.role === 'admin';
  if (!isOwner && !isAdmin) return res.json({ error: 'No permission' });

  await db.deletePaste(req.params.slug);
  res.json({ success: true });
});

module.exports = router;