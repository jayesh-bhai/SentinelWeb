# PROJECT: SentinelWeb

## 1. OBJECTIVE
AI-powered web security system for detecting attacks (SQLi, XSS, brute force, rate abuse) using hybrid rule-based + ML detection. 

**Vision & End-Goal**: Evolve from a standalone API into a **pluggable Security Intelligence System**. The primary tracking agents (Frontend & Backend) will be published as standard NPM packages, allowing any developer to instantly protect their web application. The final presentation will showcase a dummy "Sandbox Application", integrating these agents, and explicitly detecting/preventing 4-5 orchestrated live cyber attacks.

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
**Phase 3: Productization & Demonstration Sandbox**
With both backend and frontend locked down, the focus shifts entirely to end-to-end user demonstration. We must package the JS agents for NPM distribution, build a dummy "Sandbox Application" to act as a live victim, and refine the React dashboard UI to ensure it clearly tracks and mitigates 4-5 specific real-time attack profiles (SQLi, Brute Force, Rate Abuse, etc).

---

## 6. KNOWN RISKS
- **Redis Centralization**: Node `Map()` arrays inside StateManager are currently bound to the single-thread, which prevents multi-server clustered horizontal scaling.
- **Cross-Service Traceability**: Missing unified correlate-ID for end-to-end trace mapping across the payload pipeline.

---

## 7. NEXT STEPS (STRICT EXECUTION ORDER)
1. **Frontend Polish**: Ensure the current React Dashboard handles rendering of complex payloads and edge-cases perfectly before the final demo.
2. **Agent Packaging**: Refactor and prepare the frontend and backend collecting agents as distributable NPM packages.
3. **Sandbox Creation**: Develop a minimal, vulnerable dummy web application to install the NPM packages into.
4. **Attack Orchestration**: Write the payload scripts to execute 4-5 distinct attacks against the sandbox to prove live dashboard tracking.

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
