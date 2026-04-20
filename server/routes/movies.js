// server/routes/movies.js
// List, detail, and create-review endpoints for movies.

const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Whitelist sort/order to prevent SQL injection via query string.
const SORT_COLUMNS = {
  title: 'm.title',
  year: 'm.year',
  rating: 'avg_rating'
};
const ORDER_VALUES = { asc: 'ASC', desc: 'DESC' };

// GET /api/movies?genre=&sort=&order=
router.get('/', (req, res, next) => {
  try {
    const { genre } = req.query;
    const sortKey = (req.query.sort || 'title').toLowerCase();
    const orderKey = (req.query.order || 'asc').toLowerCase();

    const sortCol = SORT_COLUMNS[sortKey];
    const orderDir = ORDER_VALUES[orderKey];

    if (!sortCol) {
      return res.status(400).json({ error: 'Invalid sort (use rating, year, or title)' });
    }
    if (!orderDir) {
      return res.status(400).json({ error: 'Invalid order (use asc or desc)' });
    }

    const whereParts = [];
    const params = [];
    if (typeof genre === 'string' && genre.trim() !== '') {
      whereParts.push('m.genre LIKE ?');
      params.push('%' + genre.trim() + '%');
    }
    const whereSql = whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : '';

    // NULL ratings sort last in asc by coalesce, first in desc - use a secondary sort on title for stability.
    const sql = `
      SELECT
        m.id, m.title, m.year, m.genre, m.synopsis, m.poster_url, m.tmdb_id,
        COALESCE(ROUND(AVG(r.rating), 2), 0) AS avg_rating,
        COUNT(r.id) AS review_count
      FROM movies m
      LEFT JOIN reviews r ON r.movie_id = m.id
      ${whereSql}
      GROUP BY m.id
      ORDER BY ${sortCol} ${orderDir}, m.title ASC
    `;

    const movies = db.prepare(sql).all(...params);
    res.json({ movies });
  } catch (err) {
    next(err);
  }
});

// GET /api/movies/:id
router.get('/:id', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid movie id' });
    }

    const movie = db.prepare(`
      SELECT
        m.id, m.title, m.year, m.genre, m.synopsis, m.poster_url, m.tmdb_id,
        COALESCE(ROUND(AVG(r.rating), 2), 0) AS avg_rating,
        COUNT(r.id) AS review_count
      FROM movies m
      LEFT JOIN reviews r ON r.movie_id = m.id
      WHERE m.id = ?
      GROUP BY m.id
    `).get(id);

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const reviewRows = db.prepare(`
      SELECT
        r.id, r.rating, r.comment, r.likes, r.created_at,
        u.id AS user_id, u.username AS user_username
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.movie_id = ?
      ORDER BY r.created_at DESC, r.id DESC
    `).all(id);

    const reviews = reviewRows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      likes: r.likes,
      created_at: r.created_at,
      user: { id: r.user_id, username: r.user_username }
    }));

    res.json({ movie: { ...movie, reviews } });
  } catch (err) {
    next(err);
  }
});

// POST /api/movies/:id/reviews  (auth required)
router.post('/:id/reviews', requireAuth, (req, res, next) => {
  try {
    const movieId = Number(req.params.id);
    if (!Number.isInteger(movieId) || movieId <= 0) {
      return res.status(400).json({ error: 'Invalid movie id' });
    }

    const { rating, comment } = req.body || {};

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }
    if (typeof comment !== 'string' || comment.trim() === '') {
      return res.status(400).json({ error: 'Comment is required' });
    }

    const movieExists = db.prepare('SELECT 1 FROM movies WHERE id = ?').get(movieId);
    if (!movieExists) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const info = db.prepare(
      'INSERT INTO reviews (movie_id, user_id, rating, comment) VALUES (?, ?, ?, ?)'
    ).run(movieId, req.session.userId, ratingNum, comment.trim());

    const row = db.prepare(`
      SELECT
        r.id, r.movie_id, r.rating, r.comment, r.likes, r.created_at,
        u.id AS user_id, u.username AS user_username
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.id = ?
    `).get(info.lastInsertRowid);

    res.status(201).json({
      review: {
        id: row.id,
        movie_id: row.movie_id,
        rating: row.rating,
        comment: row.comment,
        likes: row.likes,
        created_at: row.created_at,
        user: { id: row.user_id, username: row.user_username }
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
