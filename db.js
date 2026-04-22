const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  family: 4
});

module.exports = {
  async createUser(username, hashedPassword) {
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM users');
    const role = parseInt(rows[0].count) === 0 ? 'admin' : 'user';
    const res = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING *',
      [username, hashedPassword, role]
    );
    return res.rows[0];
  },

  async getUserByUsername(username) {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return rows[0];
  },

  async getUserById(id) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0];
  },

  async getAllUsers() {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY id ASC');
    return rows;
  },

  async updateUserRole(userId, role) {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
  },

  async updateUserStatus(userId, status) {
    await pool.query('UPDATE users SET status = $1 WHERE id = $2', [status, userId]);
  },

  async deleteUser(userId) {
    await pool.query('DELETE FROM pastes WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  },

  async updateLastSeen(userId) {
    await pool.query('UPDATE users SET last_seen = NOW() WHERE id = $1', [userId]);
  },

  async createPaste(slug, title, content, visibility, userId) {
    const { rows } = await pool.query(
      'INSERT INTO pastes (slug, title, content, visibility, user_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [slug, title, content, visibility, userId || null]
    );
    return rows[0];
  },

  async getPasteBySlug(slug) {
    const { rows } = await pool.query(
      'SELECT p.*, u.username FROM pastes p LEFT JOIN users u ON p.user_id = u.id WHERE p.slug = $1',
      [slug]
    );
    return rows[0];
  },

  async incrementViews(slug) {
    await pool.query('UPDATE pastes SET views = views + 1 WHERE slug = $1', [slug]);
  },

  async getPublicPastes(search = '') {
    if (search) {
      const { rows } = await pool.query(
        `SELECT p.*, u.username FROM pastes p LEFT JOIN users u ON p.user_id = u.id
         WHERE p.visibility = 'public' AND p.title ILIKE $1 ORDER BY p.created_at DESC`,
        [`%${search}%`]
      );
      return rows;
    }
    const { rows } = await pool.query(
      `SELECT p.*, u.username FROM pastes p LEFT JOIN users u ON p.user_id = u.id
       WHERE p.visibility = 'public' ORDER BY p.created_at DESC`
    );
    return rows;
  },

  async getAllPastes() {
    const { rows } = await pool.query(
      'SELECT p.*, u.username FROM pastes p LEFT JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC'
    );
    return rows;
  },

  async getUserPastes(userId) {
    const { rows } = await pool.query(
      'SELECT * FROM pastes WHERE user_id = $1 ORDER BY created_at DESC', [userId]
    );
    return rows;
  },

  async deletePaste(slug) {
    await pool.query('DELETE FROM pastes WHERE slug = $1', [slug]);
  },

  async getStats() {
    const [u, p, pub, v] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM pastes'),
      pool.query("SELECT COUNT(*) as count FROM pastes WHERE visibility='public'"),
      pool.query('SELECT SUM(views) as total FROM pastes'),
    ]);
    return {
      users: parseInt(u.rows[0].count),
      pastes: parseInt(p.rows[0].count),
      publicPastes: parseInt(pub.rows[0].count),
      totalViews: parseInt(v.rows[0].total) || 0,
    };
  }
};