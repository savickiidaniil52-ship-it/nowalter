const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
const db = require('./db');

const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new pgSession({
    conString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  }),
  secret: process.env.SESSION_SECRET || 'nowalter-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.use(async (req, res, next) => {
  req.currentUser = req.session.userId ? await db.getUserById(req.session.userId) : null;
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/pastes', require('./routes/pastes'));
app.use('/api/admin', require('./routes/admin'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NoWalter running on port ${PORT}`);
});