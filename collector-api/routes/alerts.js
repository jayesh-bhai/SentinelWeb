import express from 'express';

export function createAlertsRouter(db) {
  const router = express.Router();

  // GET /api/alerts - List all alerts with pagination
  router.get('/', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      const severity = req.query.severity;

      let query = `
        SELECT a.id, a.timestamp, a.session_id as ip, a.threat_type, a.severity, a.confidence, 
               CASE WHEN CAST(a.confidence AS REAL) > 0.0 THEN 'HYBRID' ELSE 'RULE' END as source, 
               a.matched_location as path,
               a.detection_logic
        FROM alerts a
      `;
      let params = [];
      
      if (severity) {
        query += ` WHERE a.severity = ?`;
        params.push(severity);
      }
      
      query += ` ORDER BY a.timestamp DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const alerts = await db.all(query, params);
      
      const enrichedAlerts = alerts.map(a => {
        let logic = null;
        try {
          if (a.detection_logic) logic = JSON.parse(a.detection_logic);
        } catch(e) {}

        return {
          id: a.id,
          timestamp: a.timestamp,
          ip: a.ip,
          path: a.path,
          severity: a.severity,
          detection: {
            type: a.threat_type,
            confidence: parseFloat(a.confidence || 0),
            source: a.source,
            reasoning: logic ? logic.ml_component?.classification || logic.verdict : 'Direct pattern match.'
          }
        };
      });
      
      let countQuery = `SELECT COUNT(*) as total FROM alerts`;
      let countParams = [];
      if (severity) {
        countQuery += ` WHERE severity = ?`;
        countParams.push(severity);
      }
      const { total } = await db.get(countQuery, countParams);
      
      res.json({
        status: 'success',
        data: enrichedAlerts,
        pagination: { 
          total, 
          page, 
          limit, 
          has_more: offset + alerts.length < total 
        }
      });
    } catch (e) {
      console.error('API Error /alerts:', e);
      res.status(500).json({ status: 'error', message: 'Failed to retrieve alerts' });
    }
  });

  // GET /api/alerts/:id - Detailed forensic analysis for a specific alert
  router.get('/:id', async (req, res) => {
    try {
      const alert = await db.get(`SELECT * FROM alerts WHERE id = ?`, [req.params.id]);
      if (!alert) return res.status(404).json({ status: 'error', message: 'Alert not found' });
      
      const rawEvent = await db.get(`
        SELECT event_data FROM raw_events 
        WHERE session_id = ? AND timestamp <= ? 
        ORDER BY timestamp DESC LIMIT 1
      `, [alert.session_id, alert.timestamp]);
      
      let behavior_metrics = null;
      let ml_score = null;
      let payloads = alert.offending_payload;
      
      if (rawEvent) {
        try {
          const enriched = JSON.parse(rawEvent.event_data);
          behavior_metrics = enriched.behavior || null;
          ml_score = enriched.ml_score || null;
          if (enriched.payloads && enriched.payloads.length > 0) {
            payloads = enriched.payloads;
          }
        } catch (parseError) {}
      }
      
      const logic = alert.detection_logic ? JSON.parse(alert.detection_logic) : null;
      
      res.json({
        status: 'success',
        data: {
          summary: {
            threat_type: alert.threat_type,
            severity: alert.severity,
            verdict: logic ? logic.verdict : (alert.confidence > 0.7 ? 'THREAT' : 'SUSPICIOUS'),
            explanation: alert.explanation
          },
          context: {
            id: alert.id,
            timestamp: alert.timestamp,
            ip: alert.session_id,
            path: alert.matched_location || 'unknown'
          },
          evidence: {
            payload: payloads,
            location: alert.matched_location || 'unknown'
          },
          detections: alert.rule_hits ? JSON.parse(alert.rule_hits).map(r => ({
            rule_id: r.rule_id,
            name: r.name || r.rule_id,
            description: r.description || 'Deterministic pattern match detected.',
            severity: r.severity
          })) : [],
          intelligence: {
            ml_score: parseFloat(ml_score || alert.confidence || 0),
            interpretation: logic ? logic.ml_component.classification : 'No behavioral divergence detected.',
            signals: behavior_metrics ? Object.entries(behavior_metrics).map(([key, value]) => ({
              label: key.replace(/_/g, ' ').toUpperCase(),
              value: value,
              is_anomaly: (key === 'request_count' && value > 50) || (key === 'rate_violation_count' && value > 0) || (key === 'failed_auth_attempts' && value > 3)
            })) : []
          }
        }
      });
    } catch (e) {
      console.error(`API Error /alerts/${req.params.id}:`, e);
      res.status(500).json({ status: 'error', message: 'Failed to retrieve alert details' });
    }
  });

  return router;
}
