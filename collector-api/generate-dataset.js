import { DetectionEngine } from './detection-engine/index.js';
import { DatasetLogger } from './detection-engine/DatasetLogger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Deterministic pseudo-random number generator
let seed = 12345;
function pseudoRandom() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

// Generate an integer between min and max deterministically
function deterministicInt(min, max) {
    return Math.floor(pseudoRandom() * (max - min + 1)) + min;
}

async function runSimulation() {
    console.log('🧪 Starting Deterministic Dataset Generation...');

    const engine = new DetectionEngine();
    await engine.initialize();

    engine.datasetMode = true;
    engine.datasetLogger = new DatasetLogger(path.join(__dirname, 'dataset.csv'));

    let currentTime = 1710000000000; // Base time (March 9, 2024 roughly)
    function getNextTime() {
        currentTime += 1000; // Monotonic 1-second increment
        return currentTime;
    }

    // Define normal templates
    function generateNormalEvent(time, idx) {
        const type = idx % 3;
        const ip = `10.0.0.${idx % 255}`;
        const sessionId = `sess_normal_${idx}`;

        if (type === 0) {
            return {
                "event_type": "auth_summary",
                "source": "backend",
                "timestamp": time,
                "session_id": sessionId,
                "ip": ip,
                "behavior": {
                    "failed_auth_attempts": deterministicInt(0, 2),
                    "successful_auth_attempts": 1
                }
            };
        } else if (type === 1) {
            return {
                "event_type": "http_request",
                "source": "frontend",
                "timestamp": time,
                "session_id": sessionId,
                "ip": ip,
                "request": {
                    "method": "GET",
                    "path": "/products",
                    "query_params": {
                        "category": ["electronics", "books", "clothing"][idx % 3]
                    }
                }
            };
        } else {
            return {
                "event_type": "user_activity",
                "source": "frontend",
                "timestamp": time,
                "session_id": sessionId,
                "ip": ip,
                "behavior": {
                    "interaction_rate": deterministicInt(10, 80),
                    "idle_time": deterministicInt(1000, 30000),
                    "request_count": deterministicInt(1, 40)
                }
            };
        }
    }

    // Define attack templates
    function generateAttackEvent(time, idx) {
        const type = idx % 3;
        // Concentrated IPs to trigger stateful velocity tracking rules
        const ip = `192.168.100.${idx % 10}`;
        const sessionId = `sess_attacker_${idx % 5}`;

        if (type === 0) {
            return {
                "event_type": "http_request",
                "source": "frontend",
                "timestamp": time,
                "session_id": sessionId,
                "ip": ip,
                "request": {
                    "method": "POST",
                    "path": "/login",
                    "body": {
                        "username": "admin",
                        "password": ["' OR 1=1 --", "' UNION SELECT * FROM users --", "admin' /*"][idx % 3]
                    }
                }
            };
        } else if (type === 1) {
            return {
                "event_type": "auth_summary",
                "source": "backend",
                "timestamp": time,
                "session_id": sessionId,
                "ip": ip,
                "behavior": {
                    "failed_auth_attempts": deterministicInt(5, 15),
                    "successful_auth_attempts": 0
                }
            };
        } else {
            return {
                "event_type": "api_usage",
                "source": "backend",
                "timestamp": time,
                "session_id": sessionId,
                "ip": ip,
                "behavior": {
                    "request_count": deterministicInt(100, 500),
                    "rate_violation_count": deterministicInt(5, 50)
                }
            };
        }
    }

    console.log('Generating 1,000 baseline events...');
    for (let i = 0; i < 1000; i++) {
        const event = generateNormalEvent(getNextTime(), i);
        await engine.processEvent(event, 0); // isAttack = 0
    }

    console.log('Generating 200 attack events...');
    for (let i = 0; i < 200; i++) {
        const event = generateAttackEvent(getNextTime(), i);
        await engine.processEvent(event, 1); // isAttack = 1
    }

    await engine.datasetLogger.close();
    await engine.persistence.close();
    console.log('✅ Dataset generated successfully! (dataset.csv)');
}

runSimulation().catch(console.error);
