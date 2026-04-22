// server/routes/reviews.js
// Actions on existing reviews (like/upvote).

const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// POST /api/reviews/:id/like  (auth required)
router.post('/:id/like', requireAuth, (req, res, next) => {
  try {
    const reviewId = Number(req.params.id);
    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return res.status(400).json({ error: 'Invalid review id' });
    }

    const info = db.prepare(
      'UPDATE reviews SET likes = likes + 1 WHERE id = ?'
    ).run(reviewId);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const row = db.prepare('SELECT id, likes FROM reviews WHERE id = ?').get(reviewId);
    res.json({ id: row.id, likes: row.likes });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
