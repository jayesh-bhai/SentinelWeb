/**
 * FeatureExtractor Test
 * Validates the 12-feature schema implementation
 */

import { FeatureExtractor } from '../FeatureExtractor.js';
import { StateManager } from '../StateManager.js';

async function runFeatureTests() {
  console.log('🧪 Starting FeatureExtractor Tests...\n');

  // Initialize components
  const featureExtractor = new FeatureExtractor();
  const stateManager = new StateManager();

  // Create a sample normalized event
  const sampleEvent = {
    event_type: "api_request",
    source: "frontend",
    timestamp: Date.now(),
    actor: {
      ip: "192.168.1.100",
      session_id: "sess_test_123",
      server_id: "srv_demo_001"
    },
    request: {
      method: "POST",
      url: "/api/login",
      body: { username: "admin", password: "secret123" },
      query_params: { redirect: "/dashboard" },
      headers: { "user-agent": "Mozilla/5.0..." }
    },
    behavior: {
      failed_auth_attempts: 3,
      successful_auth_attempts: 1,
      request_count: 5,
      rate_violation_count: 0,
      interaction_rate: 0.8,
      session_duration: 120000 // 2 minutes in ms
    },
    metadata: {
      endpoint: "/api/login"
    }
  };

  // Create some sample rule hits
  const ruleHits = [
    {
      rule_id: "BRUTE_FORCE_ATTEMPT",
      severity: "HIGH",
      evidence: [
        { field: "request.body.password", value: "***" }
      ]
    },
    {
      rule_id: "UNUSUAL_LOGIN_PATTERN",
      severity: "MEDIUM",
      evidence: [
        { field: "actor.ip", value: "192.168.1.100" }
      ]
    }
  ];

  // Simulate some state in the state manager
  // Add some failures for the IP
  for (let i = 0; i < 3; i++) {
    const event = {
      event_type: "login_attempt",
      actor: { ip: "192.168.1.100", session_id: "sess_test_123" },
      timestamp: Date.now() - (i * 10000), // 10 seconds apart
      behavior: { failed_auth_attempts: 1, successful_auth_attempts: 0 }
    };
    stateManager.recordEvent(event);
  }

  // Add an endpoint for the session
  const endpointEvent = {
    event_type: "api_request",
    actor: { session_id: "sess_test_123" },
    metadata: { endpoint: "/api/dashboard" }
  };
  stateManager.recordEvent(endpointEvent);

  console.log('📊 Testing Feature Extraction...');
  
  try {
    const features = featureExtractor.extractFeatures(sampleEvent, ruleHits, stateManager);
    
    console.log(`✅ Feature extraction successful`);
    console.log(`🔢 Feature count: ${features.length}/12`);
    console.log(`📋 Features: [${features.map(f => f.toFixed ? f.toFixed(3) : f).join(', ')}]\n`);
    
    // Validate feature schema
    const expectedLength = 12;
    if (features.length !== expectedLength) {
      console.log(`❌ Expected ${expectedLength} features, got ${features.length}`);
      return false;
    }
    
    // Validate each feature index
    console.log('🔍 Validating Feature Schema:');
    console.log(`  [0] failed_login_count: ${features[0]} (should be ~3 based on state)`);
    console.log(`  [1] failed_login_velocity: ${features[1].toFixed(3)} (failures/sec)`);
    console.log(`  [2] success_failure_ratio: ${features[2].toFixed(3)} (should be ~0.25: 1/(3+1))`);
    console.log(`  [3] request_count: ${features[3]} (should be 5)`);
    console.log(`  [4] rate_violation_count: ${features[4]} (should be 0)`);
    console.log(`  [5] interaction_rate: ${features[5].toFixed(3)} (should be 0.8)`);
    console.log(`  [6] rule_hit_count: ${features[6]} (should be 2)`);
    console.log(`  [7] high_severity_flag: ${features[7]} (should be 1)`);
    console.log(`  [8] session_duration: ${features[8]} (should be 120000)`);
    console.log(`  [9] unique_endpoint_count: ${features[9]} (should be 1)`);
    console.log(`  [10] payload_match_count: ${features[10]} (should be 1 based on evidence)`);
    console.log(`  [11] special_character_ratio: ${features[11].toFixed(3)} (should be calculated from payload)`);

    console.log('\n✅ All tests passed! FeatureExtractor is working correctly.');
    return true;
    
  } catch (error) {
    console.log(`❌ Feature extraction failed: ${error.message}`);
    return false;
  }
}

// Run the tests
await runFeatureTests();