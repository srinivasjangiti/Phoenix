# Phoenix Current Project State

> **Document Type:** Forensic Codebase Reconstruction & Verification Audit  
> **Date of Audit:** 2026-09-08  
> **Auditor Mode:** Autonomous Reconstruction (Read-Only / No Code Modification)  
> **Authority Level:** Physical Repository, Live Git Status, Compiled Executables, Active OS Processes, and Verified Runtime Endpoints.

---

## 1. Executive Summary

An exhaustive, non-destructive investigation of the Phoenix codebase was performed to reconstruct the exact status of the project, independent of historical conversations and stale documentation claims.

### Key Findings
1. **The Productization Roadmap Has Reached the Threshold of Phase 7 (Packaging):**
   - **Phases 1 through 6 are fully implemented in source code** and pass their respective automated acceptance test suites (`test-acceptance-phase3.js`, `test-acceptance-phase4.js`, `test-acceptance-phase5.js`, `test-acceptance-phase6.js`).
   - **Phase 7 (Windows Packaging) has NOT been implemented.** Pre-implementation planning and audit documents exist (`docs/IMPLEMENTATION/PHASE-7-PLAN.md` and `docs/IMPLEMENTATION/PHASE-7-AUDIT.md`), but no packaging scripts (`service/scripts/build-release.js`), test scripts (`service/test-acceptance-phase7.js`), or installer binaries (`Phoenix-Setup.exe`) exist.
2. **Massive Git Working Tree Discrepancy (Uncommitted Code):**
   - The git commit history consists of only **two commits**:
     - `8cc543d`: "inital commit v1"
     - `fc8b7e7`: "feat: productization phase 1 & 2 - desktop shell, readiness engine, and 7-step onboarding flow"
   - **All code for Phase 3 (Ollama Manager), Phase 4 (Error Humanizer), Phase 5 (Help Center), and Phase 6 (Settings & Privacy Redesign) is completely UNCOMMITTED.** It exists as 33 modified files and 14 untracked files in the working directory.
3. **Release Artifact Illusion ("the final exe file"):**
   - The root directory contains a folder named `the final exe file` with `Phoenix.exe` (18,442,752 bytes, built 2026-09-08 at 23:02:56).
   - This executable is **NOT a standalone consumer product**. It is an unbundled Tauri 2 wrapper that requires a pre-installed Node.js runtime (`C:\Program Files\nodejs\node.exe` or system `PATH`) and expects the uncompiled `service/` directory in its relative path hierarchy. There is no portable Node.js runtime or NSIS installer package anywhere in the repository.
4. **Live Runtime Verified Functionality:**
   - When launched, `Phoenix.exe` successfully initializes the Tauri desktop shell, starts its internal background supervisor, assigns the child Node.js process to a Windows Job Object (`kill-on-close: true`), boots `SuperCarrier` on port 7777, boots `Carrier` on port 17760, and boots `Craft` on port 17700.
   - Live HTTP requests confirm that `GET /health` returns HTTP 200 (`ok: true, craftHealthy: true`), `GET /api/v1/readiness` returns `READY`, and `POST /api/v1/chat` executes real on-device inference against local Ollama (`llama3.2:1b`) with zero cloud fallback.
5. **Critical Privacy & Security Discrepancies:**
   - **LAN Exposure:** `SuperCarrier`, `Carrier`, and `server.js` all bind to `0.0.0.0` (all network interfaces), exposing the API and dashboard across the local network without authentication.
   - **Unencrypted Photo Storage:** While `PrivacySensesCard.svelte` promises that *"Zero video, photos, or raw screen recordings are ever saved to disk"*, incoming phone photos uploaded via `/api/v1/capture` are written as raw, unencrypted JPEG files to `service/public/captures/` and served via static HTTP. Furthermore, facial recognition thumbnails are written to `%LOCALAPPDATA%\Phoenix\data\identity-thumbs\cluster_<id>.jpg`.
   - **Background Job Cloud Leaks:** While interactive chat strictly respects local-only mode, autonomous background workers in `steward.js` (Augur, Intuition, Dream, Archivist, Scout, Orchestrator, Evolution Engine) remain hardcoded to `cerebras:qwen-3-235b` and fail on startup due to missing cloud API keys.

---

## 2. Repository State

### A. Git Working State
- **Active Branch:** `main` (synchronized with `origin/main` at commit `fc8b7e7`).
- **Commit History:**
  - `fc8b7e7` (HEAD -> main, origin/main) *feat: productization phase 1 & 2 - desktop shell, readiness engine, and 7-step onboarding flow*
  - `8cc543d` *inital commit v1*
