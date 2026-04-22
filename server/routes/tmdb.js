// server/routes/tmdb.js
// Thin proxy to The Movie Database. Requires TMDB_API_KEY in the environment.
// If the key is missing, every route returns 503 so the rest of the site still works.

const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const TMDB_BASE = 'https://api.themoviedb.org/3';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

function keyOrNull() {
  const k = process.env.TMDB_API_KEY;
  return k && k.trim() !== '' ? k.trim() : null;
}

function yearOf(releaseDate) {
  if (!releaseDate) return null;
  const m = /^(\d{4})/.exec(releaseDate);
  return m ? Number(m[1]) : null;
}

function posterUrl(posterPath) {
  return posterPath ? POSTER_BASE + posterPath : null;
}

// GET /api/tmdb/search?q=...
router.get('/search', async (req, res, next) => {
  try {
    const key = keyOrNull();
    if (!key) {
      return res.status(503).json({ error: 'TMDb integration is not configured' });
    }

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    if (q.length > 100) {
      return res.status(400).json({ error: 'Query must be 100 characters or fewer' });
    }

    const url =
      `${TMDB_BASE}/search/movie?api_key=${encodeURIComponent(key)}` +
      `&query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`;

    let tmdbRes;
    try {
      tmdbRes = await fetch(url);
    } catch (_) {
      return res.status(502).json({ error: 'Could not reach TMDb' });
    }
    if (!tmdbRes.ok) {
      return res.status(502).json({ error: 'TMDb returned ' + tmdbRes.status });
    }
    const data = await tmdbRes.json();
    const rawResults = Array.isArray(data.results) ? data.results.slice(0, 20) : [];

    if (!rawResults.length) {
      return res.json({ results: [] });
    }

    // Annotate each with whether the movie is already in the local catalog.
    const ids = rawResults.map((m) => m.id);
    const placeholders = ids.map(() => '?').join(',');
    const existing = ids.length
      ? db.prepare(
          `SELECT id, tmdb_id FROM movies WHERE tmdb_id IN (${placeholders})`
        ).all(...ids)
      : [];
    const existingByTmdb = new Map(existing.map((r) => [r.tmdb_id, r.id]));

    const results = rawResults.map((m) => ({
      tmdb_id: m.id,
      title: m.title,
      year: yearOf(m.release_date),
      poster_url: posterUrl(m.poster_path),
      overview: m.overview || '',
      already_added: existingByTmdb.has(m.id),
      local_id: existingByTmdb.get(m.id) || null
    }));

    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// POST /api/tmdb/import/:tmdbId  (auth required)
router.post('/import/:tmdbId', requireAuth, async (req, res, next) => {
  try {
    const key = keyOrNull();
    if (!key) {
      return res.status(503).json({ error: 'TMDb integration is not configured' });
    }

    const tmdbId = Number(req.params.tmdbId);
    if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
      return res.status(400).json({ error: 'Invalid tmdbId' });
    }

    // Short-circuit if already imported.
    const local = db.prepare('SELECT * FROM movies WHERE tmdb_id = ?').get(tmdbId);
    if (local) {
      return res.status(409).json({ error: 'Movie already in catalog', movie: local });
    }

    const url = `${TMDB_BASE}/movie/${tmdbId}?api_key=${encodeURIComponent(key)}&language=en-US`;
    let tmdbRes;
    try {
      tmdbRes = await fetch(url);
    } catch (_) {
      return res.status(502).json({ error: 'Could not reach TMDb' });
    }
    if (tmdbRes.status === 404) {
      return res.status(404).json({ error: 'Movie not found on TMDb' });
    }
    if (!tmdbRes.ok) {
      return res.status(502).json({ error: 'TMDb returned ' + tmdbRes.status });
    }
    const m = await tmdbRes.json();

    const title = m.title || m.original_title;
    if (!title) {
      return res.status(502).json({ error: 'TMDb response missing title' });
    }

    const genre = Array.isArray(m.genres)
      ? m.genres.map((g) => g.name).filter(Boolean).join(', ')
      : '';

    const info = db.prepare(
      'INSERT INTO movies (title, year, genre, synopsis, poster_url, tmdb_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      title,
      yearOf(m.release_date),
      genre,
      m.overview || '',
      posterUrl(m.poster_path),
      tmdbId
    );

    const inserted = db.prepare(
      'SELECT id, title, year, genre, synopsis, poster_url, tmdb_id FROM movies WHERE id = ?'
    ).get(info.lastInsertRowid);

    res.status(201).json({ movie: inserted });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
