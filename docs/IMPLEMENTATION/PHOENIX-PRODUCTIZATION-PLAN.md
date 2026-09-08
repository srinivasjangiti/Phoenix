# Phoenix Productization Plan

> **Created:** 2026-09-08  
> **Depends on:** [PHOENIX-PRODUCTIZATION-AUDIT.md](./PHOENIX-PRODUCTIZATION-AUDIT.md)  
> **Status:** APPROVED & ACTIVE — Phase 1 authorized.

---

## Goal

Convert Phoenix from a developer-operated local system into professional desktop software that a completely non-technical person (including a 15-year-old with no technical background) can install, understand, configure, and use without any developer knowledge.

---

## Approved Architectural Decisions

1. **Desktop Shell: Tauri 2 (Retained & Extended)**
   - Phoenix will use `Phoenix.exe` (Tauri 2) as the unified desktop supervisor.
   - The shell spawns and manages a portable Node.js backend child process.
   - System tray, global shortcuts, and screen capture already work natively in the Tauri shell.
   - The supervisor is a full application service manager with discrete lifecycle states, not an unmonitored script.

2. **Ollama Integration: Honest Guided Installation & UX**
   - Phoenix will detect Ollama, verify disk space (>=10GB recommended) and system RAM (>=4GB free).
   - If missing, Phoenix presents an honest, transparent guided setup:
     `Preparing local AI` → `Downloading AI engine` → `Installing` → `Checking` → `Downloading model` → `Ready`.
   - Never pretend an external installation completed if it failed.
   - Detect existing installations, handle admin elevation, handle offline machines, and provide graceful fallback to cloud or keyword-only mode.

3. **Release & Code Signing Requirement**
   - Code signing is a first-class release requirement for official distribution, not an in-app tutorial on how to bypass SmartScreen.
   - Unsigned development builds will be documented separately for developers only; production installers will be signed.

4. **Memory Storage: Transparent & Local**
   - Phoenix stores data 100% locally in an encrypted database (`phoenix.db`).
   - UI displays:
     ```text
     Memory
     ● This computer
       Your Phoenix memory is stored on this computer.

     Cloud sync
       Coming soon
     ```
   - No fake selectable cloud options or misleading UI states.

5. **First-Class Backup & Restore System**
   - A dedicated Backup & Restore feature in `Settings → Memory → Backup & Restore`.
   - Includes one-click encrypted archive export/import (database, keys, user preferences), timestamp tracking ("Last backup: Today, 14:32"), and clear explanation of what is preserved.

6. **Centralized Readiness State Machine**
   - All components report into a unified readiness manager:
     - `Phoenix Core`
     - `Memory`
     - `Database`
     - `Permissions`
     - `Local AI`
     - `Selected AI Model`
     - `Cloud AI`
     - `Devices`
   - Allowed states: `READY`, `CHECKING`, `INSTALLING`, `NEEDS_ACTION`, `UNAVAILABLE`, `DISABLED`, `ERROR`.

---

## Implementation Sequence (Approved 10-Phase Roadmap)

```text
1. Unified Desktop Runtime (Supervisor & Service Manager)
        ↓
2. First-Run / Readiness System (Onboarding Wizard & State Machine)
        ↓
3. AI / Ollama Manager (Detection, Guidance, SSE Model Pull)
        ↓
4. Error & Recovery (Human-Readable Error Translation Layer)
        ↓
5. Help Center (Searchable In-App Plain-English Knowledge)
        ↓
6. Settings / Privacy / Permissions (Consumer-Grade UI)
        ↓
7. Packaging (NSIS Installer, Portable Node.js, Shortcut Generation)
        ↓
8. Security Hardening (Localhost Lockdown, CSP, IPC Validation)
        ↓
9. Backup / Data Flow / Privacy Validation (Backup & Restore Engine)
        ↓
10. Updates + Release Validation (Update Checker & Acceptance Test)
```

---

### Phase 1: Unified Desktop Runtime (Supervisor & Service Manager)

Make Phoenix launch as a single desktop application that manages the backend lifecycle.

#### Supervisor Lifecycle States
```text
STARTING → STARTING_BACKEND → CHECKING → READY
Failures: BACKEND_START_FAILED | BACKEND_CRASHED | BACKEND_UNRESPONSIVE | DATABASE_UNAVAILABLE
```

