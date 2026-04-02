# 🛡️ SentinelWeb Frontend Agent

[![npm version](https://img.shields.io/npm/v/@sentinelweb/frontend-agent.svg)](https://www.npmjs.com/package/@sentinelweb/frontend-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> A lightweight, privacy-first JavaScript SDK for monitoring DOM anomalies, user behaviors, and client-side security threats in real-time.

---

## 🚀 Installation

```bash
npm install @sentinelweb/frontend-agent
```

## ⚡ Quickstart

The absolute minimum code required to integrate the agent into your frontend React, Vue, or Vanilla setup.

```javascript
import { SentinelWebFrontend } from '@sentinelweb/frontend-agent';

const agent = new SentinelWebFrontend({
  apiEndpoint: 'https://your-api.com/collect/frontend'
});

// Starts listening to DOM metrics, security events, and performance vitals silently
agent.start();
```

*For direct HTML script-tag integration:*
```html
<script>
  window.SentinelWebConfig = { apiEndpoint: 'https://your-api.com/collect/frontend' };
  window.SentinelWebAutoStart = true;
</script>
<script src="https://unpkg.com/@sentinelweb/frontend-agent/dist/index.umd.js"></script>
```

## ⚙️ Configuration API

When instantiating `SentinelWebFrontend(config)`, pass an object with the following properties:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiEndpoint` | `string` | **Required** | The Collector API endpoint URL where telemetry should be sent. |
| `collectInterval` | `number` | `5000` | Milliseconds between background batch transmissions. |
| `debug` | `boolean` | `false` | Enable local console debug logging. |
| `enabledFeatures` | `object` | `all enabled` | Feature toggles (`domEvents`, `performanceMonitoring`, `userBehavior`, `securityEvents`, `errorTracking`, `networkMonitoring`). |
| `privacy.maskSensitiveData` | `boolean` | `true` | Automatically scramble sensitive input values (like passwords/SSNs) locally. |
| `privacy.excludeSelectors` | `Array` | `['input[type="password"]']` | HTML/CSS selectors that the SDK should completely ignore tracking. |
| `privacy.anonymizeIPs` | `boolean` | `true` | Hash and prevent raw IP address persistence natively. |
| `privacy.respectDoNotTrack`| `boolean` | `true` | Turn off all telemetry if the browser sets the DNT header. |

## 🤝 Contributing

We welcome community contributions to SentinelWeb!

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jayesh-bhai/SentinelWeb.git
   ```
2. **Setup Locally:**
   ```bash
   cd SentinelWeb/agents/frontend-agent
   npm install
   ```
3. **Build the Agent Bundle:**
   ```bash
   npm run build
   ```
4. **Submit a Pull Request:** 
   Open a PR on our [GitHub Repository](https://github.com/jayesh-bhai/SentinelWeb). If you find a security flaw or bug, please open an Issue first!

## 📄 License
This project is licensed under the [MIT License](LICENSE).