import express from 'express';

function toFixedNumber(value, digits = 2) {
  const num = Number(value);
  return Number.isFinite(num) ? Number(num.toFixed(digits)) : 0;
}

function formatDuration(ms) {
  if (!ms || ms === 0) return '0s';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function extractFrontendPayload(eventRow) {
  if (!eventRow?.event_data) return null;

  try {
    const parsed = JSON.parse(eventRow.event_data);
    
    // Verify this is frontend agent data
    if (!parsed.userBehavior && !parsed.performanceMetrics && !parsed.pageMetrics && !parsed.sessionId) {
      return null;
    }

    const behavior = parsed.userBehavior || {};
    const perf = parsed.performanceMetrics || {};
    const page = parsed.pageMetrics || {};
    const securityEvents = Array.isArray(parsed.securityEvents) ? parsed.securityEvents : [];
    const errorEvents = Array.isArray(parsed.errorEvents) ? parsed.errorEvents : [];
    const networkEvents = Array.isArray(parsed.networkEvents) ? parsed.networkEvents : [];

    // Calculate network statistics
    const failedRequests = networkEvents.filter(e => e.status >= 400);
    const slowRequests = networkEvents.filter(e => e.responseTime > 1000);

    return {
      last_reported_at: parsed.timestamp ? new Date(parsed.timestamp).toISOString() : eventRow.timestamp,
      sessionId: parsed.sessionId || eventRow.session_id,
      url: parsed.url || 'unknown',
      userAgent: parsed.userAgent || 'unknown',
      sessionDuration: parsed.sessionDuration || 0,
      
      userBehavior: {
        mouseClicks: behavior.mouseClicks || 0,
        keystrokes: behavior.keystrokes || '[REDACTED]',
        scrollEvents: behavior.scrollEvents || 0,
        formInteractions: behavior.formInteractions || 0,
        idleTime: behavior.idleTime || 0,
        mouseMovements: Array.isArray(behavior.mouseMovements) ? behavior.mouseMovements.length : 0,
        clickPattern: Array.isArray(behavior.clickPattern) ? behavior.clickPattern.length : 0
      },
      
      performance: {
        memoryUsage: toFixedNumber((perf.memoryUsage || 0) * 100), // Convert to percentage
        networkLatency: perf.networkLatency || 0,
        renderTime: toFixedNumber(perf.renderTime || 0),
        jsExecutionTime: toFixedNumber(perf.jsExecutionTime || 0)
      },
      
      pageMetrics: {
        loadTime: page.loadTime || 0,
        domContentLoaded: page.domContentLoaded || 0,
        firstContentfulPaint: page.firstContentfulPaint || 0,
        largestContentfulPaint: page.largestContentfulPaint || 0,
        cumulativeLayoutShift: toFixedNumber(page.cumulativeLayoutShift || 0),
        firstInputDelay: toFixedNumber(page.firstInputDelay || 0)
      },
      
      security: {
        totalEvents: securityEvents.length,
        criticalEvents: securityEvents.filter(e => e.severity === 'critical').length,
        highEvents: securityEvents.filter(e => e.severity === 'high').length,
        mediumEvents: securityEvents.filter(e => e.severity === 'medium').length,
        lowEvents: securityEvents.filter(e => e.severity === 'low').length,
        recentEvents: securityEvents.slice(-10).reverse()
      },
      
      errors: {
        totalErrors: errorEvents.length,
        jsErrors: errorEvents.filter(e => e.type === 'javascript').length,
        networkErrors: errorEvents.filter(e => e.type === 'network').length,
        resourceErrors: errorEvents.filter(e => e.type === 'resource').length,
        recentErrors: errorEvents.slice(-10).reverse()
      },
      
      network: {
        totalRequests: networkEvents.length,
        failedRequests: failedRequests.length,
        slowRequests: slowRequests.length,
        avgResponseTime: networkEvents.length > 0 
          ? toFixedNumber(networkEvents.reduce((sum, e) => sum + (e.responseTime || 0), 0) / networkEvents.length)
          : 0,
        recentEvents: networkEvents.slice(-10).reverse()
      }
    };
  } catch {
    return null;
  }
}

export function createFrontendRuntimeRouter(db) {
  const router = express.Router();

  router.get('/frontend', async (req, res) => {
    try {
      // Fetch frontend agent events from database
      // Frontend events have session_id starting with 'session_' and server_id = 'unknown'
      const events = await db.all(
        `SELECT event_data, session_id, timestamp
         FROM raw_events
         WHERE session_id LIKE 'session_%' AND server_id = 'unknown'
         ORDER BY timestamp DESC
         LIMIT 100`
      );

      // Extract and filter valid frontend telemetry payloads
      const history = events
        .map(extractFrontendPayload)
        .filter(Boolean)
        .slice(0, 20) // Keep the most recent 20 valid snapshots
        .reverse(); // Chronological order for charting

      if (history.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'No frontend runtime telemetry available yet.'
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
      console.error('API Error /runtime/frontend:', e);
      res.status(500).json({ status: 'error', message: 'Failed to retrieve frontend runtime telemetry' });
    }
  });

  return router;
}
