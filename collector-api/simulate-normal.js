import axios from 'axios';

const API_URL = 'http://localhost:5000/api/collect/frontend';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateScenarioA() {
  console.log('--- 🔹 Scenario A: Clean Normal User (Slow) ---');
  const ip = '10.0.1.100';
  const sessionId = 'scenario_a_sess_1';
  
  await axios.post(API_URL, {
    ip_address: ip, sessionId,
    event_type: 'login_attempt',
    url: 'http://example.com/login',
    behavior: { failed_auth_attempts: 0, successful_auth_attempts: 1 }
  }).catch(()=>{});

  await delay(1000 + Math.random() * 500);

  for(let i=1; i<=7; i++) {
    await axios.post(API_URL, {
      ip_address: ip, sessionId,
      url: `http://example.com/page${i}`,
      request: { method: 'GET' },
      behavior: { request_count: i + 1 }
    }).catch(()=>{});
    await delay(1500 + Math.random() * 2000);
  }
  console.log('Scenario A traffic sent.\n');
}

async function simulateScenarioB() {
  console.log('--- 🔹 Scenario B: Active Legit User (Moderate) ---');
  const ip = '10.0.1.101';
  const sessionId = 'scenario_b_sess_2';

  for(let i=1; i<=25; i++) {
    await axios.post(API_URL, {
      ip_address: ip, sessionId,
      url: `http://example.com/products?search=shoes&page=${i}`,
      request: { method: 'GET' },
      behavior: { request_count: i }
    }).catch(()=>{});
    await delay(500 + Math.random() * 800);
  }
  console.log('Scenario B traffic sent.\n');
}

async function simulateScenarioC() {
  console.log('--- 🔹 Scenario C: Power User / Dashboarding (Fast) ---');
  const ip = '10.0.1.102';
  const sessionId = 'scenario_c_sess_3';

  for(let i=1; i<=45; i++) {
    await axios.post(API_URL, {
      ip_address: ip, sessionId,
      url: `http://example.com/api/dashboard/widget-${i}`,
      request: { method: 'GET' },
      behavior: { request_count: i }
    }).catch(()=>{});
    await delay(100 + Math.random() * 200); 
  }
  console.log('Scenario C traffic sent.\n');
}

async function runAll() {
  console.log('Executing Normal Traffic ML Validation Suite...\n');
  await simulateScenarioA();
  await simulateScenarioB();
  await simulateScenarioC();
  console.log('All normal validation tests functionally complete.');
}

runAll();
