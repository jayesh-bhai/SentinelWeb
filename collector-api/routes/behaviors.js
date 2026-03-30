// collector-api/routes/behaviors.js
import express from 'express';
import { BehaviorAggregator } from '../detection-engine/BehaviorAggregator.js';
import { StateManager } from '../detection-engine/StateManager.js';

export function createBehaviorsRouter(stateManager) {
  const router = express.Router();
  const aggregator = new BehaviorAggregator(stateManager);

  // GET /api/behaviors/:sessionId
  router.get('/:sessionId', async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      // Retrieve latest alert for this session to get IP if needed
      const alert = await stateManager.persistence?.db?.get(
        `SELECT session_id FROM alerts WHERE session_id = ? ORDER BY timestamp DESC LIMIT 1`,
        [sessionId]
      );
      const ip = alert ? alert.session_id : null;
      const payload = aggregator.buildPayload({ ip, sessionId });
      res.json({ status: 'success', data: payload });
    } catch (e) {
      console.error('API Error /behaviors/:sessionId', e);
      res.status(500).json({ status: 'error', message: 'Failed to retrieve behavior data' });
    }
  });

  return router;
}