- **Modified Tracked Files (33 files):**
  - Dashboard Core: `service/dashboard/src/lib/api.js`, `service/dashboard/src/routes/+layout.svelte`, `service/dashboard/src/routes/comms/+page.svelte`, `service/dashboard/src/routes/settings/+page.svelte`, `service/dashboard/src/routes/setup/+page.svelte`
  - Backend Engine: `service/src/db.js`, `service/src/llm-fallback.js`, `service/src/readiness.js`, `service/src/router.js`, `service/src/routes/api.js`, `service/src/server.js`
  - Tauri Desktop Shell: `service/tauri/src-tauri/src/backend.rs`, `service/tauri/src-tauri/src/lib.rs`
  - Static Pre-Compiled Dashboard: `service/public/v2/_app/version.json` and 20 `.html` views (`settings.html`, `setup.html`, `index.html`, etc.)
- **Untracked Core Files (14 files):**
  - `service/src/ollama-manager.js` (Phase 3 Ollama lifecycle manager)
  - `service/src/models-catalog.js` (Phase 3 curated models catalog)
  - `service/src/error-humanizer.js` (Phase 4 error translation engine)
  - `service/src/help-catalog.js` (Phase 5 in-app help catalog bridge)
  - `service/public/v2/help.html` + immutable chunks (Phase 5 compiled help center)
  - `service/src/__tests__/ollama-manager.test.js`
  - `service/src/__tests__/error-humanizer.test.js`
  - `service/src/__tests__/help-catalog.test.js`
  - `service/src/__tests__/settings-consumer.test.js`
  - Acceptance Suites: `service/test-acceptance-phase3.js`, `service/test-acceptance-phase4.js`, `service/test-acceptance-phase5.js`, `service/test-acceptance-phase6.js`, `service/test-live-chat.js`

### B. Workspace Directory Map
- `android/` — Legacy Android companion app repository (contains Android Studio Gradle project and `assembleDebug` scripts).
- `browser-extension/` — Chrome extension for browser context extraction.
- `docs/` — Primary architectural documentation and `docs/IMPLEMENTATION/` phase roadmap audits and plans.
- `documentation/` — Legacy markdown guides (`PHOENIX-EXPLAINED.md`, `PHOENIX-EXPLAINED-MINI.md`).
- `hub/` — Multi-device coordination server codebase.
- `installer/` — Legacy installation scripts (`install.ps1`, `install.sh`, `phoenix-setup.nsi`, `INSTALL-REQUIREMENTS.html`).
- `phoenix-client/` — Client agent codebase for secondary devices.
- `service/` — Core production codebase:
  - `service/src/` — Backend server, database layer, AI dispatch, watchers, steward.
  - `service/dashboard/` — SvelteKit modern frontend source.
  - `service/public/v2/` — Static compiled SvelteKit production dashboard.
  - `service/tauri/` — Tauri 2 desktop shell source and Cargo workspace.
- `the final exe file/` — Contains a single built binary: `Phoenix.exe` (18.4 MB).

### C. Version Identifiers Across Repositories
- `service/package.json`: `"version": "0.4.0"`
- `service/tauri/src-tauri/tauri.conf.json`: `"version": "0.4.0"`
- `service/tauri/src-tauri/Cargo.toml`: `"version": "0.1.0"` (crate name: `phoenix-shell`)
- Git SHA: `fc8b7e7`

---

## 3. Phase Status Matrix

Evaluation against the approved 10-phase sequence defined in `docs/IMPLEMENTATION/PHOENIX-PRODUCTIZATION-PLAN.md`:

