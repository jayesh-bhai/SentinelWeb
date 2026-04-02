# 🛡️ SentinelWeb Backend Agent

[![npm version](https://img.shields.io/npm/v/@sentinelweb/backend-agent.svg)](https://www.npmjs.com/package/@sentinelweb/backend-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> A zero-config Node.js/Express middleware for detecting SQL injection, XSS, and rate limit abuse in real-time.

---

## 🚀 Installation

```bash
npm install @sentinelweb/backend-agent
```

## ⚡ Quickstart

The absolute minimum code required to integrate the agent into your Express application.

```javascript
import express from 'express';
import { SentinelWebBackend } from '@sentinelweb/backend-agent';

const app = express();

const sentinelAgent = new SentinelWebBackend({
  apiEndpoint: 'https://your-api.com/collect/backend',
  serverInfo: {
    serverId: 'prod-api-01',
    serverName: 'Production API Server',
    environment: 'production',
    version: '1.0.0'
  }
});

// Add monitoring middleware early in the chain
app.use(sentinelAgent.middleware());
app.use(express.json());

// Start the reporting interval
sentinelAgent.start();

app.listen(3000, () => console.log('🛡️ Protected by SentinelWeb'));
```

## ⚙️ Configuration API

When instantiating `SentinelWebBackend(config)`, pass an object with the following properties:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiEndpoint` | `string` | **Required** | The Collector API endpoint URL where telemetry should be sent. |
| `serverInfo` | `object` | **Required** | Identity of the server (`serverId`, `serverName`, `environment`, `version`). |
| `collectInterval` | `number` | `30000` | Milliseconds between background batch transmissions (default 30s). |
| `debug` | `boolean` | `false` | Enable verbose console debug logging for tracking anomalies. |
| `enabledFeatures` | `object` | `all enabled` | Feature toggles (`authenticationMonitoring`, `apiRequestTracking`, `errorTracking`, `performanceMonitoring`, `securityEventDetection`, `rateLimitingMonitoring`). |
| `security` | `object` | `see below` | Deep security tuning (`enableBruteForceDetection`, `enableSQLInjectionDetection`, `enableXSSDetection`, `suspiciousIPTracking`, `maxFailedAttempts`, `bruteForceTimeWindow`). |
| `performance` | `object` | `see below` | Performance threshold mapping (`slowQueryThreshold: 1000`, `slowResponseThreshold: 2000`, `highMemoryThreshold: 80`). |

## 🤝 Contributing

We welcome community contributions to SentinelWeb!

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jayesh-bhai/SentinelWeb.git
   ```
2. **Setup Locally:**
   ```bash
   cd SentinelWeb/agents/backend-agent
   npm install
   ```
3. **Run the local testing demo:**
   ```bash
   npm run demo # Starts the local testing playground with vulnerable endpoints
   ```
4. **Submit a Pull Request:** 
   Open a PR on our [GitHub Repository](https://github.com/jayesh-bhai/SentinelWeb). If you find a security flaw or bug, please open an Issue first!

## 📄 License
This project is licensed under the [MIT License](LICENSE).