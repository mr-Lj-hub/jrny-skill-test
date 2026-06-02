# 🛡️ TaskFlow — Production-Hardened Architecture & CI/CD Pipeline

TaskFlow is a production-grade project management REST API paired with a lightweight browser frontend. Originally delivered as an insecure starter repository, this codebase has undergone a complete architectural overhaul. It has been re-engineered following defense-in-depth security methodologies, modern supply-chain validation patterns, and multi-stage container isolation rules.

This document serves as an exhaustive technical handoff for the engineering team detailing the vulnerabilities eliminated, the DevOps orchestration layer, and the automated delivery pipeline.

---

## 📊 1. Summary of Issues Found & Remediations Applied

Following a baseline security audit, all 14 identified architectural and data-layer defects were systematically resolved across the codebase:

| Finding | Component | Severity | Defect (CWE) | Remediation Applied & Technical Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **#1** | `src/routes/auth.js` | 🔴 Critical | SQL Injection (CWE-89) | **Fix:** Replaced string-concatenated login queries with highly isolated parameterized array inputs (`$1, $2`).<br>**Reasoning:** This completely separates executable SQL database command strings from untrusted user payloads, mitigating authentication bypass attacks. |
| **#2** | `src/routes/tasks.js` | 🔴 Critical | SQL Injection (CWE-89) | **Fix:** Enforced strict integer parsing via `parseInt(req.params.id, 10)` combined with a parameterized delete query array.<br>**Reasoning:** Eliminates dynamic string breaks, halting horizontal privilege exploits designed to wipe records belonging to other tenants. |
| **#3** | `src/routes/auth.js` | 🔴 Critical | Plaintext Storage (CWE-256) | **Fix:** Integrated asynchronous cryptographically secure `bcryptjs` hashing with a workload computation factor of 12 salt rounds.<br>**Reasoning:** Converts raw passwords into cryptographically strong hashes; if the database is leaked, user credential values remain unreadable. |
| **#4** | `src/config.js` | 🟠 High | Hardcoded Secrets (CWE-798) | **Fix:** Shifted secrets out into `.env` configurations managed via `dotenv`, implementing an instant fail-fast application abort if vital keys are missing.<br>**Reasoning:** Ensures structural signature keys and database passwords are never permanently committed into Git version logs. |
| **#5** | `src/app.js` | 🟠 High | Edge Exposure | **Fix:** Injected HTTP defense headers via `helmet` and structured strict rate-limiting layers (`express-rate-limit`) on sensitive authentication routes.<br>**Reasoning:** Shields the API boundary from dictionary-style brute-force attacks and cross-site scripts. |
| **#6** | `src/app.js` | 🟠 High | Stack Trace Leakage (CWE-209) | **Fix:** Configured a production-sanitized global error responder middleware layer that overrides default Express behaviors.<br>**Reasoning:** Suppresses internal system telemetry, path structures, and module frameworks from exposing to client environments. |
| **#7** | `public/app.js` | 🟠 High | Stored XSS (CWE-79) | **Fix:** Exchanged unsafe client-side DOM mutations (`innerHTML`) for explicit string character escaping utilizing browser-native `.textContent` properties.<br>**Reasoning:** Forces the user interface to interpret raw script payloads purely as display literals, eliminating script execution within client browsers. |
| **#8** | App-wide | 🟡 Medium | Unhandled Promise Rejections | **Fix:** Enclosed all asynchronous route workflows inside resilient `try/catch` frames that safely delegate exceptions downward to `next(err)`.<br>**Reasoning:** Guarantees database errors or network pool failures are caught elegantly instead of throwing uncaught exceptions that crash the active Node runtime. |
| **#9** | `src/middleware/validate.js` | 🟡 Medium | Lacking Schema Validation | **Fix:** Structured validation checkpoint arrays right at route entry gates using schemas from `express-validator`.<br>**Reasoning:** Shields database operations from parsing distorted or malicious requests by rejecting invalid body footprints early. |
| **#10**| `src/app.js` | 🟡 Medium | Wildcard CORS Layouts | **Fix:** Closed wide open access parameters down to explicit origin checks driven by configurable environmental variables.<br>**Reasoning:** Blocks unauthorized third-party cross-origin scripts from harvesting or scraping sensitive server payloads. |
| **#11**| App-wide | 🟡 Medium | PII Logs Exposure | **Fix:** Stripped cleartext user credentials and sensitive tracking data away from terminal logging statements (`console.log`).<br>**Reasoning:** Assures compliance hygiene by keeping cleartext passwords entirely out of server telemetry logging buckets. |
| **#12**| `package.json` | 🔵 Low | Broken Start Script | **Fix:** Remapped target package script commands to launch directly from the authentic engine entry path (`node src/app.js`).<br>**Reasoning:** Aligns local initialization scripts with actual repository structural layouts to ensure reliable boots. |
| **#13**| `.gitignore` | 🔵 Low | Tracking Leakages | **Fix:** Broadened global directory exclusions to protect local `.env` setups, module caches, and hidden system trackers.<br>**Reasoning:** Mitigates risk of engineers accidentally publishing localized environment parameters or local caches online. |
| **#14**| App-wide | 🔵 Low | Dead & Broken Assets | **Fix:** Purged inactive functions and resolved a critical runtime dependency crash by fixing the missing `morgan` library context.<br>**Reasoning:** Shrinks package footprint, removes code complexity noise, and stabilizes initial application initialization pipelines. |

---

## 🔒 2. Key Security Improvements & Why They Matter