| Phase | Intended Scope | Claimed Status | Actual Evidence | Actual Status |
|---|---|---|---|---|
| **Phase 1: Unified Desktop Runtime** | Tauri supervisor, process lifecycle, Windows Job Object, port check, rolling diagnostics, health check polling, graceful shutdown. | COMPLETED & VERIFIED (commit `fc8b7e7`) | `backend.rs` implements supervisor with Job Object kill-on-close (`0x2000`). Verified live: launches node, passes health check, terminates with 0 orphan processes. | **VERIFIED** |
| **Phase 2: First-Run & Readiness System** | Centralized 8-component state machine (`readiness.js`), 7-step onboarding wizard (`setup/+page.svelte`), route guards, user setup completion persistence. | COMPLETED & VERIFIED (commit `fc8b7e7`) | `readiness.js` evaluates 8 subsystems truthfully. Onboarding wizard renders at `/v2/setup.html`. However, `+layout.svelte` lacks a route guard (bypassed on direct URL), and root index redirects to `/terminal` by default. | **PARTIALLY VERIFIED** |
| **Phase 3: AI / Ollama Manager** | Non-destructive external Ollama attachment, on-demand starting, guided installer trigger, model pull polling with cancellation, model verification, isolated `models-catalog.js`. | PROPOSED (`PHASE-3-PLAN.md`) / COMPLETE (`PHASE-5-PLAN.md`) | Fully implemented in `ollama-manager.js`, `models-catalog.js`, `server.js:2921`, `setup/+page.svelte`. `test-acceptance-phase3.js` passes 100%. Live chat verified via `ollama:llama3.2:1b`. Uncommitted. | **VERIFIED** |
| **Phase 4: Error & Recovery System** | Deterministic error translation into `HumanErrorCard` schemas, 1-click recovery actions, PII/secret sanitizer (`sanitizeDiagnostics`), Express middleware. | PROPOSED (`PHASE-4-PLAN.md`) / COMPLETE (`PHASE-5-PLAN.md`) | Fully implemented in `error-humanizer.js`, wired to `server.js:6790` middleware, tested in `test-acceptance-phase4.js` (100% pass). Uncommitted. | **VERIFIED** |
| **Phase 5: In-App Help Center** | 100% offline, client-side searchable help center in dashboard based on `PHOENIX-EXPLAINED.md`. 6 categories, 18 topics, sub-millisecond search. | PROPOSED (`PHASE-5-PLAN.md`) / COMPLETE (`PHASE-6-PLAN.md`) | Fully implemented in `help-catalog.js`, `public/v2/help.html` (9,633 bytes). Verified live at `http://127.0.0.1:7777/v2/help`. Tested in `test-acceptance-phase5.js` (100% pass). Uncommitted. | **VERIFIED** |
| **Phase 6: Settings, Privacy & Permissions** | 5 consumer tabs (Profile, AI Setup, Memory, Privacy, Devices) + Advanced tab with Developer Mode toggle. Reusable `PrivacySensesCard.svelte` in WHAT/WHY/EXAMPLE/CONTROL format. | PROPOSED (`PHASE-6-PLAN.md`) / COMPLETE (`PHASE-7-PLAN.md`) | Fully implemented in `settings/+page.svelte` (3,567 lines) and `PrivacySensesCard.svelte`. Verified live at `http://127.0.0.1:7777/v2/settings`. Tested in `test-acceptance-phase6.js` (100% pass). Uncommitted. | **VERIFIED** |
| **Phase 7: Windows Packaging** | Self-contained NSIS installer (`Phoenix-Setup.exe`), bundled portable Node.js LTS, production service staging, shortcuts, uninstaller registry, data preservation. | PROPOSED (`PHASE-7-PLAN.md`) | Audit and plan exist (`PHASE-7-AUDIT.md`, `PHASE-7-PLAN.md`). `build-release.js` does NOT exist. `test-acceptance-phase7.js` does NOT exist. `Phoenix-Setup.exe` does NOT exist. | **PLANNED** |
| **Phase 8: Security Hardening** | Localhost lockdown (`127.0.0.1` binding only), strict Content Security Policy, Tauri IPC validation, user-level file permissions on `phoenix.key`. | PLANNED (`PHOENIX-PRODUCTIZATION-PLAN.md`) | Not implemented. Server currently binds to `0.0.0.0` in `super-carrier.js`, `carrier.js`, and `server.js`. | **NOT STARTED** |
| **Phase 9: Backup & Data Flow Validation** | Dedicated `backup-manager.js`, encrypted archive export/import, Settings UI integration, timestamp tracking, privacy audit document. | PLANNED (`PHOENIX-PRODUCTIZATION-PLAN.md`) | Not implemented. `backup-manager.js` does not exist. | **NOT STARTED** |
| **Phase 10: Updates & Release Validation** | Auto-update checker, GitHub release polling, clean installer upgrade test, final consumer acceptance test. | PLANNED (`PHOENIX-PRODUCTIZATION-PLAN.md`) | Not implemented. | **NOT STARTED** |

---

## 4. Feature Reality Matrix

Detailed audit of core subsystems comparing code, user visibility, and operational facts:

| Capability | Component / File | Implemented? | Production Visible? | Verified Live? | Operational Facts & Limitations |
|---|---|---|---|---|---|
| **Tauri Desktop Shell** | `service/tauri/src-tauri/src/lib.rs` | YES | YES | YES | Creates maximized main window, sets up tray icon ("Show Dashboard", "Quit"), handles close request by cleanly stopping backend. |
| **Process Supervisor** | `service/tauri/src-tauri/src/backend.rs` | YES | YES | YES | Spawns child node process, attaches to Win32 Job Object with `KILL_ON_JOB_CLOSE`. Monitors HTTP `/health` every 400ms. Dispatches state to splash window. |
| **Splash Screen Controller** | `service/tauri/src/main.js` | YES | YES | YES | Listens for supervisor events. On `READY`, executes `window.location.replace("http://127.0.0.1:7777/v2/")`. Shows error screen with retry button if backend crashes. |
| **SuperCarrier Architecture** | `service/src/super-carrier.js` | YES | NO (internal) | YES | Owns port 7777. Spawns Carrier on internal port 17760. Buffers WebSocket frames during reboots. Binds to `0.0.0.0`. |
| **Carrier Architecture** | `service/src/carrier.js` | YES | NO (internal) | YES | Owns PTY sessions, WebSockets (`/ws/client`, `/ws/terminal`). Spawns primary Craft server on port 17700. Manages lifeboat rollback. |
| **Database Encryption** | `service/src/db.js` | YES | NO (internal) | YES | SQLCipher encryption via `better-sqlite3-multiple-ciphers` (AES-256-CBC). Database at `%LOCALAPPDATA%\Phoenix\data\phoenix.db`. Key at `phoenix.key`. |
| **Vector Embeddings** | `service/src/memory/embeddings.js` | PARTIAL | NO (internal) | NO | Expects `qwen3-embedding:0.6b` or `nomic-embed-text` in Ollama. Neither model is installed locally, so vector writes fail and silently fall back to FTS. |
| **Local AI Management** | `service/src/ollama-manager.js` | YES | YES | YES | Detects external Ollama on port 11434 (`EXTERNAL_UNMANAGED`). Preserves PID 15780. Triggers pull via Ollama `/api/pull` NDJSON stream with abort capability. |
| **Production Chat Inference** | `service/src/router.js` + `llm-fallback.js` | YES | YES | YES | Evaluates model chain. When `ai_choice === 'local'` and cloud fallback is disabled, strictly restricts dispatch to `ollama:llama3.2:1b`. Live chat verified in 9.0s. |
| **Background AI Jobs** | `service/src/steward.js` | BROKEN | NO (internal) | BROKEN | 7 autonomous jobs (Augur, Intuition, Dream, Archivist, Scout, Orchestrator, Evolution) are hardcoded to `cerebras:qwen-3-235b`. They crash/log errors on boot due to missing Cerebras keys. |
| **Onboarding Flow** | `service/dashboard/src/routes/setup/+page.svelte` | YES | YES | YES | 7-step wizard: Welcome, How it Works, AI Choice, Memory, Senses, Name, Readiness Check. Persists choices via `completeSetup()`. |
| **Layout Route Guard** | `service/dashboard/src/routes/+layout.svelte` | MISSING | YES | FAILED | `+layout.svelte` contains zero checks for `first_run_complete`. Only `+page.svelte` redirects unconfigured users. |
| **Default Post-Setup Route** | `service/dashboard/src/routes/+page.svelte` | FLAWED | YES | VERIFIED | When `first_run_complete` is true, `+page.svelte` unconditionally executes `goto('/terminal')`. Consumers are greeted by a developer CLI. |
| **In-App Help Center** | `service/dashboard/src/lib/help-catalog.js` | YES | YES | YES | 18 topics across 6 categories. Sub-millisecond client-side keyword search. Deep-links to recovery actions. Verified at `/v2/help.html`. |
| **Consumer Settings Panel** | `service/dashboard/src/routes/settings/+page.svelte` | YES | YES | YES | 5 consumer tabs (Profile, AI Setup, Memory, Privacy, Devices) + Advanced tab. Developer Mode toggle defaults to OFF and hides raw ports, PTY, and hex keys. |
| **Windows Packaging** | `installer/phoenix-setup.nsi` | LEGACY / MISSING | NO | FAILED | Only legacy PowerShell download wrapper exists. No standalone `Phoenix-Setup.exe`, no portable Node, no release build script. |

---

## 5. Documentation vs Code Mismatches

1. **Photo/Thumbnail Disk Persistence vs Marketing Copy:**
   - **UI Copy (`PrivacySensesCard.svelte:28`):**
     > *"Zero video, photos, or raw screen recordings are ever saved to disk or sent to the cloud."*
   - **Code Implementation (`service/src/routes/api.js:534-540`):**
     Phone photos sent to `POST /api/v1/capture` are saved as raw, unencrypted JPEG files to `service/public/captures/cap_<ts>.jpg`.
   - **Code Implementation (`service/src/routes/identity.js:352-354`):**
     Facial recognition thumbnails are saved as unencrypted files to `%LOCALAPPDATA%\Phoenix\data\identity-thumbs\cluster_<id>.jpg`.
2. **Localhost-Only Security Claim vs 0.0.0.0 Binding:**
   - **Documentation Claim (`PHOENIX-PRODUCTIZATION-PLAN.md` line 224, `ARCHITECTURE.md`):**
     Phoenix is described as a private desktop service bound to loopback.
   - **Code Implementation (`super-carrier.js:27`, `carrier.js:112`, `server.js:112`):**
     All three layers bind to `HOST = '0.0.0.0'`. This allows any device on the local network (LAN) to access the dashboard, query API endpoints, and view files in `public/captures/` without authentication.
3. **Local AI Exclusivity vs Steward Background Jobs:**
   - **Documentation Claim (`PHASE-3-OLLAMA-PLAN.md` line 29):**
     Phoenix commits to zero silent cloud fallback and absolute privacy when Local AI is selected.
   - **Code Implementation (`service/src/steward.js: lines 845, 849, etc.`):**
     While interactive chat via `askAIWithFallback` respects local-only mode, autonomous steward jobs (Augur, Intuition, Dream, Archivist, Scout, Orchestrator, Evolution Engine) ignore user settings and attempt cloud queries to `cerebras:qwen-3-235b` on startup.
