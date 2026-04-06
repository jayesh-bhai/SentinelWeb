import express from 'express';
import cors from 'cors';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';

import db from './db.js';
import createAuthRoutes from './routes/auth.js';
import bikeRoutes from './routes/bikes.js';
import reviewRoutes from './routes/reviews.js';

// SentinelWeb Backend Agent (plug-and-play protection)
import { SentinelWebBackend } from '../agents/backend-agent/src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// --- Core Middleware ---
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- SentinelWeb Agent (1-line integration) ---
const sentinel = new SentinelWebBackend({
  apiEndpoint: 'http://localhost:5000/api/collect/backend',
  debug: false
});
sentinel.start();
app.use(sentinel.middleware());

// --- Static Files ---
app.use(express.static(path.join(__dirname, 'public')));

// --- API Routes ---
app.use('/api/auth', createAuthRoutes(sentinel));
app.use('/api/bikes', bikeRoutes);
app.use('/api/reviews', reviewRoutes);

// --- SPA Fallback ---
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║       🚴 Velo-City Bike Rental       ║`);
  console.log(`║   http://localhost:${PORT}              ║`);
  console.log(`╚══════════════════════════════════════╝\n`);
});
