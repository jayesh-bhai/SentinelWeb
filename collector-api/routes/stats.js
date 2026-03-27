import express from 'express';

export function createStatsRouter(db, collectorStats) {
  const router = express.Router();

  // GET /api/stats - Global system health and threat distribution metrics
  router.get('/', async (req, res) => {
    try {
      // Database Metrics
      const { total_24h } = await db.get(`SELECT COUNT(*) as total_24h FROM alerts WHERE timestamp > datetime('now', '-24 hour')`) || { total_24h: 0 };
      const { total_1h } = await db.get(`SELECT COUNT(*) as total_1h FROM alerts WHERE timestamp > datetime('now', '-1 hour')`) || { total_1h: 0 };
      
      const distribution = await db.all(`
        SELECT threat_type, COUNT(*) as count 
        FROM alerts 
        WHERE timestamp > datetime('now', '-24 hour') 
        GROUP BY threat_type
      `);
      
      const top_attackers = await db.all(`
        SELECT session_id as ip, COUNT(*) as count, MAX(severity) as severity 
        FROM alerts 
        WHERE timestamp > datetime('now', '-24 hour') 
        GROUP BY session_id 
        ORDER BY count DESC LIMIT 5
      `);
      
      const { active_threats } = await db.get(`
        SELECT COUNT(DISTINCT session_id) as active_threats 
        FROM alerts 
        WHERE timestamp > datetime('now', '-1 hour')
      `) || { active_threats: 0 };

      // UI Distribution Mapping
      const distMap = {};
      distribution.forEach(d => distMap[d.threat_type] = d.count);

      res.json({
        status: 'success',
        data: {
          threat_metrics: {
            total_1h,
            total_24h,
            distribution: distMap,
            top_attackers,
            active_threat_actors: active_threats
          },
          system_telemetry: collectorStats ? {
            uptime: collectorStats.uptime,
            total_requests: collectorStats.total_requests,
            active_agents: collectorStats.active_agents
          } : null
        }
      });
    } catch (e) {
      console.error('API Error /stats:', e);
      res.status(500).json({ status: 'error', message: 'Failed to retrieve statistics' });
    }
  });

  return router;
}
