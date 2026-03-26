# PROJECT: SentinelWeb

## 1. OBJECTIVE
AI-powered web security system for detecting attacks (SQLi, XSS, brute force, rate abuse) using hybrid rule-based + ML detection.

---

## 2. CURRENT ARCHITECTURE
Agents (Frontend + Backend)
↓
Collector API (Express)
↓
Detection Engine
  - EventAdapter
  - RuleEngine
  - StateManager
  - FeatureExtractor (12 features)
  - MLClient (FastAPI Isolation Forest)
  - ThreatScorer (rule + ML hybrid)
↓
SQLite (alerts)
↓
Dashboard (NOT BUILT)

---

## 3. COMPLETED COMPONENTS
- Event normalization (canonical schema)
- Rule-based detection (declarative engine)
- Stateful detection (IP + session tracking)
- Feature extraction (strict 12 features)
- Dataset generation (deterministic)
- Isolation Forest training
- FastAPI ML inference API
- MLClient integration
- Hybrid threat scoring
- Full System Validation (Real HTTP pipeline stabilized at 15k bursts)
- SRE Backend Hardening (OOM Protection, Queue Capping, IP/Event boundaries enforced) stabilized at 15k bursts)
- SRE Backend Hardening (OOM Protection, Queue Capping, IP/Event boundaries enforced)

---

## 4. CURRENT STATUS
**Maturity Level**: Production-Ready Backend Security API.
The core Detection Engine, ML Integration, and Pipeline Validation are complete. All critical architectural flaws (IP spoofing, SQL blocking, ML Temporal Blindness) have been neutralized. The Collector API scales performantly using Memory Queues and native HTTP `zod` parameter validations. 

---

## 5. CURRENT TASK (CRITICAL)
**Phase 2: Dashboard Visualization & Frontend Metrics**
With the backend fully locked down and mathematically trained, focus shifts strictly to creating the React Dashboard GUI interface.

---

## 6. KNOWN RISKS
- **Redis Centralization**: Node `Map()` arrays inside StateManager are currently bound to the single-thread, which prevents multi-server clustered horizontal scaling.
- **UI Absent**: Dashboard monitoring and visual administration interface does not exist yet.

---

## 7. NEXT STEPS (STRICT EXECUTION ORDER)
1. **Dashboard Setup**: Initialize React/Vite development framework and analytics GUI.
2. **Analytics Sync**: Expose SQLite Alert/Raw Event tables via Collector API logic for frontend rendering.
3. **Redis Architecture**: Convert StateManager Memory Arrays into Redis backend clustering (future optimization).

---

## 8. CONSTRAINTS
- ML cannot create threats (only adjust confidence)
- No hardcoded thresholds in rules
- Canonical schema must be enforced
- Feature schema must remain fixed

---

## 9. WHAT I NEED FROM AI
- Debugging system behavior (not theory)
- Identifying weak detection gaps
- Improving architecture decisions
- Guiding next implementation steps
