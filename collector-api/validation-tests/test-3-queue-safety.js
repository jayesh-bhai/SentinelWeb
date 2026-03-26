import axios from "axios";
import http from "http";

const API_URL = "http://localhost:5000/api/collect/frontend";

// Stabilize the Test Script itself against client-side socket TCP exhaustion
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 1000 });

async function floodTest() {
  console.log("🚨 Attacking local API. Flooding system with 15,000 requests to guarantee 10K Queue Overflow...");

  const requests = [];

  for (let i = 0; i < 15000; i++) {
    requests.push(
      axios.post(API_URL, {
        sessionId: "flood_test_" + i,
        event_type: "http_request",
        request: { method: "GET" },
        behavior: {
          request_count: i
        }
      }, { httpAgent }).catch(() => {})
    );
  }

  await Promise.all(requests);
  console.log("✅ Flood complete. Check Server logs for Overflow queue drops and stable Memory.");
}

floodTest();
