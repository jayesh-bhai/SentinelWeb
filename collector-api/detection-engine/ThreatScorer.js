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
   * @returns {Object} Threat assessment object including detection_logic
   */
  async runThreatScoring(ruleHits, event, features, mlResult) {
    // 1. Calculate Rule Base Score
    let baseScore = 0.0;
    let maxRuleSeverity = "LOW";
    
    if (ruleHits.length > 0) {
      if (ruleHits.some(r => r.severity === "CRITICAL")) {
        baseScore = 0.98;
        maxRuleSeverity = "CRITICAL";
      } else if (ruleHits.some(r => r.severity === "HIGH")) {
        baseScore = 0.90;
        maxRuleSeverity = "HIGH";
      } else if (ruleHits.some(r => r.severity === "MEDIUM")) {
        baseScore = 0.65;
        maxRuleSeverity = "MEDIUM";
      } else {
        baseScore = 0.40;
        maxRuleSeverity = "LOW";
      }
    }

    // 2. Calculate ML Adjustment (Contribution)
    // Reduce the weight of ML adjustment to +/- 0.15 to prevent it from single-handedly killing a HIGH rule
    const anomalyScore = parseFloat(mlResult.anomaly_score || 0.5);
    const mlAdjustment = (anomalyScore - 0.5) * 0.3; // 0.5 -> 0, 0.9 -> +0.12, 0.1 -> -0.12
    
    // 3. Fusion Logic
    let finalConfidence = Math.min(1.0, Math.max(0, baseScore + mlAdjustment));
    
    // 4. Decision Logic
    const THREAT_THRESHOLD = 0.60;
    const SUSPICIOUS_THRESHOLD = 0.25;
    
    let verdict = "SAFE";
    if (finalConfidence >= THREAT_THRESHOLD) verdict = "THREAT";
    else if (finalConfidence >= SUSPICIOUS_THRESHOLD) verdict = "SUSPICIOUS";

    // 5. Generate Reasoning Summary
    const mlImpact = mlAdjustment >= 0 ? `increased by ${mlAdjustment.toFixed(2)}` : `decreased by ${Math.abs(mlAdjustment).toFixed(2)}`;
    const reasoning = ruleHits.length > 0 
      ? `Base score ${baseScore.toFixed(2)} (${maxRuleSeverity} rule) ${mlImpact} due to behavior analysis.`
      : `No rules hit. Behavioral anomaly score ${anomalyScore.toFixed(2)} resulted in aggregate confidence ${finalConfidence.toFixed(2)}.`;

    // 6. Structured Detection Logic (Explainable UI/API)
    const detectionLogic = {
      summary: reasoning,
      engine_outputs: {
        rule_engine: {
          hits: ruleHits.map(r => r.rule_id),
          max_severity: maxRuleSeverity,
          base_score: baseScore
        },
        ml_component: {
          anomaly_score: anomalyScore,
          classification: mlResult.is_anomaly ? "ANOMALY" : "NORMAL",
          contribution: (mlAdjustment >= 0 ? "+" : "") + mlAdjustment.toFixed(2)
        }
      },
      fusion_logic: {
        formula: "min(1.0, max(0, BaseScore + (AnomalyScore - 0.5) * 0.4))",
        final_confidence: parseFloat(finalConfidence.toFixed(2)),
        decision_threshold: THREAT_THRESHOLD
      },
      verdict: verdict
    };

    return {
      is_threat: verdict === "THREAT",
      threat_type: ruleHits.length > 0 ? ruleHits[0].rule_id : (verdict === "SUSPICIOUS" ? "BEHAVIORAL_ANOMALY" : "NONE"),
      severity: verdict === "THREAT" ? maxRuleSeverity : (verdict === "SUSPICIOUS" ? "LOW" : "NONE"),
      confidence: finalConfidence.toFixed(2),
      explanation: reasoning,
      rule_hits_count: ruleHits.length,
      detection_logic: detectionLogic // New Structured Payload
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