#### [NEW] `service/tauri/src-tauri/src/backend.rs`
- Rust supervisor managing the portable Node.js process.
- Resolves paths relative to the executable (`resource_dir`).
- Checks port availability (7777 default, fallback discovery).
- Spawns `node phoenix.js start --supervised`.
- Monitors process health, captures stdout/stderr to rolling diagnostic log.
- Performs HTTP health polling (`GET http://127.0.0.1:7777/health`) before transitioning to `READY`.
- Manages graceful shutdown: sends `SIGTERM`, waits up to 5s, issues `SIGKILL` only if unresponsive.
- Emits real-time supervisor state events to the frontend webview for branded splash rendering ("Phoenix is starting...").

#### [MODIFY] `service/tauri/src-tauri/src/lib.rs`
- Initialize `backend` supervisor on `app.setup()`.
- Load splash screen / loading view while supervisor is in `STARTING` / `STARTING_BACKEND` / `CHECKING`.
- Prevent window white-flash before backend is ready.
- Handle application exit event (`RunEvent::ExitRequested`) by cleanly stopping backend before quitting.
- Remove hardcoded developer absolute paths.

#### [MODIFY] `service/src/super-carrier.js` & `service/src/server.js`
- Listen for shutdown signals (`SIGTERM`, `SIGINT`).
- On shutdown: cleanly close database connection (`db.close()`), stop active sensor watchers (screen, webcam, activity), terminate Carrier child process, exit code 0.
- Add `--supervised` flag support to suppress extraneous console noise and optimize for supervisor IPC.

---

### Phase 2: First-Run & Readiness System

#### Centralized Readiness State Machine (`service/src/readiness.js`)
- Exposes `GET /api/v1/readiness`:
  Returns structured state for all subsystems with one of `READY | CHECKING | INSTALLING | NEEDS_ACTION | UNAVAILABLE | DISABLED | ERROR`.
- Tracks `first_run_complete` flag in settings table.

#### First-Run Onboarding Wizard (`service/dashboard/src/routes/setup/+page.svelte`)
1. **Welcome** — "Welcome to Phoenix" + what Phoenix can do.
2. **How Phoenix Works** — Visual explanation of memory, senses, and personal AI.
3. **AI Choice** — Honest selection between "On this computer" (recommended, via Ollama) and "Cloud AI" (enter API key, or skip).
4. **Memory Explanation** — Plain-English explanation that notes stay on this PC. Shows "Cloud sync: Coming soon".
5. **Permissions & Senses** — Webcam, screen, and activity tracking explained in WHAT / WHY / EXAMPLE / CONTROL format.
6. **Your Name** — Personalization prompt.
7. **Readiness Summary & First Step** — Quick system check verifying readiness, then transition into main app.

#### Route Guard
- If `first_run_complete` is false, automatically route any navigation to `/setup`.

---

### Phase 3: AI / Ollama Manager

#### [NEW] `service/src/ollama-manager.js`
- **Detection:** Checks PATH and standard Windows paths (`%LOCALAPPDATA%\Programs\Ollama\ollama.exe`).
- **Pre-flight Checks:** Verifies disk space (>=10GB free) and RAM (`os.freemem() >= 4GB`).
- **Guided Flow:** Provides structured steps and download trigger:
  `Preparing local AI` → `Downloading AI engine` → `Installing` → `Checking` → `Downloading model` → `Ready`.
- **Model Download Streaming:** Server-Sent Events (SSE) or WebSocket streaming for pull progress (`gemma4:e2b` and `qwen3-embedding:0.6b`).
- **Auto-Start & Restart:** Supervised start if installed; single restart attempt on mid-session drop.
- **Offline / Failure Resilience:** If Ollama cannot be installed or run, automatically switches embeddings to keyword-only mode and informs user cleanly.

---

### Phase 4: Human-Readable Error & Recovery System

#### [NEW] `service/src/error-humanizer.js`
- Intercepts technical errors and maps them to consumer-friendly cards:
  - `ECONNREFUSED 11434` → "Local AI engine is resting" + [Start Ollama] button.
  - `EADDRINUSE 7777` → "Port in use by another program" + [Retry on new port].
  - `SQLITE_BUSY` → "Database is busy saving notes" + [Retry].
  - Missing model → "AI Model not downloaded" + [Download now].
- Each error card has:
  - Human Title
  - Explanation in plain language
  - Primary Action Button (auto-fix)
  - Secondary Action Button (alternative)
  - Collapsible "Technical Details" (for diagnostics)

---

### Phase 5: In-App Help Center

