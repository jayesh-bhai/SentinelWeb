// Detection Engine Module
// Implements the core detection logic for SentinelWeb
// Orchestrates the modules: EventAdapter, RuleEngine, ThreatScorer, Persistence, and StateManager

import { EventAdapter } from './EventAdapter.js';
import { RuleEngine } from './RuleEngine.js';
import { ThreatScorer } from './ThreatScorer.js';
import { Persistence } from './Persistence.js';
import { StateManager } from './StateManager.js';
import { FeatureExtractor } from './FeatureExtractor.js';
import { MLClient } from './MLClient.js';

export class DetectionEngine {
  constructor() {
    this.eventAdapter = new EventAdapter();
    this.ruleEngine = new RuleEngine();
    this.threatScorer = new ThreatScorer();
    this.persistence = new Persistence();
    this.stateManager = new StateManager();
    this.featureExtractor = new FeatureExtractor();
    this.mlClient = new MLClient();

    // Dataset generation mode flags
    this.datasetMode = false;
    this.datasetLogger = null;
  }

  async initialize() {
    // Initialize all modules
    await this.ruleEngine.initialize();
    await this.persistence.initialize();

    console.log('🛡️ Detection Engine initialized');
    console.log('📊 Loaded', this.ruleEngine.getRules().length, 'rules');
    console.log('💾 Database connected');
  }

  // Main detection method - entry point for the detection engine
  async processEvent(rawEvent, isAttack = 0) {
    try {
      // Validate event
      if (!this.eventAdapter.validateEvent(rawEvent)) {
        throw new Error('Invalid event: missing required fields');
      }

      // Store raw event
      await this.persistence.storeRawEvent(rawEvent);

      // Normalize the event
      const normalizedEvent = this.eventAdapter.normalizeEvent(rawEvent);

      // Run rule-based detection
      const ruleHits = await this.ruleEngine.runRuleEngine(normalizedEvent);

      const statefulHit = this.stateManager.recordEvent(normalizedEvent);

      if (statefulHit) {
        ruleHits.push(statefulHit);
      }

      // Extract features for ML model
      const features = this.featureExtractor.extractFeatures(normalizedEvent, ruleHits, this.stateManager);

      // Intercept execution if in dataset mode
      if (this.datasetMode && this.datasetLogger) {
        this.datasetLogger.logFeatures(features, isAttack);
        return {
          is_threat: false,
          threat_type: 'NONE',
          severity: 'LOW',
          confidence: 'LOW',
          explanation: 'Logged features to dataset'
        };
      }

      // Query the ML inference API
      const mlResult = await this.mlClient.predict(features);

      // Run threat scoring (Hybrid Rule + ML Model fusion)
      const threatAssessment = await this.threatScorer.runThreatScoring(ruleHits, normalizedEvent, features, mlResult);

      // 🔴 QA VALIDATION Requirement: MANDATORY DEBUG LOGGING
      console.log('\n[DEBUG LOG - QA VALIDATION]');
      console.log({
        ruleHits: ruleHits.map(r => r.rule_id),
        ml_score: mlResult.anomaly_score,
        final_decision: threatAssessment.severity
      });
      console.log('-------------------------------\n');

      // Generate alerts if threat detected
      if (threatAssessment.is_threat) {
        await this.generateAlert(threatAssessment, normalizedEvent, ruleHits);
      }

      return threatAssessment;
    } catch (error) {
      console.error('❌ Error in detection engine:', error);
      return {
        is_threat: false,
        threat_type: 'PROCESSING_ERROR',
        severity: 'HIGH',
        confidence: 'LOW',
        explanation: `Error processing event: ${error.message}`
      };
    }
  }

  async generateAlert(threatAssessment, normalizedEvent, ruleHits) {
    // Create alert record with structured information
    const alertData = {
      session_id: normalizedEvent.actor.session_id,
      server_id: normalizedEvent.actor.server_id || 'unknown',
      threat_type: threatAssessment.threat_type,
      severity: threatAssessment.severity,
      confidence: threatAssessment.confidence,
      explanation: threatAssessment.explanation,
      rule_hits: JSON.stringify(ruleHits), // Store structured rule evidence
      detection_logic: threatAssessment.detection_logic, // Store mathematical fusion metadata
      offending_payload: this.extractOffendingPayload(ruleHits),
      matched_location: this.extractMatchedLocation(ruleHits),
      timestamp: new Date().toISOString()
    };

    // Store in database
    await this.persistence.storeAlert(alertData);
  }

  extractOffendingPayload(ruleHits) {
    // Extract the first offending payload from evidence for alert storage
    if (ruleHits.length > 0 && ruleHits[0].evidence && ruleHits[0].evidence.length > 0) {
      const firstEvidence = ruleHits[0].evidence[0];
      if (firstEvidence.value) {
        // If it's an array (like payloads), get the first value
        if (Array.isArray(firstEvidence.value)) {
          if (firstEvidence.value.length > 0 && firstEvidence.value[0].value) {
            return firstEvidence.value[0].value;
          }
        } else {
          return String(firstEvidence.value);
        }
      }
    }
    return 'No specific payload identified';
  }

  extractMatchedLocation(ruleHits) {
    // Extract the location where the first match occurred
    if (ruleHits.length > 0 && ruleHits[0].evidence && ruleHits[0].evidence.length > 0) {
      return ruleHits[0].evidence[0].field || 'unknown';
    }
    return 'unknown';
  }

  async getAlerts(limit = 50) {
    // Retrieve recent alerts from database
    return await this.persistence.getAlerts(limit);
  }

  async getRawEvents(limit = 50) {
    // Retrieve recent raw events from database
    return await this.persistence.getRawEvents(limit);
  }
}

export default DetectionEngine;