4. **"The Final EXE File" vs Runtime Dependencies:**
   - **Documentation / Directory Claim:**
     The folder name `the final exe file` containing `Phoenix.exe` implies a finished, standalone release.
   - **Code Implementation (`service/tauri/src-tauri/src/backend.rs:589-596`):**
     `Phoenix.exe` immediately looks for `node/node.exe` or `C:\Program Files\nodejs\node.exe`. It does not bundle Node.js and will crash on a clean machine lacking developer prerequisites.
5. **Route Guard Claim vs Implementation:**
   - **Documentation Claim (`PHOENIX-PRODUCTIZATION-PLAN.md` line 141):**
     *"If `first_run_complete` is false, automatically route any navigation to `/setup`."*
   - **Code Implementation (`service/dashboard/src/routes/+layout.svelte`):**
     `+layout.svelte` contains no route guard. Only the root index (`+page.svelte`) redirects. Directly loading `http://127.0.0.1:7777/v2/settings` or `/sensors` bypasses onboarding completely.
6. **Post-Setup Landing Screen:**
   - **Documentation Intent:**
     A consumer-friendly assistant for non-technical users.
   - **Code Implementation (`service/dashboard/src/routes/+page.svelte:20`):**
     After onboarding completes, `+page.svelte` redirects to `/terminal` (a terminal shell rendering PTY output) rather than a conversation or assistant view.

---

## 6. Stubs, Placeholders & Suspicious Code

Forensic pattern scan across the codebase:

| File | Line Reference | Code Snippet / Context | Production Visible? | Severity |
|---|---|---|---|---|
| `service/src/routes/quality-log.js` | Line 275 & 309 | `// Stub for the advanced math fit_weights` / `note: 'TODO: least-squares regression'` | YES (API endpoint `/api/v1/quality-log/fit-weights`) | LOW |
| `service/src/mcp/quality-log-tools.js` | Line 131 | `'STUB. Will eventually load recent window of turns...'` | NO (MCP developer tool) | LOW |
| `service/src/routes/chat.js` | Line 330 & 784 | `// TODO: Send through Hub when client connected` / `// TODO: Relay to recipient via client websocket` | YES (Chat API routing) | MEDIUM |
| `service/src/memory/ollama-boot.js` | Line 44–47 | `// DISABLED: Ollama auto-start causes RAM exhaustion. Using keyword fallback only.` / Empty `ensureOllama()` stub. | NO (Superceded by `ollama-manager.js`) | LOW (Dead code) |
| `service/src/steward.js` | Line 213 | `startFn: null, stopFn: null` for Ollama service definition. | NO (Service health monitoring) | MEDIUM |
| `service/src/server.js` | Line 3145 | `// For now just return profile name without reading full yaml` | YES (`/api/v1/profile` endpoint) | LOW |
| `service/src/carrier.js` | Lines 787–788 (runtime log) | `[Phoenix Terminal] Failed to spawn PTY: Cannot create process, error code: 267` | YES (Terminal tab fails on start) | HIGH |
| `service/src/server.js` | Lines 804–818 (runtime log) | `[setup-plugins] WARN: Failed to install discord: undefined` (and 6 other plugins) | NO (Console noise on boot) | LOW |
| `service/src/memory/embeddings.js` | Line 100 (runtime log) | `[Phoenix Embeddings] write-path: Ollama probe failed — skipping writes until it recovers` | NO (Degrades search to FTS) | HIGH |

---

## 7. Build & Release State

### A. Compiled Binaries
- **Path 1:** `C:\Personal Coding\Projects\Phoenix\the final exe file\Phoenix.exe`
- **Path 2:** `C:\Personal Coding\Projects\Phoenix\service\tauri\src-tauri\target\release\phoenix-shell.exe`
- **File Metrics:**
  - File Size: `18,442,752 bytes` (17.58 MB)
  - Last Write Time: `2026-09-08 23:02:56`
  - SHA-256 Hash: `D65C3A1A0F9A636AC1304E98483C03F2B442C09B2B904C37D6C4E1A704D45331` (Both files are bit-for-bit identical).
- **Source Synchronization:**
  - Rust source files (`lib.rs` and `backend.rs`) were last modified at 15:32 and 15:40, prior to the 23:02 build timestamp.
  - `cargo check --manifest-path service/tauri/src-tauri/Cargo.toml` ran to completion with exit code 0 (2 non-fatal style warnings).
  - **Verdict:** `Phoenix.exe` in `the final exe file` is up to date with current Rust source code.

### B. Installer & Packaging Artifacts
- **`Phoenix-Setup.exe`:** **MISSING** (Does not exist on disk).
- **Portable Node.js:** **MISSING** (`node.exe` is not bundled anywhere in the project).
- **Release Staging Directory:** **MISSING** (`dist/staging` does not exist).
- **Master Release Script (`service/scripts/build-release.js`):** **MISSING**.

---

## 8. Runtime State

Observation of live execution (`Phoenix.exe` launched non-destructively in isolation):

