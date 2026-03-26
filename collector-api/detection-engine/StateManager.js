export class StateManager {
  constructor() {
    // 🧠 Tracking the failures
    this.ipFailures = new Map();
    this.sessionFailures = new Map();
    
    // 🌍 Global Request Rates
    this.ipRequests = new Map();
    this.sessionRequests = new Map();
    
    // 🌐 Tracking unique endpoints accessed by session
    this.sessionEndpoints = new Map();
    
    // ⏳ Tracking the cooldowns (so we don't spam alerts)
    this.ipAlerts = new Map();
    this.sessionAlerts = new Map();
    
    this.windowSeconds = 60;
    this.threshold = 5;
  }

  recordEvent(event) {
    if (!event.actor || (!event.actor.ip && !event.actor.session_id)) return null;
  
    const now = event.timestamp;
    const ip = event.actor.ip;
    const session = event.actor.session_id;

    // GLOBAL TRACKING (Record ALL requests to properly feed temporal ML)
    if (ip) this.addTimestamp(this.ipRequests, ip, now);
    if (session) this.addTimestamp(this.sessionRequests, session, now);

    // Only process login attempts for the Native RuleEngine alerts
    if (event.event_type !== "login_attempt") return null;
  
    const isSuccess = event.behavior && event.behavior.successful_auth_attempts > 0;
    const isFailure = event.behavior && event.behavior.failed_auth_attempts > 0;
  
    // 1️⃣ SUCCESS RESET: If they log in successfully, clear their failure history
    if (isSuccess) {
      if (ip) this.ipFailures.delete(ip);
      if (session) this.sessionFailures.delete(session);
      // Also clear session endpoints on successful login
      if (session) this.sessionEndpoints.delete(session);
      return null; 
    }
  
    if (!isFailure) return null;
  
    // Record the failure
    if (ip) this.addFailure(this.ipFailures, ip, now);
    if (session) this.addFailure(this.sessionFailures, session, now);
  
    // Track endpoint if provided
    if (session && event.request?.path) {
      this.trackEndpoint(session, event.request.path);
    }
    
    // Update session activity timestamp and clean up old sessions periodically
    if (session) {
      this.updateSessionActivity(session, now);
    }
    this.cleanupExpiredSessions(now);
    
    const ipCount = ip ? this.countRecent(this.ipFailures, ip, now) : 0;
    const sessionCount = session ? this.countRecent(this.sessionFailures, session, now) : 0;
  
    // Check if they are currently on cooldown (already triggered an alert recently)
    const ipOnCooldown = ip && this.isOnCooldown(this.ipAlerts, ip, now);
    const sessionOnCooldown = session && this.isOnCooldown(this.sessionAlerts, session, now);
  
    // 2️⃣ POST-TRIGGER COOLDOWN: Only trigger if threshold is met AND they aren't on cooldown
    if ((ipCount >= this.threshold && !ipOnCooldown) || 
        (sessionCount >= this.threshold && !sessionOnCooldown)) {
        
      // Mark them as alerted to start the 60-second cooldown timer
      if (ipCount >= this.threshold && ip) this.ipAlerts.set(ip, now);
      if (sessionCount >= this.threshold && session) this.sessionAlerts.set(session, now);
  
      return {
        rule_id: "BRUTE_FORCE_STATEFUL",
        severity: "HIGH",
        evidence: [
          { field: "actor.ip", value: ip },
          { field: "actor.session_id", value: session },
          { field: "failure_count", value: Math.max(ipCount, sessionCount) },
          { field: "window_seconds", value: this.windowSeconds }
        ],
        timestamp: now
      };
    }
  
    return null;
  }

  addFailure(map, key, timestamp) {
    this.addTimestamp(map, key, timestamp);
  }

  addTimestamp(map, key, timestamp) {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(timestamp);
  }

  getIpRequestRate(ip, now) {
    return this.countRecent(this.ipRequests, ip, now);
  }

  getSessionRequestRate(sessionId, now) {
    return this.countRecent(this.sessionRequests, sessionId, now);
  }
  
  getIpFailuresLast60s(ip, now) {
    return this.getFailureCount(ip, now);
  }

  countRecent(map, key, now) {
    if (!key || !map.has(key)) return 0;

    const cutoff = now - this.windowSeconds * 1000;
    const recent = map.get(key).filter(ts => ts >= cutoff);
    map.set(key, recent);
    return recent.length;
  }
  
  isOnCooldown(map, key, now) {
    if (!key || !map.has(key)) return false;
    
    const lastAlertTime = map.get(key);
    const cutoff = now - this.windowSeconds * 1000;
    
    // If the last alert was within the 60-second window, they are on cooldown
    if (lastAlertTime >= cutoff) {
      return true;
    } else {
      // Time's up! Remove the cooldown
      map.delete(key);
      return false;
    }
  }
  
  /**
   * Get the count of failures for an IP within the time window
   * @param {string} ip - IP address to check
   * @param {number} now - Current timestamp for window calculation
   * @returns {number} Count of recent failures for the IP
   */
  getFailureCount(ip, now) {
    if (!ip || !this.ipFailures.has(ip)) return 0;
    
    const cutoff = now - this.windowSeconds * 1000;
    const recent = this.ipFailures.get(ip).filter(ts => ts >= cutoff);
    this.ipFailures.set(ip, recent);
    return recent.length;
  }
  
  /**
   * Get the velocity of failures for an IP (failures per second)
   * @param {string} ip - IP address to check
   * @param {number} now - Current timestamp for window calculation
   * @returns {number} Velocity of failures (failures per second)
   */
  getFailureVelocity(ip, now) {
    if (!ip || !this.ipFailures.has(ip)) return 0;
    
    const cutoff = now - this.windowSeconds * 1000;
    const recent = this.ipFailures.get(ip).filter(ts => ts >= cutoff);
    this.ipFailures.set(ip, recent);
    
    if (recent.length === 0) return 0;
    
    // Calculate the time range covered by the failures
    const minTime = Math.min(...recent);
    const timeRangeSec = (now - minTime) / 1000;
    
    // Avoid division by zero if time range is very small
    return timeRangeSec > 0 ? recent.length / timeRangeSec : recent.length / this.windowSeconds;
  }
  
  /**
   * Get the count of unique endpoints accessed by a session
   * @param {string} sessionId - Session ID to check
   * @returns {number} Count of unique endpoints accessed by the session
   */
  getUniqueEndpointCount(sessionId) {
    if (!sessionId || !this.sessionEndpoints.has(sessionId)) return 0;
    
    return this.sessionEndpoints.get(sessionId).size;
  }
  
  /**
   * Track an endpoint accessed by a session
   * @param {string} sessionId - Session ID
   * @param {string} endpoint - Endpoint accessed
   * @private
   */
  trackEndpoint(sessionId, endpoint) {
    if (!sessionId || !endpoint) return;
    
    if (!this.sessionEndpoints.has(sessionId)) {
      this.sessionEndpoints.set(sessionId, new Set());
    }
    
    this.sessionEndpoints.get(sessionId).add(endpoint);
  }
  
  /**
   * Cleans up expired sessions from the sessionEndpoints map
   * This prevents indefinite growth of the map during long-running simulations
   * @param {number} now - Current timestamp for cleanup logic
   * @private
   */
cleanupExpiredSessions(now) {
  const cutoff = now - this.windowSeconds * 1000;

  if (!this.sessionActivityTimestamps) return;

  for (const [sessionId, lastActive] of this.sessionActivityTimestamps) {
    if (lastActive < cutoff) {
      this.sessionEndpoints.delete(sessionId);
      this.sessionActivityTimestamps.delete(sessionId);
    }
  }
}
  
  /**
   * Updates the activity timestamp for a session
   * @param {string} sessionId - Session ID
   * @param {number} now - Current timestamp
   * @private
   */
  updateSessionActivity(sessionId, now) {
    if (!this.sessionActivityTimestamps) {
      this.sessionActivityTimestamps = new Map();
    }
    this.sessionActivityTimestamps.set(sessionId, now);
  }
}