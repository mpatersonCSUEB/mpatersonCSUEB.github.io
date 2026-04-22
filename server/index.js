// server/index.js
// Express app entry point for the Movie Review Website backend.

require('dotenv').config();

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const reviewRoutes = require('./routes/reviews');
const tmdbRoutes = require('./routes/tmdb');

// --- Secrets ---------------------------------------------------------------
let SESSION_SECRET = process.env.SESSION_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!SESSION_SECRET) {
  if (NODE_ENV === 'production') {
    // Fail closed in production.
    console.error('FATAL: SESSION_SECRET is not set. Refusing to start in production.');
    process.exit(1);
  } else {
    SESSION_SECRET = crypto.randomBytes(48).toString('hex');
    console.warn(
      'WARN: SESSION_SECRET is not set in .env. Using an ephemeral random secret for this process.\n' +
        '      Sessions will be invalidated on every restart. Create a .env file based on .env.example.'
    );
  }
}

const PORT = Number(process.env.PORT) || 3000;

// --- App -------------------------------------------------------------------
const app = express();

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use(
  session({
    name: 'connect.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
  })
);

// Serve the frontend bundle (populated by Agent 2).
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes.
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/tmdb', tmdbRoutes);

// 404 for unknown /api/* routes (non-API 404s fall through to static handler's 404).
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Centralized error handler. Never leak internals.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Movie Review API listening on http://localhost:${PORT}  [${NODE_ENV}]`);
  });
}

module.exports = app;
