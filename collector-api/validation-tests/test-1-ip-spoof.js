import axios from "axios";

const API_URL = "http://localhost:5000/api/collect/frontend";

async function testIpSpoof() {
  console.log("🚨 Testing IP Spoofing...");

  await axios.post(API_URL, {
    ip_address: "123.123.123.123", // FAKE IP (malicious input)
    sessionId: "spoof_test",
    event_type: "login_attempt",
    behavior: {
      failed_auth_attempts: 1
    }
  });

  console.log("Payload sent with FAKE IP");
}

testIpSpoof();
