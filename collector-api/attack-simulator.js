import axios from 'axios';

const API_URL = 'http://localhost:5000/api/collect/frontend';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateSQLInjection() {
  console.log('--- 1. Simulating SQL Injection Attack ---');
  try {
    const payload = {
      ip_address: '192.168.1.10',
      sessionId: 'sess_sql_1',
      url: 'http://example.com/search',
      request: {
        method: 'POST', // SQLI_001 triggers ONLY on POST
        body: "' OR 1=1 --"
      }
    };
    await axios.post(API_URL, payload);
    console.log('SQL Injection payload sent.\n');
  } catch (err) {
    console.error('SQL Injection request failed:', err?.response?.data || err.message);
  }
}

async function simulateBruteForce() {
  console.log('--- 2. Simulating Brute Force Attack ---');
  const ip = '192.168.1.20';
  const sessionId = 'sess_brute_2';
  
  // Rule BRUTE_FORCE_001 requires > 5 failures in behavior payload
  for (let i = 1; i <= 6; i++) {
    try {
      const payload = {
        ip_address: ip,
        sessionId: sessionId,
        url: 'http://example.com/login',
        behavior: {
          failed_auth_attempts: i,
          successful_auth_attempts: 0
        }
      };
      await axios.post(API_URL, payload);
      await delay(100);
    } catch (err) {}
  }
  console.log('Brute Force payloads sent.\n');
}

async function simulateRateAbuse() {
  console.log('--- 3. Simulating Rate Abuse Attack ---');
  const ip = '192.168.1.30';
  const sessionId = 'sess_rate_3';
  
  console.log('Firing 55 rapid requests...');
  for (let i = 1; i <= 55; i++) {
    const payload = {
      ip_address: ip,
      sessionId: sessionId,
      url: 'http://example.com/api/data',
      request: { method: 'GET' },
      behavior: {
        request_count: i,
        rate_violation_count: i > 50 ? i - 50 : 0
      }
    };
    
    try {
      await axios.post(API_URL, payload);
      if (i % 10 === 0) await delay(20);
    } catch(err) {} 
  }
  console.log('Rate Abuse payloads sent.\n');
}

async function runAll() {
  console.log('Starting Attack Simulator against Collector API (Layer 2 Validation)...\n');
  
  await simulateSQLInjection();
  await delay(2000);
  
  await simulateBruteForce();
  await delay(2000);
  
  await simulateRateAbuse();
  
  console.log('All simulations complete.');
}

runAll();
