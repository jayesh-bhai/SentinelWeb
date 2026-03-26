import axios from "axios";
import http from "http";

const API_URL = "http://localhost:5000/api/collect/frontend";
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 1000 });

async function combinedAttack() {
  console.log("🚨 Initiating COMBINED ATTACK SIMULATION...");
  
  const requests = [];

  for (let i = 0; i < 15000; i++) {
    requests.push(
      axios.post(API_URL, {
        sessionId: "combined_attack_" + i,
        ip_address: "123.123.123.123", // Spoofed IP
        event_type: "MALICIOUS_EVENT", // Invalid/Spoofed Event
        request: { method: "POST" },
        behavior: { failed_auth_attempts: 1 }
      }, { httpAgent }).catch(() => {})
    );
  }

  await Promise.all(requests);
  console.log("✅ Combined attack complete!");
}

combinedAttack();
