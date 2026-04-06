import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = 'velocity-secret-key-2026';

function getRequestIp(req) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  return ip.startsWith('::ffff:') ? ip.replace('::ffff:', '') : ip;
}

export default function createAuthRoutes(sentinel) {
  const router = express.Router();

  // POST /api/auth/login
  // Naturally vulnerable to brute force (no lockout, no rate limit)
  router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const clientIp = getRequestIp(req);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      sentinel?.recordAuthFailure(email || 'unknown', clientIp, 'Invalid email or password.');
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      sentinel?.recordAuthFailure(email || 'unknown', clientIp, 'Invalid email or password.');
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    sentinel?.recordAuthSuccess(user.id, clientIp);

    const token = jwt.sign({ id: user.id, email: user.email, name: user.display_name }, JWT_SECRET, { expiresIn: '2h' });

    res.cookie('token', token, { httpOnly: true, maxAge: 7200000 });
    res.json({
      success: true,
      message: `Welcome back, ${user.display_name}!`,
      user: { id: user.id, email: user.email, name: user.display_name }
    });
  });

  // POST /api/auth/signup
  router.post('/signup', (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)').run(email, hash, name);

    const token = jwt.sign({ id: result.lastInsertRowid, email, name }, JWT_SECRET, { expiresIn: '2h' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7200000 });

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: { id: result.lastInsertRowid, email, name }
    });
  });

  // POST /api/auth/logout
  router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out.' });
  });

  // GET /api/auth/me
  router.get('/me', (req, res) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ success: false, message: 'Not authenticated.' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json({ success: true, user: decoded });
    } catch {
      res.status(401).json({ success: false, message: 'Session expired.' });
    }
  });

  return router;
}