1. **Process Tree & Startup:**
   - `Phoenix.exe` started successfully.
   - It spawned `node.exe` (`PID 14444`) running `service/phoenix.js start --supervised`.
   - Node process was successfully attached to the Tauri Win32 Job Object.
   - `SuperCarrier` bound to port `7777`.
   - `Carrier` spawned on internal port `17760` (`PID 6776`).
   - `Craft-1` spawned on internal port `17700`.
2. **Health & Readiness Endpoints:**
   - `GET http://127.0.0.1:7777/health` returned HTTP 200 within 2.5 seconds:
     ```json
     { "ok": true, "carrier": true, "superCarrier": true, "superCarrierPid": 14444, "carrierPid": 6776, "craftHealthy": true }
     ```
   - `GET http://127.0.0.1:7777/api/v1/readiness` returned HTTP 200:
     - `overall: "READY"`
     - `core: "READY"`
     - `database: "READY"` (Encrypted local SQLite operational, 52 tables)
     - `memory: "READY"` (Local memory vault ready, 0 items)
     - `local_ai: "READY"` (`Ollama active at http://127.0.0.1:11434 (2 models installed)`)
     - `selected_model: "READY"` (`Local model ready (llama3.2:1b)`, `verified: true`)
3. **Static Dashboard Serving:**
   - `GET http://127.0.0.1:7777/v2/` returned HTTP 200 (`text/html`).
   - `GET http://127.0.0.1:7777/v2/help` returned HTTP 200.
   - `GET http://127.0.0.1:7777/v2/settings` returned HTTP 200.
   - `GET http://127.0.0.1:7777/v2/setup` returned HTTP 200.
4. **Production AI Chat Path:**
   - `POST http://127.0.0.1:7777/api/v1/chat` with body `{"message": "Who are you in 5 words?", "source": "dashboard"}` executed through the full production router.
   - Responded with HTTP 200 in 9,054 ms.
   - `served_by: "ollama:llama3.2:1b"`, `is_local: true`.
   - **Verdict:** True local inference via Ollama is completely functional in the live running executable.
5. **Observed Runtime Errors:**
   - `[Phoenix Terminal] Failed to spawn PTY: Cannot create process, error code: 267`: Carrier attempted to spawn a PTY terminal session with an invalid directory path.
   - `[setup-plugins] WARN: Failed to install discord: undefined`: Plugin installer errors on boot.
   - `[Intuition] cerebras:qwen-3-235b failed: No Cerebras API key found`: Background jobs attempted cloud calls.
   - `[Phoenix Embeddings] write-path: Ollama probe failed`: Ollama lacks the vector model (`nomic-embed-text` or `qwen3-embedding:0.6b`).
6. **Process Termination:**
   - When Phoenix was signaled to exit, the Tauri supervisor initiated graceful shutdown, `SuperCarrier` closed listeners, Carrier shut down, and all child processes exited cleanly.
   - Zero orphan `node.exe` or `Phoenix.exe` processes remained in the operating system.

---

## 9. User Experience State

Audit against consumer expectations for a non-technical user (or a 15-year-old):

| UX Dimension | Consumer Verdict | Severity | Details |
|---|---|---|---|
| **Installation** | **UNUSABLE** | **BLOCKER** | There is no installer. The user must clone a git repository, install Node.js globally, run npm scripts, and run cargo to compile. |
| **First Launch** | **CONFUSING** | **HIGH** | The executable loads a splash screen, boots the backend, but upon subsequent launches drops the user into `/terminal` (a Linux-like command line prompt) instead of an assistant chat view. |
| **Command-Line Exposure** | **PARTIALLY SOLVED** | **MEDIUM** | Settings panel has hid raw ports and PTY settings behind a Developer Mode toggle. However, onboarding does not prevent navigation to developer tabs. |
| **Ollama Setup** | **GOOD** | **LOW** | Guided setup in `/setup` and `/settings` clearly shows download status, size estimates (~1.3 GB), and handles external Ollama gracefully without killing background instances. |
| **Error Handling** | **EXCELLENT** | **LOW** | Phase 4 humanized error cards convert technical errors (like `ECONNREFUSED 11434`) into plain English ("Local AI Engine is Sleeping") with 1-click wake buttons. |
| **Help Center** | **EXCELLENT** | **LOW** | 18 topics across 6 categories available offline with sub-millisecond search and actionable links. |
| **Terminology** | **IMPROVED** | **MEDIUM** | Senses are explained using WHAT / WHY / EXAMPLE / CONTROL. However, background terms like "Craft", "Carrier", "PTY", and "Org Staking" still appear in developer sub-tabs. |

---

## 10. Security & Privacy State

Evaluation of claims vs factual evidence:

### FACT
- **Database Encryption:** The database (`%LOCALAPPDATA%\Phoenix\data\phoenix.db`) is genuinely encrypted using SQLCipher AES-256-CBC. Without `phoenix.key`, the database cannot be read by standard SQLite tools.
- **Key Location:** The encryption key is stored in plaintext at `%LOCALAPPDATA%\Phoenix\data\phoenix.key`. Any application running under the user's Windows profile has read access to this key.
- **Strict Local Inference (Interactive):** When `ai_choice` is set to `local` and cloud fallback is disabled, prompts sent to `/api/v1/chat` are routed exclusively to `127.0.0.1:11434`. No prompt data leaves the machine.
- **Process Isolation:** Child processes are tied to Windows Job Objects, ensuring immediate process termination when Phoenix closes.