1. **Isolation of Instructions from Data Payloads (CWE-89):** Parameterized arrays translate user strings strictly into literal text parameters rather than executable logic. This completely neutralizes database injection attacks, locking data access inside strict tenant boundaries.
2. **Cryptographic One-Way Hashing Matrix (CWE-256):** Plaintext credentials are computationally impossible to extract under a `bcryptjs` matrix with a salt cost factor of 12. It ensures data theft from a database node does not result in systemic identity compromises.
3. **Least-Privilege Process Modeling:** Running Node via an alpine image wrapper drops root execution rights down to `USER node`. This prevents attackers from executing operating system system hooks or launching container-breakout routines against the host platform if a dependency exploit is discovered.
4. **Client Render Hardening (CWE-79):** Eliminating `innerHTML` removes the engine's capability to process client-side HTML tags. Text nodes render cleanly as string literals, protecting users against session hijacking through malicious stored scripts.

---

## 🐳 3. How to Run the Application Locally Using Docker Compose

The platform leverages **Docker Compose** to handle all runtime compilation and container isolation, eliminating the need to manually install Node or PostgreSQL dependencies on the local host machine.

### 1. Environment Configuration Setup
Create a file named `.env` inside your project's root folder and append these production-grade parameters:
```env
PORT=3000
DATABASE_URL=postgresql://taskflow_user:changeme_in_production@db:5432/taskflow
JWT_SECRET=production_ultra_secure_long_random_signing_key_2026
JWT_EXPIRES_IN=24h
ALLOWED_ORIGINS=http://localhost:3000

```

### 2. Orchestration Launch Execution

Open your terminal inside the project root and execute the automated boot cycle:

```bash
# Build the multi-stage images and start the services in detached background mode
docker compose up --build -d

# Verify operational status and database health check metrics
docker compose ps

```

Once healthy, the client dashboard layer and hardened API router instantly map online at `http://localhost:3000`.

### 3. Container Architectural Highlights

* **Multi-Stage Build Architecture:** Configures separate `builder` and `production` targets. Heavy developer compilers and package caches stay completely behind, dropping the runtime deployment image down to a minimal ~50MB footprint.
* **Signal Orchestration Protection:** Incorporates `tini` as `PID 1` inside the alpine runtime layer. This intercepts system execution events (`SIGTERM`, `SIGINT`), allowing clean shutdowns that prevent row mutations or database pool corruption.
* **Closed Boot Order Validation:** The PostgreSQL instance utilizes a recursive `pg_isready` verification tool. The Node application container uses a dependency block condition (`condition: service_healthy`) to hold its initialization until the database socket pool is completely listening.

---

## 🚀 4. How the CI/CD Pipeline Works and What Each Step Does

The continuous integration architecture is configured under `.github/workflows/ci.yml`. It forces all prospective commits to pass a strict automated verification gate prior to branch integration:

```
Push / Pull Request to Main/Master
               │
               ▼
┌─────────────────────────────────────────┐
│     Job 1: Build & Security Audit       │
├─────────────────────────────────────────┤
│  ✓ Checkout code repository files       │
│  ✓ Configure Node.js 20 Environment     │
│  ✓ Package Clean Install (npm ci)       │
│  ✓ Dependency Supply-Chain Audit Check  │
│  ✓ Core Code Execution Verification     │
└──────────────────┬──────────────────────┘
                   │ (On Success)
                   ▼
┌─────────────────────────────────────────┐
│   Job 2: Docker Blueprint Verification  │
├─────────────────────────────────────────┤
│  ✓ Initialize Docker Buildx Engine      │
│  ✓ Compile Multi-Stage Dockerfile Layer │
│  ✓ Cache optimization pass (type=gha)   │
│  ✓ Verify Compilation (push: false)     │
└─────────────────────────────────────────┘

```

### In-Depth Pipeline Step Breakdown

* **Least-Privilege Token Permissions (`contents: read`):** Restricts the execution context token to read-only capabilities, protecting against pipeline injection attacks designed to overwrite repository source codes.
* **Reproducible Dependency Lock checks (`npm ci`):** Bypasses standard package evaluations to freeze exact version dependencies from `package-lock.json`. The step triggers an immediate fail if any dependencies drift from locked specifications.
* **Supply-Chain Security Enforcement (`npm audit --audit-level=high`):** Analyzes the full nested package tree for known vulnerabilities. If any package displays high or critical severity flaws, the step fails the run and blocks the pull request.
* **Stateless Automation Checking (`npm test`):** Executes core application validation checks inside an isolated container space to protect against regression defects.
* **Docker Image Structural Validation:** Uses the official `docker/build-push-action@v6` running `push: false` to ensure changes to code logic haven't broken the Docker compiler layout. It leverages GitHub Action caching (`cache-from: type=gha`) to ensure build times stay under a minute.

---

## 📝 5. Assumptions & Trade-offs Made

* **Legacy User Profile Invalidation:** Transitioning from plaintext strings to a `bcryptjs` hashing matrix means that any old placeholder test accounts created using unencrypted strings are deprecated. This was a deliberate architectural decision; preserving compatibility for cleartext storage profiles poses a massive security risk. Fresh verification lines must be registered via the `/api/auth/register` endpoint.
* **Validation Baseline Constraints:** Set a minimum 8-character string restraint across password registration routes to enforce essential credential safety hygiene, keeping local integration verification simple and efficient.
* **Stateless Docker Database Engine Mapping:** Mounts the internal Postgres database schema directly using file arrays (`/docker-entrypoint-initdb.d/`). This creates an elegant "boot-and-seed" strategy for rapid local verification, assuming the structural setup runs exclusively when the base storage volume is empty.
