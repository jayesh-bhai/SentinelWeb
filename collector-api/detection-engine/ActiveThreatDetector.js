// collector-api/detection-engine/ActiveThreatDetector.js

function severityToInt(sev) {
    if (sev === 'CRITICAL') return 4;
    if (sev === 'HIGH') return 3;
    if (sev === 'MEDIUM') return 2;
    return 1;
}

function intToSeverity(val) {
    if (val >= 4) return 'CRITICAL';
    if (val === 3) return 'HIGH';
    if (val === 2) return 'MEDIUM';
    return 'LOW';
}

function deriveSeverity(behaviorType, value) {
    if (behaviorType === 'RATE_VIOLATION') {
        return value > 50 ? 'CRITICAL' : 'HIGH';
    }
    if (behaviorType === 'FAILURE_SPIKE') {
        return value > 15 ? 'CRITICAL' : 'MEDIUM';
    }
    return 'LOW';
}

function deriveReason(behaviorType, value) {
    if (behaviorType === 'RATE_VIOLATION') {
        return `High request burst (${value} reqs/10s)`;
    }
    if (behaviorType === 'FAILURE_SPIKE') {
        return `Sustained auth failures (${value} fails/60s)`;
    }
    return `Unclassified anomaly`;
}

export function getActiveThreats(stateManager, recentAlerts) {
    const now = Date.now();
    const activeThreshold = now - 30000; // 30 seconds
    const suspiciousPool = new Map(); // IP -> { reasons: Set, severityInt }

    const addOrUpdateSuspicious = (ip, reason, severity) => {
        if (!ip) return;
        if (!suspiciousPool.has(ip)) {
            suspiciousPool.set(ip, {
                reasons: new Set([reason]),
                severityInt: severityToInt(severity)
            });
        } else {
            const current = suspiciousPool.get(ip);
            current.reasons.add(reason);
            current.severityInt = Math.max(current.severityInt, severityToInt(severity));
        }
    };

    // 1. Add Confirmed Alerts to Suspicious Pool
    for (const alert of recentAlerts) {
        // FIX 1: Safely grab the literal IP instead of just session_id
        const ip = alert.ip || alert.session_id;
        addOrUpdateSuspicious(ip, `Alert: ${alert.threat_type}`, alert.severity);
    }

    // 2. Add Behavioral Anomalies to Suspicious Pool (Pre-Alert state)
    // FIX 2: O(n) Array Scanning removed. Using native StateManager rolling counters.
    
    // Check Failure Spikes
    for (const ip of stateManager.ipFailures.keys()) {
        const recentFailures = stateManager.getFailureCount(ip, now);
        if (recentFailures >= 5) {
            addOrUpdateSuspicious(ip, deriveReason('FAILURE_SPIKE', recentFailures), deriveSeverity('FAILURE_SPIKE', recentFailures));
        }
    }

    // Check Rate Limit Spikes
    for (const ip of stateManager.ipRequests.keys()) {
        const recentRequests = stateManager.getIpRequestRate(ip, now);
        if (recentRequests >= 20) {
            addOrUpdateSuspicious(ip, deriveReason('RATE_VIOLATION', recentRequests), deriveSeverity('RATE_VIOLATION', recentRequests));
        }
    }

    // 3. Filter by Active State
    const activeThreats = [];

    for (const [ip, meta] of suspiciousPool.entries()) {
        // FIX 3: Last activity logic uses optimized O(1) tracker
        const latestActivity = stateManager.lastSeen.get(ip) || 0;
        const isRecentlyActive = latestActivity >= activeThreshold;

        if (isRecentlyActive) {
            // FIX 4: Reason priority aggregates all signals into a joined intel string
            activeThreats.push({
                ip: ip,
                status: "ACTIVE",
                severity: intToSeverity(meta.severityInt),
                reason: Array.from(meta.reasons).join(" + "),
                last_seen: new Date(latestActivity).toISOString()
            });
        }
    }

    return {
        count: activeThreats.length,
        actors: activeThreats.sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime())
    };
}
