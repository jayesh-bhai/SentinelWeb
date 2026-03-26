import axios from 'axios';

const API_URL = 'http://localhost:5000/api/collect/frontend';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateDistributedAttack() {
  console.log('--- 🌐 Simulating Distributed Attack (Botnet) ---');
  console.log('Goal: 50 unique IPs sending 1-2 rapid requests each.');

  const totalIps = 50;
  let requestsSent = 0;

  for (let i = 1; i <= totalIps; i++) {
    const fakeIp = `10.0.100.${i}`;
    const sessionId = `botnet_agent_${i}`;
    
    // Each bot fires 2 quick requests
    for (let reqNum = 1; reqNum <= 2; reqNum++) {
      try {
        await axios.post(
          API_URL, 
          {
            sessionId: sessionId,
            event_type: 'http_request',
            url: `http://example.com/api/v1/resource/${reqNum}`,
            request: { method: 'GET' },
            behavior: { request_count: reqNum }
          },
          {
            headers: { 'x-test-ip': fakeIp } // Dev-Only Override
          }
        );
        requestsSent++;
      } catch (err) {
        // Suppress connection errors for speed
      }
      await delay(10); // 10ms delay between the bot's 2 requests
    }
    await delay(20); // 20ms delay before next Bot wakes up
  }

  console.log(`\n✅ Distributed Attack complete.`);
  console.log(`Total Bots: ${totalIps} | Total Requests: ${requestsSent}`);
  console.log('Check Collector API for ML Scores. Expected: LOW (No detection).');
}

simulateDistributedAttack();
