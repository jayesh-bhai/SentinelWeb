import axios from "axios";

const API_URL = "http://localhost:5000/api/collect/frontend";

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testEventType() {
  console.log("🚨 Testing event_type spoofing...");
  await axios.post(API_URL, {
    sessionId: "event_spoof_test",
    event_type: "HACK_THE_SYSTEM", // INVALID / malicious
    behavior: { failed_auth_attempts: 10 }
  }).catch(() => {});
  console.log("Payload sent with INVALID event_type");

  console.log("\n🚨 Testing False Positive Logic Abuse...");
  for (let i = 0; i < 10; i++) {
      await axios.post(API_URL, {
        sessionId: "event_logic_test",
        event_type: "login_attempt",
        behavior: { failed_auth_attempts: 0, successful_auth_attempts: 1 }
      }).catch(() => {});
      await delay(50);
  }
  console.log("Payloads sent for Logic Abuse test");
}

testEventType();
