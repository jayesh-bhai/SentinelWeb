/**
 * Threat Scorer Module
 * Purpose: Convert rule hits and normalized events into threat decisions
 * Input: rule hits + normalized event
 * Output: threat decision object
 * ML can only modify confidence
 */

export class ThreatScorer {
  constructor() {}

  /**
   * Runs threat scoring logic based on rule hits and optional ML input
   * @param {Array} ruleHits - Array of rule hits from RuleEngine
   * @param {Object} event - Normalized event object
   * @param {Array} features - Pre-extracted features for ML model
   * @param {Object} mlResult - The result from ML Inference service { anomaly_score, is_anomaly }
   * @returns {Object} Threat assessment object
   */
  async runThreatScoring(ruleHits, event, features, mlResult) {
  
    // Check severity triggers
    const hasHighRule = ruleHits.some(r => r.severity === "HIGH");
    const hasMediumRule = ruleHits.some(r => r.severity === "MEDIUM");

    // Rule 1: High severity overrides everything. ML is ignored for decision making
    if (hasHighRule) {
      return {
        is_threat: true,
        threat_type: ruleHits.find(r => r.severity === "HIGH").rule_id,
        severity: "HIGH",
        confidence: "HIGH",
        explanation: "High severity rule triggered" + (mlResult.is_anomaly ? " (Confirmed by ML behavior)" : ""),
        rule_hits_count: ruleHits.length
      };
    }

    // Rule 2: Medium severity escalates to High if ML also sees anomalous behavior
    if (hasMediumRule && mlResult.is_anomaly) {
      return {
        is_threat: true,
        threat_type: ruleHits.find(r => r.severity === "MEDIUM").rule_id,
        severity: "HIGH",
        confidence: "MEDIUM",
        explanation: "Rule trigger supported by ML anomaly",
        rule_hits_count: ruleHits.length
      };
    }
    
    // Fallback: Medium severity alone stays Medium
    if (hasMediumRule) {
      return {
        is_threat: true,
        threat_type: ruleHits.find(r => r.severity === "MEDIUM").rule_id,
        severity: "MEDIUM",
        confidence: "LOW",
        explanation: "Medium severity rule triggered independently",
        rule_hits_count: ruleHits.length
      };
    }

    // Rule 3: No rules hit, but ML flagged behavior as anomalous 
    // It creates a LOW severity observational anomaly but DOES NOT issue a hard threat
    if (!ruleHits.length && mlResult.is_anomaly) {
      return {
        is_threat: false,
        threat_type: "BEHAVIORAL_ANOMALY",
        severity: "LOW",
        confidence: "LOW",
        explanation: "Behavioral anomaly detected by ML",
        rule_hits_count: 0
      };
    }

    // Rule 4: No hits anywhere
    return {
      is_threat: false,
      threat_type: "NONE",
      severity: "LOW",
      confidence: "LOW",
      explanation: "No threat detected",
      rule_hits_count: ruleHits.length
    };
  }

  /**
   * Generates explanation based on rule hits
   * @param {Array} ruleHits - Array of rule hits
   * @param {string} baseMessage - Base message to start explanation
   * @returns {string} Generated explanation
   */
  generateExplanation(ruleHits, baseMessage) {
    if (ruleHits.length === 0) {
      return baseMessage;
    }

    let explanation = `${baseMessage}: ${ruleHits[0].rule_id}. ${ruleHits.length} rule(s) triggered.`;

    // Add details about evidence if available
    if (ruleHits[0].evidence && ruleHits[0].evidence.length > 0) {
      const evidence = ruleHits[0].evidence[0];
      if (evidence.field && evidence.value) {
        explanation += ` Evidence found in "${evidence.field}" with value "${this.truncateValue(evidence.value)}".`;
      }
    }

    return explanation;
  }

  /**
   * Truncates a value for display in explanation
   * @param {*} value - Value to truncate
   * @returns {string} Truncated string representation
   */
  truncateValue(value) {
    let strValue;
    if (Array.isArray(value)) {
      if (value.length > 0 && value[0].value) {
        strValue = value[0].value;
      } else {
        strValue = JSON.stringify(value);
      }
    } else {
      strValue = String(value);
    }

    // Truncate to 50 characters max
    return strValue.length > 50 ? strValue.substring(0, 50) + '...' : strValue;
  }
}

export default ThreatScorer;