/**
 * FeatureExtractor.js
 * 
 * Clean, deterministic, minimal, defensible feature extraction module.
 * Bridge between detection engine and ML model.
 * 
 * 🔒 LOCKED FEATURE SCHEMA (Order: 0-11)
 * 0: failed_login_count      - number - stateful window
 * 1: failed_login_velocity   - number - stateful window  
 * 2: success_failure_ratio   - number - normalized event
 * 3: request_count           - number - normalized event
 * 4: rate_violation_count    - number - normalized event
 * 5: interaction_rate        - number - normalized event
 * 6: rule_hit_count          - number - RuleEngine
 * 7: high_severity_flag      - 0/1    - RuleEngine
 * 8: session_duration        - number - normalized event
 * 9: unique_endpoint_count   - number - stateful
 * 10: payload_match_count    - number - RuleEngine evidence
 * 11: special_character_ratio - number - payload analysis
 */

export class FeatureExtractor {
  constructor() {
    // No state needed - pure transformation module
  }

  /**
   * Extract features from normalized event, rule hits, and state manager
   * @param {Object} normalizedEvent - Canonical normalized event
   * @param {Array} ruleHits - Array of rule hits from RuleEngine
   * @param {StateManager} stateManager - State manager instance
   * @returns {Array} Fixed-length numeric array of 12 features
   */
  extractFeatures(normalizedEvent, ruleHits, stateManager) {
    // Validate inputs
    if (!normalizedEvent || !Array.isArray(ruleHits) || !stateManager) {
      throw new Error('Invalid inputs to extractFeatures');
    }

    // Extract IP and session from normalized event
    const ip = normalizedEvent.actor?.ip;
    const sessionId = normalizedEvent.actor?.session_id;

    // Calculate features in locked order (0-11)
    const features = [];

    // Feature 0: failed_login_count - number - stateful window
    features[0] = stateManager.getFailureCount(ip, normalizedEvent.timestamp) || 0;

    // Feature 1: failed_login_velocity - number - stateful window
    features[1] = stateManager.getFailureVelocity(ip, normalizedEvent.timestamp) || 0;

    // Feature 2: success_failure_ratio - number - normalized event
    const failedAuthAttempts = normalizedEvent.behavior?.failed_auth_attempts || 0;
    const successfulAuthAttempts = normalizedEvent.behavior?.successful_auth_attempts || 0;
    const totalAuthAttempts = failedAuthAttempts + successfulAuthAttempts;
    features[2] = totalAuthAttempts > 0 ? successfulAuthAttempts / totalAuthAttempts : 0;

    // Feature 3: request_count - number - normalized event
    features[3] = normalizedEvent.behavior?.request_count || 0;

    // Feature 4: rate_violation_count - number - normalized event
    features[4] = normalizedEvent.behavior?.rate_violation_count || 0;

    // Feature 5: interaction_rate - number - normalized event
    features[5] = normalizedEvent.behavior?.interaction_rate || 0;

    // Feature 6: rule_hit_count - number - RuleEngine
    features[6] = ruleHits.length || 0;

    // Feature 7: high_severity_flag - 0/1 - RuleEngine
    features[7] = ruleHits.some(hit => hit.severity === 'HIGH') ? 1 : 0;

    // Feature 8: session_duration - number - normalized event
    features[8] = normalizedEvent.behavior?.session_duration || 0;

    // Feature 9: unique_endpoint_count - number - stateful
    features[9] = stateManager.getUniqueEndpointCount(sessionId) || 0;

    // Feature 10: payload_match_count - number - RuleEngine evidence
    let payloadMatchCount = 0;
    for (const hit of ruleHits) {
      if (hit.evidence) {
        for (const evidence of hit.evidence) {
          if (evidence.field && evidence.field.includes('payload')) {
            payloadMatchCount++;
          }
        }
      }
    }
    features[10] = payloadMatchCount;

// Feature 11: special_character_ratio - payload analysis
let specialCharCount = 0;
let totalCharCount = 0;

// Primary: Use payloads array if available
if (normalizedEvent.payloads && Array.isArray(normalizedEvent.payloads)) {
  for (const payload of normalizedEvent.payloads) {
    if (payload.value && typeof payload.value === 'string') {
      totalCharCount += payload.value.length;
      specialCharCount += this.countSpecialCharacters(payload.value);
    }
  }
} else {
  // Fallback: Analyze request fields
  if (normalizedEvent.request?.body) {
    const bodyStr = JSON.stringify(normalizedEvent.request.body);
    totalCharCount += bodyStr.length;
    specialCharCount += this.countSpecialCharacters(bodyStr);
  }
  
  if (normalizedEvent.request?.query_params) {
    const queryParamsStr = JSON.stringify(normalizedEvent.request.query_params);
    totalCharCount += queryParamsStr.length;
    specialCharCount += this.countSpecialCharacters(queryParamsStr);
  }
  
  if (normalizedEvent.request?.headers) {
    const headersStr = JSON.stringify(normalizedEvent.request.headers);
    totalCharCount += headersStr.length;
    specialCharCount += this.countSpecialCharacters(headersStr);
  }
}

features[11] = totalCharCount > 0 ? specialCharCount / totalCharCount : 0;

    return features;
  }

  /**
   * Count special characters in a string
   * @param {string} str - Input string
   * @returns {number} Count of special characters
   * @private
   */
  countSpecialCharacters(str) {
    if (!str || typeof str !== 'string') return 0;
    
    // Count characters that are not alphanumeric or common safe characters
    const specialCharsRegex = /[^a-zA-Z0-9\s\-_.~:/?#\[\]@!$&'()*+,;=%]/g;
    const matches = str.match(specialCharsRegex);
    return matches ? matches.length : 0;
  }
}