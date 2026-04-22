// server/routes/auth.js
// Register / login / logout / me.

const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_ROUNDS = 10;

function publicUser(row) {
  if (!row) return null;
  return { id: row.id, username: row.username, email: row.email };
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, username, password } = req.body || {};

    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (typeof username !== 'string' || username.trim().length < 2) {
      return res.status(400).json({ error: 'Username must be at least 2 characters' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    let info;
    try {
      info = db.prepare(
        'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)'
      ).run(cleanEmail, cleanUsername, password_hash);
    } catch (err) {
      if (err && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({ error: 'Email or username already in use' });
      }
      throw err;
    }

    const user = db.prepare('SELECT id, email, username FROM users WHERE id = ?').get(info.lastInsertRowid);
    req.session.userId = user.id;
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const row = db.prepare(
      'SELECT id, email, username, password_hash FROM users WHERE email = ?'
    ).get(email.trim().toLowerCase());

    if (!row) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = row.id;
    res.json({ user: publicUser(row) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  if (!req.session) {
    return res.json({ ok: true });
  }
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const userId = req.session && req.session.userId;
  if (!userId) {
    return res.json({ user: null });
  }
  const row = db.prepare('SELECT id, email, username FROM users WHERE id = ?').get(userId);
  res.json({ user: publicUser(row) });
});

module.exports = router;
