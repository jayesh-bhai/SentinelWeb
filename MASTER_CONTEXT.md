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
Dashboard (React, Decoupled via /api/alerts & /api/stats)

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
- SRE Backend Hardening (OOM Protection, Queue Capping, IP/Event boundaries enforced)
- Resource-Oriented API Refactor (Headless Decoupling Completed)
- **Frontend Dashboard (React/Vite)**
- **Intelligent Alert Details (Explainability Engine)**
- **Behavior Analytics Module (Stateful time-series forensics)**
---

## 4. CURRENT STATUS
**Maturity Level**: Production-Ready Full-Stack Security System (SIEM).
The core Detection Engine, ML Integration, and Pipeline Validation are complete. The Frontend Dashboard has been completely overhauled to meet premium 2026-era SIEM standards. Critical detection reasoning (Explainable AI) and stateful Behavior Analytics are fully integrated and synced via a robust Context API layer, providing true evaluator-ready forensics.

---

## 5. CURRENT TASK (CRITICAL)
**Phase 3: Polish & Advanced Scaling**
With both backend and frontend locked down, the focus shifts to premium visual polish (micro-animations, deep UI/UX refinement), resolving edge-case data rendering, and establishing unified cross-service tracing (Correlation IDs).

---

## 6. KNOWN RISKS
- **Redis Centralization**: Node `Map()` arrays inside StateManager are currently bound to the single-thread, which prevents multi-server clustered horizontal scaling.
- **Cross-Service Traceability**: Missing unified correlate-ID for end-to-end trace mapping across the payload pipeline.

---

## 7. NEXT STEPS (STRICT EXECUTION ORDER)
1. **Correlation IDs**: Implement unified UUID tracing from Frontend Agent → Collector → Detection Engine → MongoDB/SQLite.
2. **Visual Polish**: Finalize edge-case UI rendering and micro-animations for peak aesthetic fidelity.
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