### CLAIM (Contradicted by Code)
- **Claim: "Zero photos or recordings are ever saved to disk":**  
  *Contradiction:* Incoming phone photos are written unencrypted to `service/public/captures/cap_<ts>.jpg`. Face thumbnails are written unencrypted to `%LOCALAPPDATA%\Phoenix\data\identity-thumbs\cluster_<id>.jpg`.
- **Claim: "Local-Only Desktop Application":**  
  *Contradiction:* The server binds to `0.0.0.0:7777` by default. Anyone connected to the same Wi-Fi or LAN can access the dashboard and APIs unless blocked by a third-party firewall.
- **Claim: "Complete Independence from Cloud When Local AI Selected":**  
  *Contradiction:* Background autonomous workers in `steward.js` (Augur, Intuition, Dream Cycle) ignore the local AI selection and continue attempting to send prompts to Cerebras Cloud.

### UNKNOWN
- **Tauri Windows WebView2 Data Retention:** Whether Microsoft Edge WebView2 stores cached user prompts or DOM snapshots in `%LOCALAPPDATA%\ai.phoenix.desktop\EBWebView` without encryption.

---

## 11. Known Blockers

1. **Packaging Blocker (Phase 7 Missing):** Phoenix cannot be distributed to any non-developer machine until `Phoenix-Setup.exe` is built with a bundled portable Node runtime.
2. **Uncommitted Source Code Blocker:** Over 2,300 lines of modified code and 14 critical modules across Phases 3–6 have never been committed to git, leaving the repository in a fragile working state.
3. **PTY Terminal Error 267:** Carrier fails to spawn the default PTY terminal session on Windows on boot (`Cannot create process, error code: 267`), generating repeated error logs.
4. **Missing Vector Embedding Model:** Ollama has no embedding model installed, preventing semantic vector search from operating and forcing the system into keyword-only FTS fallback.
5. **Steward Background Cloud Hardcoding:** Background workers attempt to connect to Cerebras regardless of user privacy choices.

---

## 12. Recommended Next Step

### Immediate Actions
1. **Commit Verified Baseline (Phases 1–6):**
   - Stage and commit the verified, passing Phase 3, 4, 5, and 6 implementation files, test suites, and dashboard assets to `main`.
2. **Pull Required Embedding Model:**
   - Execute an Ollama pull for `nomic-embed-text` (or `qwen3-embedding:0.6b`) to restore full semantic search and vector indexing capabilities.
3. **Proceed to Phase 7 Implementation (Windows Packaging):**
   - Implement `service/scripts/build-release.js` to stage production assets, acquire portable Node.js v22 LTS, compile `service/dashboard`, build `service/tauri`, and execute NSIS to generate `the final exe file\Phoenix-Setup.exe`.
   - Implement `service/test-acceptance-phase7.js` to verify package contents, shortcut generation, uninstaller registry entries, and user data preservation.

---

## 13. Evidence / Files Inspected

The conclusions in this document are based on direct inspection of the following files:

