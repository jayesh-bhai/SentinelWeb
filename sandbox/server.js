import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import SentinelAgent from '@sentinelweb/backend-agent/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the vulnerable frontend
app.use(express.static(path.join(__dirname, 'public')));

// 🛡️ INJECT SENTINELWEB AGENT
// In a real-world scenario, this is the ONLY code a developer has to add
import SentinelWebBackend from '@sentinelweb/backend-agent/src/index.js';

const agent = new SentinelWebBackend({
  apiEndpoint: 'http://localhost:5000/api/collect/backend',
  debug: false
});
agent.start();

app.use(agent.middleware());


// ---------- VULNERABLE ENDPOINTS ---------- 

// Intentionally vulnerable to Brute Force & SQL Injection
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // Dummy DB Logic (Intentionally bad!)
  // Imagine: `SELECT * FROM users WHERE username='${username}' AND password='${password}'`
  
  // Quick fake validation for functional UI
  if (username === 'admin' && password === 'password123') {
    return res.status(200).json({ success: true, message: 'Welcome Admin!', token: 'VULNERABLE_JWT_TOKEN' });
  }

  // Simulate SQL injection trigger manually if Sentinel somehow bypassed
  if (username.includes('1=1') || username.includes('OR')) {
    return res.status(500).json({ success: false, message: 'Database Error: Syntax incorrect near ""' });
  }

  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// Intentionally vulnerable to XSS and Rate Limiting
app.get('/api/search', (req, res) => {
  const q = req.query.q;
  
  // Vulnerability: Reflected XSS
  // Vulnerability: No rate limits applied (Sentinel handles it natively!)
  res.status(200).send(`
    <html>
      <body>
         <h2>Search Results for: ${q}</h2>
         <p>No results found.</p>
      </body>
    </html>
  `);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🏦 VULNERABLE SANDBOX APP RUNNING`);
    console.log(`🌍 URL: http://localhost:${PORT}`);
    console.log(`🛡️  Protected by SentinelWeb v2.0`);
    console.log(`========================================\n`);
});