#### [NEW] `service/dashboard/src/routes/help/+page.svelte`
- Built-in, searchable user guide based on `PHOENIX-EXPLAINED.md` and `PHOENIX-EXPLAINED-MINI.md`.
- Categorized into:
  - **Getting Started:** What is Phoenix, first steps, asking questions.
  - **Memory:** How memory works, searching memory, what is stored.
  - **AI Engines:** Local vs Cloud, changing models.
  - **Privacy:** Senses, permissions, what leaves your computer.
  - **Backup & Restore:** How to safeguard your data.
  - **Troubleshooting:** Resolving common issues with one click.

---

### Phase 6: Settings, Privacy & Permissions Redesign

#### [MODIFY] `service/dashboard/src/routes/settings/+page.svelte`
- Clean consumer tabs:
  - **Profile:** User name, display preferences.
  - **AI Setup:** Active provider, model selection with human names, local vs cloud.
  - **Memory & Storage:** Data location, Backup & Restore controls.
  - **Privacy & Senses:** Screen watching, activity tracking, webcam presence with clear WHAT/WHY/EXAMPLE.
  - **Devices:** Phone companion, smart home, remote computers.
  - **Advanced (Developer Mode toggle):** Ports, raw logs, PTY sessions, dev tools.

---

### Phase 7: Windows Packaging

#### Installer Architecture (`installer/phoenix-setup.nsi`)
- Pre-packages:
  - Compiled Tauri desktop executable (`Phoenix.exe`)
  - Portable Node.js runtime (`node.exe`)
  - Production service bundle (`service/` + production `node_modules`)
  - Compiled SvelteKit dashboard (`service/dashboard/build`)
- Creates:
  - Desktop shortcut: `Phoenix`
  - Start Menu shortcut: `Phoenix`
  - Clean uninstaller registered in Windows Settings / Add & Remove Programs.
- User-level install default (no admin required unless Windows Service mode requested).

#### Release Script (`service/scripts/build-release.js`)
- Single command building dashboard, Tauri release binary, production dependencies, and invoking NSIS compiler.

---

### Phase 8: Security Hardening

- **Binding Restriction:** Server binds strictly to `127.0.0.1` (loopback only) in production mode.
- **Tauri Security:** Strict Content Security Policy (CSP), disable external navigation in main webview, input validation on all Tauri IPC commands.
- **Key Safety:** Document and enforce user-level file permissions on `phoenix.key`.

---

### Phase 9: Backup, Restore & Data Validation

#### [NEW] `service/src/backup-manager.js`
- **Export Backup:** Creates an encrypted or password-protected zip/tar archive containing:
  - `phoenix.db` (SQLCipher encrypted database)
  - `phoenix.key` (database encryption key)
  - User settings & preferences
  - Metadata manifest (timestamp, version, fact count)
- **Import / Restore:**
  - Safely stops database connections.
  - Validates archive integrity.
  - Restores files to `%LOCALAPPDATA%\Phoenix\data\`.
  - Reboots database and verifies memory integrity.
- **UI Integration:** Prominent in Settings → Memory. Shows "Last backup: [Date/Time]".

#### [NEW] `docs/IMPLEMENTATION/PHOENIX-DATA-FLOW-AND-PRIVACY.md`
- Durable reference detailing data residency, local vs cloud transmission points, and verification methods.

---

### Phase 10: Updates & Release Validation

- **Update Checker:** `GET /api/v1/updates/check` against GitHub Releases API. Displays non-intrusive badge in Settings → About.
- **Zero-Technical-Knowledge Acceptance Test:** Full manual validation checklist on clean Windows environment.
- **Code Signing Integration:** Document certificate configuration and release signing pipeline in CI/release scripts.

---

## Verification Plan

### Automated Tests
```bash
# Supervisor & Service boot check
node service/phoenix.js start --test-boot

# Readiness state machine test
node service/run-tests.cjs --filter=readiness

# Backup and restore verification
node service/run-tests.cjs --filter=backup

# Ollama manager pre-flight & detection
node service/run-tests.cjs --filter=ollama

# Error humanizer translations
node service/run-tests.cjs --filter=errors
```

### Zero-Technical-Knowledge Acceptance Criteria
1. Single executable installation via `Phoenix-Setup.exe`.
2. Launch from desktop shortcut opens branded "Phoenix is starting..." splash.
3. First-run onboarding loads automatically, guides user with zero technical jargon.
4. Memory stored locally; honest indication that cloud sync is coming soon.
5. Backup archive exports and restores with full data fidelity.
6. Clean exit leaves zero orphaned Node or child processes.