- **Git & Configuration:**
  - [`.git/config`](file:///c:/Personal%20Coding/Projects/Phoenix/.git/config)
  - [`service/package.json`](file:///c:/Personal%20Coding/Projects/Phoenix/service/package.json)
  - [`service/tauri/src-tauri/Cargo.toml`](file:///c:/Personal%20Coding/Projects/Phoenix/service/tauri/src-tauri/Cargo.toml)
  - [`service/tauri/src-tauri/tauri.conf.json`](file:///c:/Personal%20Coding/Projects/Phoenix/service/tauri/src-tauri/tauri.conf.json)
- **Desktop Shell & Supervisor:**
  - [`service/tauri/src-tauri/src/main.rs`](file:///c:/Personal%20Coding/Projects/Phoenix/service/tauri/src-tauri/src/main.rs)
  - [`service/tauri/src-tauri/src/lib.rs`](file:///c:/Personal%20Coding/Projects/Phoenix/service/tauri/src-tauri/src/lib.rs)
  - [`service/tauri/src-tauri/src/backend.rs`](file:///c:/Personal%20Coding/Projects/Phoenix/service/tauri/src-tauri/src/backend.rs)
  - [`service/tauri/src/main.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/tauri/src/main.js)
  - [`desktop.log`](file:///c:/Personal%20Coding/Projects/Phoenix/desktop.log)
- **Backend & Core Engine:**
  - [`service/phoenix.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/phoenix.js)
  - [`service/src/cli/start.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/src/cli/start.js)
  - [`service/src/super-carrier.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/src/super-carrier.js)
  - [`service/src/carrier.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/src/carrier.js)
  - [`service/src/server.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/src/server.js)
  - [`service/src/router.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/src/router.js)
  - [`service/src/readiness.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/src/readiness.js)
  - [`service/src/platform.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/src/platform.js)
  - [`service/src/db.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/src/db.js)
- **AI & Error Modules:**
  - [`service/src/ollama-manager.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/src/ollama-manager.js)
  - [`service/src/models-catalog.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/src/models-catalog.js)
  - [`service/src/error-humanizer.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/src/error-humanizer.js)
  - [`service/src/llm-fallback.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/src/llm-fallback.js)
  - [`service/src/steward.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/src/steward.js)
- **Dashboard & UI:**
  - [`service/dashboard/src/routes/+layout.svelte`](file:///c:/Personal%20Coding/Projects/Phoenix/service/dashboard/src/routes/+layout.svelte)
  - [`service/dashboard/src/routes/+page.svelte`](file:///c:/Personal%20Coding/Projects/Phoenix/service/dashboard/src/routes/+page.svelte)
  - [`service/dashboard/src/routes/setup/+page.svelte`](file:///c:/Personal%20Coding/Projects/Phoenix/service/dashboard/src/routes/setup/+page.svelte)
  - [`service/dashboard/src/routes/settings/+page.svelte`](file:///c:/Personal%20Coding/Projects/Phoenix/service/dashboard/src/routes/settings/+page.svelte)
  - [`service/dashboard/src/lib/components/PrivacySensesCard.svelte`](file:///c:/Personal%20Coding/Projects/Phoenix/service/dashboard/src/lib/components/PrivacySensesCard.svelte)
  - [`service/dashboard/src/lib/help-catalog.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/dashboard/src/lib/help-catalog.js)
- **Watchers & Identity:**
  - [`service/src/screen-watcher.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/src/screen-watcher.js)
  - [`service/src/webcam-watcher.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/src/webcam-watcher.js)
  - [`service/src/routes/identity.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/src/routes/identity.js)
  - [`service/src/routes/api.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/src/routes/api.js)
- **Acceptance Test Suites:**
  - [`service/test-acceptance-phase3.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/test-acceptance-phase3.js)
  - [`service/test-acceptance-phase4.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/test-acceptance-phase4.js)
  - [`service/test-acceptance-phase5.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/test-acceptance-phase5.js)
  - [`service/test-acceptance-phase6.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/test-acceptance-phase6.js)
  - [`service/test-live-chat.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/test-live-chat.js)
- **Roadmap & Audit Documents:**
  - [`docs/IMPLEMENTATION/PHOENIX-PRODUCTIZATION-PLAN.md`](file:///c:/Personal%20Coding/Projects/Phoenix/docs/IMPLEMENTATION/PHOENIX-PRODUCTIZATION-PLAN.md)
  - [`docs/IMPLEMENTATION/PHASE-3-OLLAMA-AUDIT.md`](file:///c:/Personal%20Coding/Projects/Phoenix/docs/IMPLEMENTATION/PHASE-3-OLLAMA-AUDIT.md)
  - [`docs/IMPLEMENTATION/PHASE-3-OLLAMA-PLAN.md`](file:///c:/Personal%20Coding/Projects/Phoenix/docs/IMPLEMENTATION/PHASE-3-OLLAMA-PLAN.md)
  - [`docs/IMPLEMENTATION/PHASE-4-AUDIT.md`](file:///c:/Personal%20Coding/Projects/Phoenix/docs/IMPLEMENTATION/PHASE-4-AUDIT.md)
  - [`docs/IMPLEMENTATION/PHASE-4-PLAN.md`](file:///c:/Personal%20Coding/Projects/Phoenix/docs/IMPLEMENTATION/PHASE-4-PLAN.md)
  - [`docs/IMPLEMENTATION/PHASE-5-AUDIT.md`](file:///c:/Personal%20Coding/Projects/Phoenix/docs/IMPLEMENTATION/PHASE-5-AUDIT.md)
  - [`docs/IMPLEMENTATION/PHASE-5-PLAN.md`](file:///c:/Personal%20Coding/Projects/Phoenix/docs/IMPLEMENTATION/PHASE-5-PLAN.md)
  - [`docs/IMPLEMENTATION/PHASE-6-AUDIT.md`](file:///c:/Personal%20Coding/Projects/Phoenix/docs/IMPLEMENTATION/PHASE-6-AUDIT.md)
  - [`docs/IMPLEMENTATION/PHASE-6-PLAN.md`](file:///c:/Personal%20Coding/Projects/Phoenix/docs/IMPLEMENTATION/PHASE-6-PLAN.md)
  - [`docs/IMPLEMENTATION/PHASE-7-AUDIT.md`](file:///c:/Personal%20Coding/Projects/Phoenix/docs/IMPLEMENTATION/PHASE-7-AUDIT.md)
  - [`docs/IMPLEMENTATION/PHASE-7-PLAN.md`](file:///c:/Personal%20Coding/Projects/Phoenix/docs/IMPLEMENTATION/PHASE-7-PLAN.md)
