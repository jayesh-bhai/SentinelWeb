import { DetectionEngine } from './detection-engine/index.js';

async function runTest() {
  console.log('🧪 Starting End-to-End Hybrid Pipeline Test...\n');
  const engine = new DetectionEngine();
  await engine.initialize();

  // Test Event 1: Normal Product Browsing
  const eventNormal = {
    "event_type": "http_request",
    "source": "frontend",
    "timestamp": Date.now(),
    "session_id": "sess_test_normal_1",
    "ip": "10.0.0.12",
    "request": {
      "method": "GET",
      "path": "/products",
      "query_params": {
        "category": "electronics"
      }
    }
  };

  // Test Event 2: Anomalous SQL Injection Attempt 
  const eventAttack = {
    "event_type": "http_request",
    "source": "frontend",
    "timestamp": Date.now(),
    "session_id": "sess_test_attack_1",
    "ip": "192.168.100.5",
    "request": {
      "method": "POST",
      "path": "/login",
      "body": {
        "username": "admin",
        "password": "' OR 1=1 --"
      }
    }
  };

  console.log("\n▶️  Sending Normal Event through pipeline...");
  const result1 = await engine.processEvent(eventNormal);
  console.log("Normal Event ThreatScorer Result:");
  console.log(JSON.stringify(result1, null, 2));

  console.log("\n▶️  Sending Attack Event through pipeline...");
  const result2 = await engine.processEvent(eventAttack);
  console.log("Attack Event ThreatScorer Result:");
  console.log(JSON.stringify(result2, null, 2));

  await engine.persistence.close();
}

runTest().catch(console.error);
