import axios from 'axios';

async function runTest() {
  console.log('--- TEST 1: EMPTY PAYLOAD {} ---');
  try {
    await axios.post('http://localhost:5000/api/collect/frontend', {});
    console.log('Test 1 Failed: Server accepted empty payload.');
  } catch (err) {
    console.log(`Received Expected Rejection:`);
    console.log(`> Status: ${err.response?.status} ${err.response?.statusText}`);
    console.log(`> Body: ${JSON.stringify(err.response?.data, null, 2)}`);
  }

  console.log('\n--- TEST 2: CORRECT PAYLOAD ---');
  try {
    const res = await axios.post('http://localhost:5000/api/collect/frontend', {
      sessionId: 'test_session_123',
      url: 'http://example.com/safe',
      request: { method: 'POST' }
    });
    console.log(`Received Expected Acceptance:`);
    console.log(`> Status: ${res.status} ${res.statusText}`);
    console.log(`> Body: ${JSON.stringify(res.data, null, 2)}`);
  } catch (err) {
    console.log(`Test 2 Failed: Server rejected valid payload - ${err.message}`);
  }
}
runTest();
