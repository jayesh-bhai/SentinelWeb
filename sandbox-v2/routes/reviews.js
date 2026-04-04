import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /api/reviews/:bikeId
router.get('/:bikeId', (req, res) => {
  try {
    const reviews = db.prepare('SELECT * FROM reviews WHERE bike_id = ? ORDER BY created_at DESC')
      .all(req.params.bikeId);
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load reviews.' });
  }
});

// POST /api/reviews/:bikeId
// VULNERABILITY: Stored XSS — content and user_name are stored and rendered without sanitization
router.post('/:bikeId', (req, res) => {
  const { user_name, content, rating } = req.body;

  if (!user_name || !content || !rating) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    // No sanitization — stored XSS vector
    db.prepare('INSERT INTO reviews (bike_id, user_name, content, rating) VALUES (?, ?, ?, ?)')
      .run(req.params.bikeId, user_name, content, parseInt(rating));

    res.status(201).json({ success: true, message: 'Review submitted!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
});

export default router;
