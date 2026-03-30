import express from 'express';
import { getActiveThreats } from '../detection-engine/ActiveThreatDetector.js';

export function createActiveThreatsRouter(db, stateManager) {
  const router = express.Router();

  // GET /api/active-threats - Real-time active malicious session tracking
  router.get('/', async (req, res) => {
    try {
      // 1. Fetch recent alerts from the last 60 seconds (DB lookup)
      const recentAlerts = await db.all(`
        SELECT session_id, ip, threat_type, severity, timestamp
        FROM alerts
        WHERE timestamp > datetime('now', '-60 second')
      `);

      // 2. Compute true Active Threats using hybrid in-memory + DB state
      const activeData = getActiveThreats(stateManager, recentAlerts || []);

      res.json({
        status: 'success',
        data: activeData
      });
    } catch (e) {
      console.error('API Error /active-threats:', e);
      res.status(500).json({ status: 'error', message: 'Failed to evaluate active threats' });
    }
  });

  return router;
}
