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
- Synthetic validation (engine-level)
- Full System Validation (real HTTP pipeline)

---

## 4. CURRENT STATUS
Detection Engine, ML Integration, and Pipeline Validation are **COMPLETE**.
Validated via:
- Real HTTP pipeline (Collector API via axios simulator)
- Synthetic events (direct `processEvent` calls)

---

## 5. CURRENT TASK (CRITICAL)
**Fix API Routing Bug & Begin Dashboard Development**

Fix:
- `server.js` overwrites `event_type` to `FRONTEND_EVENT` destroying canonical routing.

Build:
- Dashboard (React + Analytics)

---

## 6. KNOWN RISKS
- Collector → Engine `event_type` override destroys polymorphic event logic
- ML API may fail silently
- StateManager timing issues possible
- EventAdapter mismatch in real remote traffic

---

## 7. NEXT STEPS
1. Fix `server.js` canonical event override bug
2. Build Dashboard (React + analytics UI)
3. Add alert visualization + filtering

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
