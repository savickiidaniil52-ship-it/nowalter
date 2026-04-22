const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Session store using SQLite
const SQLiteStore = require('connect-sqlite3')(session);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: './data' }),
  secret: process.env.SESSION_SECRET || 'nowalter-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

// Make user available in all requests
app.use((req, res, next) => {
  req.currentUser = req.session.userId ? db.getUserById(req.session.userId) : null;
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pastes', require('./routes/pastes'));
app.use('/api/admin', require('./routes/admin'));

// All frontend routes → serve index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NoWalter running on port ${PORT}`);
});
