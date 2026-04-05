import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /api/bikes - Catalog with filters
// VULNERABILITY: SQL Injection via string interpolation on `city` and `type` params
router.get('/', (req, res) => {
  try {
    const { city, type, sort } = req.query;

    // Intentionally using string interpolation (looks like a dev shortcut)
    let query = 'SELECT * FROM bikes WHERE available = 1';

    if (city) {
      query += ` AND city = '${city}'`;  // SQLi vector
    }
    if (type) {
      query += ` AND type = '${type}'`;  // SQLi vector
    }

    query += ' ORDER BY ' + (sort === 'price_desc' ? 'price_per_day DESC' : 'price_per_day ASC');

    const bikes = db.prepare(query).all();
    res.json({ success: true, data: bikes, count: bikes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load catalog.', error: err.message });
  }
});

// GET /api/bikes/search?q=term
// VULNERABILITY: Reflected XSS — the query is echoed back without sanitization
router.get('/search', (req, res) => {
  const q = req.query.q || '';

  try {
    const bikes = db.prepare("SELECT * FROM bikes WHERE model LIKE ? OR brand LIKE ? OR description LIKE ?")
      .all(`%${q}%`, `%${q}%`, `%${q}%`);

    res.json({
      success: true,
      query: q,  // Reflected back — frontend will render this unsanitized
      data: bikes,
      count: bikes.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Search failed.' });
  }
});

// GET /api/bikes/:id
router.get('/:id', (req, res) => {
  const bike = db.prepare('SELECT * FROM bikes WHERE id = ?').get(req.params.id);
  if (!bike) return res.status(404).json({ success: false, message: 'Bike not found.' });
  res.json({ success: true, data: bike });
});

// GET /api/bikes/:id/availability
// VULNERABILITY: Rate abuse — no throttle, lightweight endpoint that can be hammered
router.get('/:id/availability', (req, res) => {
  const bike = db.prepare('SELECT id, model, available, city FROM bikes WHERE id = ?').get(req.params.id);
  if (!bike) return res.status(404).json({ success: false, available: false });

  res.json({
    success: true,
    bike_id: bike.id,
    model: bike.model,
    city: bike.city,
    available: bike.available === 1,
    next_available: bike.available ? 'Now' : '2026-04-10',
    checked_at: new Date().toISOString()
  });
});

export default router;
