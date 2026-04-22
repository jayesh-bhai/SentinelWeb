/**
 * Threat Scorer Module
 * Purpose: Convert rule hits and normalized events into threat decisions
 * Input: rule hits + normalized event
 * Output: threat decision object
 * ML can only modify confidence
 */

export class ThreatScorer {
  constructor() { }

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
    const anomalyScore = parseFloat(mlResult.anomaly_score || 0.5);
    let mlAdjustment = (anomalyScore - 0.5) * 0.5; // Modifier

    // 2.5 ML AUTONOMY OVERRIDE (Safety net for true zero-day attacks only)
    // Only activates when NO rules matched AND the ML model is extremely confident (≥0.85).
    // This prevents normal batch telemetry (which scores ~0.55-0.65) from flooding the dashboard.
    if (ruleHits.length === 0 && anomalyScore >= 0.85) {
      baseScore = anomalyScore;
      maxRuleSeverity = anomalyScore >= 0.95 ? "CRITICAL" : "HIGH";
      mlAdjustment = 0; // It is the base score now, so no adjustment needed
    }

    // 3. Fusion Logic
    let finalConfidence = Math.min(1.0, Math.max(0, baseScore + mlAdjustment));

    // 4. Decision Logic
    const THREAT_THRESHOLD = 0.60;
    const SUSPICIOUS_THRESHOLD = 0.25;

    let verdict = "SAFE";
    if (finalConfidence >= THREAT_THRESHOLD) verdict = "THREAT";
    else if (finalConfidence >= SUSPICIOUS_THRESHOLD) verdict = "SUSPICIOUS";

    // 5. Generate Reasoning Summary
    const mlImpact = mlAdjustment === 0 ? '' : (mlAdjustment > 0 ? `increased by ${mlAdjustment.toFixed(2)}` : `decreased by ${Math.abs(mlAdjustment).toFixed(2)}`);
    const reasoning = ruleHits.length > 0
      ? `Base score ${baseScore.toFixed(2)} (${maxRuleSeverity} rule) ${mlImpact} due to behavior analysis.`
      : (anomalyScore >= 0.85 
          ? `Autonomous ML Deflection: Extreme mathematical anomaly detected with a confidence of ${(anomalyScore * 100).toFixed(0)}%.`
          : `No rules hit. Behavioral anomaly score ${anomalyScore.toFixed(2)} resulted in aggregate confidence ${finalConfidence.toFixed(2)}.`);

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

    // Dynamically classify autonomous anomalies based on leading statistical features
    let mlAutonomousThreatType = "BEHAVIORAL_ANOMALY";
    
    // 1. First, check if the backend agent explicitly embedded a security label in the batched payloads
    if (event && event.payloads && Array.isArray(event.payloads)) {
      const payloadStr = JSON.stringify(event.payloads).toUpperCase();
      if (payloadStr.includes('XSS')) {
        mlAutonomousThreatType = "XSS_ANOMALY";
      } else if (payloadStr.includes('BRUTE') || payloadStr.includes('LOGIN')) {
        mlAutonomousThreatType = "BRUTE_FORCE_ANOMALY";
      } else if (payloadStr.includes('SQL')) {
        mlAutonomousThreatType = "SQLI_ANOMALY";
      }
    }

    // 2. If no explicit label, infer mathematically from feature vectors
    if (mlAutonomousThreatType === "BEHAVIORAL_ANOMALY" && features && features.length >= 12) {
      if (features[11] > 0.10) { 
        // Abnormally high special character ratio strongly implies XSS payload injection
        mlAutonomousThreatType = "XSS_ANOMALY";
      } else if (features[0] > 0) { 
        // Spike in IP failures
        mlAutonomousThreatType = "BRUTE_FORCE_ANOMALY";
      } else if (features[4] > 0) {
        // High rate violation
        mlAutonomousThreatType = "RATE_ABUSE_ANOMALY";
      } else if (features[5] > 0.8) {
        mlAutonomousThreatType = "SESSION_HIJACK_ANOMALY";
      }
    }

    return {
      is_threat: verdict === "THREAT",
      threat_type: ruleHits.length > 0 ? ruleHits[0].rule_id : ((verdict === "SUSPICIOUS" || verdict === "THREAT") ? mlAutonomousThreatType : "NONE"),
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