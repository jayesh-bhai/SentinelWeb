import express from 'express';

function toFixedNumber(value, digits = 2) {
  const num = Number(value);
  return Number.isFinite(num) ? Number(num.toFixed(digits)) : 0;
}

function formatTopEndpoints(requestsByEndpoint = {}) {
  return Object.entries(requestsByEndpoint)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([endpoint, count]) => ({ endpoint, count }));
}

function extractRuntimePayload(eventRow) {
  if (!eventRow?.event_data) return null;

  try {
    const parsed = JSON.parse(eventRow.event_data);
    if (!parsed.authenticationMetrics && !parsed.apiMetrics && !parsed.performanceMetrics && !parsed.systemMetrics) {
      return null;
    }

    const auth = parsed.authenticationMetrics || {};
    const api = parsed.apiMetrics || {};
    const perf = parsed.performanceMetrics || {};
    const system = parsed.systemMetrics || {};
    const suspiciousLogins = Array.isArray(auth.suspiciousLogins) ? auth.suspiciousLogins : [];

    return {
      last_reported_at: parsed.timestamp ? new Date(parsed.timestamp).toISOString() : eventRow.timestamp,
      sessionId: parsed.sessionId || eventRow.session_id,
      serverId: parsed.serverId || eventRow.server_id,
      serverInfo: parsed.serverInfo || null,
      authentication: {
        totalLoginAttempts: auth.totalLoginAttempts || 0,
        successfulLogins: auth.successfulLogins || 0,
        failedLogins: auth.failedLogins || 0,
        blockedIPs: Array.isArray(auth.blockedIPs) ? auth.blockedIPs.length : 0,
        suspiciousLogins: suspiciousLogins.length,
        passwordResetRequests: auth.passwordResetRequests || 0,
        newUserRegistrations: auth.newUserRegistrations || 0,
        recentSuspiciousLogins: suspiciousLogins.slice(-5).reverse()
      },
      api: {
        totalRequests: api.totalRequests || 0,
        avgResponseTime: api.responseTimeAvg || 0,
        errorRate: toFixedNumber(api.errorRate || 0),
        rateLimitHits: api.rateLimitHits || 0,
        statusCodes: api.statusCodes || {},
        topEndpoints: formatTopEndpoints(api.requestsByEndpoint)
      },
      performance: {
        average: perf.responseTime?.average || 0,
        p95: perf.responseTime?.p95 || 0,
        p99: perf.responseTime?.p99 || 0,
        memoryPercent: toFixedNumber(perf.systemUsage?.systemUsagePercentage || 0),
        heapUsedBytes: perf.systemUsage?.heapUsed || 0
      },
      system: {
        uptimeMs: system.uptime || 0,
        uptimeHours: toFixedNumber((system.uptime || 0) / (1000 * 60 * 60))
      }
    };
  } catch {
    return null;
  }
}

export function createBackendRuntimeRouter(db) {
  const router = express.Router();

  router.get('/backend', async (req, res) => {
    try {
      // Fetch more events to build a history (e.g., last 20 telemetry snapshots)
      const events = await db.all(
        `SELECT event_data, session_id, server_id, timestamp
         FROM raw_events
         WHERE server_id != 'unknown'
         ORDER BY timestamp DESC
         LIMIT 100`
      );

      // Extract and filter valid telemetry payloads
      const history = events
        .map(extractRuntimePayload)
        .filter(Boolean)
        .slice(0, 20) // Keep the most recent 20 valid snapshots
        .reverse(); // Chronological order for charting

      if (history.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'No backend runtime telemetry available yet.'
        });
      }

      res.json({
        status: 'success',
        data: {
          latest: history[history.length - 1],
          history: history
        }
      });
    } catch (e) {
      console.error('API Error /runtime/backend:', e);
      res.status(500).json({ status: 'error', message: 'Failed to retrieve backend runtime telemetry' });
    }
  });

  return router;
}
