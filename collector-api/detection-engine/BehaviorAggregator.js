// collector-api/detection-engine/BehaviorAggregator.js
// Utility module to build behavior analytics payloads for the UI.
// Hard‑coded thresholds as per user request.

export class BehaviorAggregator {
  constructor(stateManager) {
    this.state = stateManager;
    // Hard‑coded thresholds (can be moved to config later)
    this.failedAuthThreshold = 5; // failures in 60 s to trigger alert
    this.requestRateThreshold = 20; // requests per 10 s to flag violation
    this.windowSeconds = 60;
  }

  // Helper to bucket timestamps into per‑second buckets
  bucketPerSecond(timestamps) {
    if (!timestamps || !Array.isArray(timestamps)) return [];
    const buckets = {};
    timestamps.forEach(ts => {
      const sec = Math.floor(ts / 1000);
      buckets[sec] = (buckets[sec] || 0) + 1;
    });
    // Convert to sorted array
    return Object.entries(buckets)
      .map(([sec, count]) => ({ ts: Number(sec) * 1000, count }))
      .sort((a, b) => a.ts - b.ts);
  }

  // Build the full JSON contract for a given IP / session
  buildPayload({ ip, sessionId }) {
    const now = Date.now();
    const activeIp = ip || null;
    const session = sessionId || null;

    // ----- Failed Auth Timeline -----
    const failureTimestamps = [];
    if (activeIp && this.state.ipFailures.has(activeIp)) failureTimestamps.push(...this.state.ipFailures.get(activeIp));
    if (session && this.state.sessionFailures.has(session)) failureTimestamps.push(...this.state.sessionFailures.get(session));
    const failedAuth = this.bucketPerSecond(failureTimestamps);

    // ----- Request Rate Timeline -----
    const requestTimestamps = [];
    if (activeIp && this.state.ipRequests.has(activeIp)) requestTimestamps.push(...this.state.ipRequests.get(activeIp));
    if (session && this.state.sessionRequests.has(session)) requestTimestamps.push(...this.state.sessionRequests.get(session));
    const requestRate = this.bucketPerSecond(requestTimestamps).map(item => ({ ts: item.ts, rps: item.count }));

    // ----- Rate Violations -----
    const rateViolations = [];
    // Simple sliding‑window check for request spikes > threshold per 10 s
    const windowMs = 10 * 1000;
    if (requestRate.length > 0) {
      for (let i = 0; i < requestRate.length; i++) {
        const start = requestRate[i].ts;
        const end = start + windowMs;
        const observed = requestRate
          .filter(p => p.ts >= start && p.ts <= end)
          .reduce((sum, p) => sum + p.rps, 0);
        if (observed > this.requestRateThreshold) {
          rateViolations.push({
            window: '10s',
            threshold: this.requestRateThreshold,
            observed,
            ts_start: start,
            ts_end: end,
            severity: 'CRITICAL'
          });
        }
      }
    }

    // ----- Rolling Window Aggregates -----
    const rollingAggregates = [];
    const windowStart = now - this.windowSeconds * 1000;
    const ipFailCount = activeIp ? this.state.getFailureCount(activeIp, now) : 0;
    const sessionFailCount = session ? this.state.getFailureCount(session, now) : 0;
    const totalFailures = ipFailCount + sessionFailCount;
    const maxRps = requestRate.length > 0 ? Math.max(...requestRate.map(p => p.rps)) : 0;
    
    const violation = rateViolations.length > 0;
    const triggeredRules = [];
    if (ipFailCount >= this.failedAuthThreshold) triggeredRules.push('BRUTE_FORCE_IP');
    if (sessionFailCount >= this.failedAuthThreshold) triggeredRules.push('BRUTE_FORCE_SESSION');

    rollingAggregates.push({
      ts_start: windowStart,
      ts_end: now,
      failed_auth: totalFailures,
      max_rps: maxRps,
      violation: violation || triggeredRules.length > 0,
      triggered_rules: triggeredRules
    });

    // ----- Summary (Refined logic) -----
    const isThreat = violation || totalFailures > 0;
    const summary = {
      ip: activeIp || 'unknown',
      threat_type: violation ? 'RATE_ABUSE' : (totalFailures > 0 ? 'BRUTE_FORCE' : 'NORMAL'),
      severity: violation ? 'CRITICAL' : (totalFailures >= this.failedAuthThreshold ? 'HIGH' : (totalFailures > 0 ? 'MEDIUM' : 'LOW')),
      verdict: isThreat ? 'THREAT' : 'BENIGN',
      explanation: violation 
        ? 'Critical request rate violation detected' 
        : (totalFailures > 0 ? `Observed ${totalFailures} failed authentication attempts` : 'No abnormal behavioral patterns detected')
    };

    return {
      summary,
      timeline: {
        failed_auth: failedAuth,
        request_rate: requestRate
      },
      rate_violations: rateViolations,
      rolling_window: {
        size_seconds: this.windowSeconds,
        aggregates: rollingAggregates
      },
      evidence: null // filled by alert context if available
    };
  }
}
