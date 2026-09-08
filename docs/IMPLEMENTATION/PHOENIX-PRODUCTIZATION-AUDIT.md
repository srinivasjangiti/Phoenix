# Phoenix Productization Audit

> **Created:** 2026-09-08  
> **Purpose:** Source of truth for converting Phoenix from a developer-operated local system into professional, zero-technical-knowledge desktop software.  
> **Status:** AUDIT COMPLETE — awaiting plan review.

---

## 1. Repository Overview

| Property | Value |
|----------|-------|
| **License** | AGPL-3.0 with Data Dividend Addendum |
| **Primary Language** | JavaScript (Node.js, ESM) |
| **Desktop Shell** | Tauri 2 (Rust + WebView2) |
| **Dashboard** | SvelteKit 5 (Svelte runes) |
| **Database** | SQLite + SQLCipher (AES-256-CBC) via `better-sqlite3-multiple-ciphers` |
| **Vector Search** | `sqlite-vec` (1024-dim embeddings) |
| **Full-Text Search** | FTS5 |
| **Local AI Runtime** | Ollama (Gemma 4 `e2b`, `qwen3-embedding:0.6b`) |
| **Cloud AI Providers** | Anthropic Claude, Cerebras, Groq, Gemini, OpenAI |
| **Mobile** | Android (Kotlin) |
| **Browser Extension** | Manifest V3 (Chrome) |
| **Remote Clients** | `phoenix-client/` (Node.js, per-machine agent) |
| **Windows Service** | WinSW via `daemon/phoenix.exe` + `node-windows` |
| **Current Version** | 0.4.0 |

---

## 2. Architecture (Current State)

### Process Hierarchy

```
PHOENIX.bat / Windows Service
      │
      └─→ node phoenix.js start
              │
              └─→ super-carrier.js (:7777, permanent)
                      │
                      └─→ carrier.js (:17760, restartable)
                              │
                              └─→ server.js (:17700+, hot-swappable "Craft")
```

Plus an **optional** Tauri 2 shell (`phoenix-shell.exe`) that opens a WebView2 window pointing at `http://127.0.0.1:7777/v2/`. The shell is launched separately by PHOENIX.bat after the server is confirmed healthy.

### Key Observation

**The Tauri shell is a thin WebView2 wrapper around the localhost web server.** It does NOT start or manage the Node.js backend. It assumes the server is already running on port 7777. This is the fundamental architecture gap: **there is no single executable that owns both the backend and the UI.**

---

## 3. Capability Inventory

### 3.1 Core Server (`service/src/`)

| Capability | Files | Status | User-Exposure Classification |
|------------|-------|--------|------------------------------|
| **Three-tier process hierarchy** (Super-Carrier → Carrier → Craft) | `super-carrier.js`, `carrier.js`, `server.js` | ✅ Working | Must remain hidden/internal |
| **Encrypted database** (SQLCipher AES-256-CBC) | `db.js`, `schema.sql` | ✅ Working | Safe to expose (as concept) |
| **Auto-key generation** (random 32-byte hex) | `db.js` L65-73 | ✅ Working | Must remain hidden |
| **FTS5 full-text search** | `db.js`, `memory-search.js` | ✅ Working | Safe to expose |
| **sqlite-vec semantic search** (1024-dim) | `db.js`, `memory/embeddings.js` | ✅ Working (when Ollama up) | Safe to expose |
| **Event capture & logging** | `events.js`, `server.js` | ✅ Working | Safe to expose |
| **Platform abstraction** (paths, shell) | `platform.js` | ✅ Working | Must remain hidden |
| **Data migration** (legacy pan → phoenix) | `db.js`, `platform.js` | ✅ Working | Must remain hidden |

### 3.2 AI Provider Integration

| Capability | Files | Status | Classification |
|------------|-------|--------|----------------|
| **LLM fallback chain** (voice: cloud→local; background: local→cloud) | `llm-fallback.js` | ✅ Working | Safe (as concept) |
| **Ollama local AI** | `llm.js`, `memory/ollama-boot.js` | ⚠️ Partially working — Ollama auto-start **disabled** (RAM protection). Boot module logs "DISABLED" and returns immediately. | Developer-only |
| **Claude adapter** (Anthropic API direct) | `llm-adapter-claude.js` | ✅ Working | Safe to expose |
| **Gemini adapter** | `llm-adapter-gemini.js` | ✅ Working | Safe to expose |
| **Cerebras / Groq / OpenAI** | `llm.js` dispatch | ✅ Working | Safe to expose |
| **Model registry** (DB `model_selections` table) | `db.js` | ✅ Working | Safe (via Settings UI) |
| **Vision analysis** (screen → Ollama) | `screen-watcher.js`, `llm.js` | ✅ Working (local-only) | Safe to expose |
| **Embedding generation** | `memory/embeddings.js` | ⚠️ Falls back to keyword-only when Ollama unavailable | Developer-only awareness |

### 3.3 Memory Subsystem

| Capability | Files | Status | Classification |
|------------|-------|--------|----------------|
| **Episodic memory** (timeline events) | `memory/episodic.js` | ✅ Working | Safe to expose |
| **Semantic memory** (fact extraction) | `memory/semantic.js` | ✅ Working | Safe to expose |
| **Procedural memory** (how-to skills) | `memory/procedural.js` | ✅ Working | Safe to expose |
| **Dream cycle** (nightly consolidation) | `dream.js` | ✅ Working | Safe to expose |
| **Memory search** (hybrid FTS + vector) | `memory-search.js` | ✅ Working | Safe to expose |
| **Context builder** | `memory/context-builder.js` | ✅ Working | Must remain hidden |
| **Wiki** | `memory/wiki.js` | ✅ Working | Safe to expose |

### 3.4 Senses & Awareness

| Capability | Files | Status | Classification |
|------------|-------|--------|----------------|
| **Screen watcher** (screenshot → vision AI → context) | `screen-watcher.js` | ✅ Working | Safe to expose (with consent) |
| **Activity tracker** (foreground window title) | `activity-tracker.js` | ✅ Working | Safe to expose (with consent) |
| **Webcam presence detection** (face detection) | `webcam-watcher.js`, `face-id.js`, `face-id-worker.js` | ✅ Working | Safe to expose (with consent) |
| **Capture consent system** | `capture-consent.js` | ✅ Working — toggleable per-feature, persisted, live start/stop | Safe to expose |

### 3.5 Communication & Devices

| Capability | Files | Status | Classification |
|------------|-------|--------|----------------|
| **Android companion app** | `android/` | ✅ Working | Safe to expose |
| **Home Assistant integration** | `home-assistant.js`, `routes/homeassistant.js` | ✅ Working | Safe to expose |
| **Phoenix Client** (remote PC agent) | `phoenix-client/` | ✅ Working | Safe to expose |
| **Client manager** (device registry, WS) | `client-manager.js` | ✅ Working | Must remain hidden |
| **Browser extension** (Manifest V3) | `browser-extension/` | ✅ Working | Safe to expose |
| **Email integration** | `email.js`, `routes/email.js` | ✅ Working | Safe to expose |

### 3.6 Intuition (Proactive AI)

| Capability | Files | Status | Classification |
|------------|-------|--------|----------------|
| **Intuition engine** | `intuition/index.js` (80KB) | ✅ Working | Must remain hidden |
| **Needs detection** | `intuition/needs.js` | ✅ Working | Must remain hidden |
| **Signal analysis** | `intuition/signals.js` | ✅ Working | Must remain hidden |
| **Action dispatch** | `intuition/action.js` | ✅ Working | Must remain hidden |
| **Reasoning** | `intuition/reasoning.js` | ✅ Working | Must remain hidden |
| **Nourishment tracking** | `intuition/nourishment.js` | ✅ Working | Safe (as feature) |

### 3.7 Security

| Capability | Files | Status | Classification |
|------------|-------|--------|----------------|
| **Secret handling** (env-first, DB fallback, response redaction) | `secrets.js` | ✅ Working | Must remain hidden |
| **Permission matrix** (power levels: child→owner) | `permissions.js` | ✅ Working | Partially expose (simplified) |
| **Differential privacy** | `privacy.js` | ✅ Working | Safe to expose (as concept) |
| **Capture consent** | `capture-consent.js` | ✅ Working | Safe to expose |
| **Anonymization** | `anonymize.js`, `anonymizer.js` | ✅ Working | Must remain hidden |
| **Sensitivity classification** | `sensitivity.js` | ✅ Working | Must remain hidden |

### 3.8 Dashboard & UI

| Capability | Files | Status | Classification |
|------------|-------|--------|----------------|
| **SvelteKit dashboard** | `dashboard/` | ✅ Working | Safe to expose |
| **Terminal / chat interface** | `routes/terminal/` | ✅ Working | Primary UI surface |
| **Settings page** | `routes/settings/` | ✅ Working | Safe to expose |
| **Kanban board** | `routes/kanban/` | ✅ Working | Safe to expose |
| **Timeline view** | `routes/timeline/` | ✅ Working | Safe to expose |
| **Conversations view** | `routes/conversations/` | ✅ Working | Safe to expose |
| **Sensors page** | `routes/sensors/` | ✅ Working | Safe to expose |
| **Atlas (memory graph)** | `routes/atlas-v2/` | ✅ Working | Safe to expose |
| **Voice call** | `routes/call/` | ✅ Working | Safe to expose |
| **Automation** | `routes/automation/` | ✅ Working | Safe to expose |

### 3.9 Desktop Shell (Tauri 2)

| Capability | Files | Status | Classification |
|------------|-------|--------|----------------|
| **Tauri WebView2 wrapper** | `tauri/src-tauri/` | ✅ Working | Product shell |
| **System tray** (show/quit) | `lib.rs` L900-938 | ✅ Working | Safe to expose |
| **Screen capture** (xcap) | `lib.rs` L226-500 | ✅ Working | Must remain hidden |
| **Window management** (multi-window) | `lib.rs` L176-312 | ✅ Working | Must remain hidden |
| **WebView2 permission auto-grant** (mic/cam on loopback) | `lib.rs` L27-101 | ✅ Working | Must remain hidden |
| **Global shortcut** (Win+H voice typing) | `lib.rs` L940-950 | ✅ Working | Safe to expose |
| **Mouse button listener** (XButton1/2 → voice actions) | `lib.rs` | ✅ Working | Safe to expose |
| **HTTP API on :7790** | `lib.rs` L316-600 | ✅ Working | Must remain hidden |
| **Shell registers with server** | `lib.rs` L960-974 | ✅ Working | Must remain hidden |

### 3.10 Startup & Distribution

| Capability | Files | Status | Classification |
|------------|-------|--------|----------------|
| **PHOENIX.bat** (manual server start + wait + shell launch) | `PHOENIX.bat` | ⚠️ Developer-only | Must be replaced |
| **PHOENIX.vbs** (hidden window launcher) | `PHOENIX.vbs` | ⚠️ Developer-only | Must be replaced |
| **PHOENIX_DEBUG.bat** | `PHOENIX_DEBUG.bat` | ⚠️ Developer-only | Must be replaced |
| **phoenix-loop.bat** (restart loop) | `service/phoenix-loop.bat` | ⚠️ Developer-only | Must be replaced |
| **NSIS installer script** | `installer/phoenix-setup.nsi` | ⚠️ Partially working — exists, untested as product | Needs rework |
| **PowerShell installer** (downloads Node.js, copies service, npm install) | `installer/install.ps1` | ✅ Working but developer-oriented | Needs rework |
| **Self-contained installer binary** (phoenix-installer.cjs + @yao-pkg/pkg) | `service/installer/phoenix-installer.cjs` | ⚠️ Partially working — designed for remote client install, not main product | Needs rework |
| **Windows Service registration** | `install-service.js`, `daemon/phoenix.xml` | ✅ Working | Needs to be automated |
| **Desktop/Start Menu shortcuts** | `installer/install.ps1` L246-274 | ✅ Working | Keep |
| **Startup on login** (fallback) | `installer/install.ps1` L309-327 | ✅ Working | Keep |
| **Firewall rule** | `installer/install.ps1` L329-336 | ✅ Working | Keep |

### 3.11 Configuration

| Capability | Files | Status | Classification |
|------------|-------|--------|----------------|
| **Settings in DB** (`settings` table) | `db.js`, `server.js` | ✅ Working | Must remain hidden (mechanism) |
| **Settings API** (`GET/PUT /api/v1/settings`) | `routes/dashboard.js` | ✅ Working | Expose via Settings UI |
| **Model selection** (per-purpose: reasoning, vision, embedding, etc.) | `db.js` model_selections table | ✅ Working | Expose via AI config UI |
| **Environment variable overrides** | Throughout codebase | ✅ Working | Developer-only |
| **Profiles** (full/core/headless) | `profiles.js` | ✅ Working | Must remain hidden |
| **No first-run onboarding wizard** | — | ❌ Does not exist | Must be built |
| **No built-in help system** | — | ❌ Does not exist | Must be built |

### 3.12 Updates

| Capability | Status | Classification |
|------------|--------|----------------|
| **Automatic updates** | ❌ Does not exist | Must be designed |
| **Manual update path** | Git pull + npm install (developer) | Must be replaced |

### 3.13 MCP Integration

| Capability | Files | Status | Classification |
|------------|-------|--------|----------------|
| **MCP server** (stdio-based for Claude Code) | `mcp-server.js`, `mcp/phoenix-tools.js` | ✅ Working | Developer/advanced |
| **Quality log MCP** | `quality-log-mcp.js`, `mcp/quality-log-tools.js` | ✅ Working | Developer/advanced |
| **`.mcp.json` config** | `.mcp.json` (repo root + service/) | ✅ Working | Developer-only |

---

## 4. Critical Blockers for Productization

### Blocker 1: No Unified Executable

**Current state:** The Tauri shell (`phoenix-shell.exe`) is a separate process that connects to an already-running Node.js server. The server is started by `PHOENIX.bat` or a Windows Service. There is **no single `.exe` that starts the backend and opens the UI.**

**Impact:** A normal user cannot just "launch Phoenix." They must either run PHOENIX.bat (which shows a CMD window) or have the Windows Service already running.

**Resolution required:** The Tauri shell must be extended (or a new launcher must be created) to:
1. Start the Node.js backend as a child process
2. Wait for health check to pass
3. Show the UI
4. Own shutdown of the backend when the user closes the app

### Blocker 2: No First-Run Experience

**Current state:** After install, the user lands on `http://127.0.0.1:7777/v2/terminal` — a developer-facing dashboard with no explanation, no onboarding, and no guided setup.

**Impact:** A non-technical user has no idea what they're looking at or what to do next.

**Resolution required:** Design and implement a complete first-run onboarding flow.

### Blocker 3: Ollama Dependency Is Unmanaged

**Current state:** Ollama is expected to be pre-installed by the user. The auto-start code in `ollama-boot.js` is **explicitly disabled** (line 88-91: "Ollama auto-start DISABLED (RAM protection)"). Model pulling is never triggered for the end user.

**Impact:** Local AI simply doesn't work unless the user manually installs Ollama, runs `ollama pull`, and starts it. A non-technical user will never accomplish this.

**Resolution required:**
- Check Ollama's licensing for redistribution rights
- Build guided Ollama installation if redistribution is not permitted
- Implement smart auto-start with RAM awareness
- Auto-pull required models with progress UI

### Blocker 4: No In-App Help

**Current state:** All documentation lives in GitHub markdown files (`docs/`, `documentation/`, `README.md`, `CLAUDE.md`). There is no in-app help, tutorial, or FAQ.

**Impact:** Normal users have no way to learn how Phoenix works.

### Blocker 5: Raw Technical Errors

**Current state:** Errors bubble up as Node.js stack traces, HTTP status codes, or raw `ECONNREFUSED` messages. No human-readable error conversion layer exists.

**Impact:** A non-technical user seeing `ECONNREFUSED 127.0.0.1:11434` will not understand what happened.

### Blocker 6: Tauri Shell CSP is `null`

**Current state:** `tauri.conf.json` sets `"csp": null` — Content Security Policy is completely disabled.

**Impact:** Security concern for a production desktop app. Must be tightened.

### Blocker 7: Hardcoded Developer Paths in Tauri

**Current state:** `lib.rs` line 112-113 hardcodes:
```rust
const DICTATE_SCRIPT: &str = r"%USERPROFILE%\Desktop\Phoenix\service\src\dictate-vad.py";
const VOICE_START_SND: &str = r"%USERPROFILE%\Desktop\Phoenix\service\bin\sounds\voice-start.wav";
```

The WinSW daemon config (`phoenix.xml`) also hardcodes paths to `%USERPROFILE%\Desktop\Phoenix\`.

**Impact:** These only work on the developer's own machine.

---

## 5. Data Flow & Privacy Analysis

### What Stays Local (Always)

| Data | Storage Location |
|------|-----------------|
| Database (all memories, events, conversations) | `%LOCALAPPDATA%/Phoenix/data/phoenix.db` |
| Encryption key | `%LOCALAPPDATA%/Phoenix/data/phoenix.key` |
| Screenshots (analyzed and discarded) | Temp file, never persisted as image |
| Webcam snapshots | Processed in-memory, never saved |
| Window titles / app activity | Written to local DB |
| Semantic facts, episodic timeline, procedural memory | Written to local DB |

### What Can Leave the Machine

| Data | When | Destination | User Control |
|------|------|-------------|--------------|
| Chat prompts (voice requests) | Voice chain default: cloud-first | Anthropic / Cerebras / Groq / Gemini / OpenAI (per model selection) | `ai_fallback_chain_voice` setting; set to local-only to prevent |
| Chat prompts (background tasks) | Background chain default: local-first, cloud fallback | Same providers | `ai_fallback_chain_background` setting |
| Embedding text | Only when using a remote Ollama device | The remote Ollama host on user's own network | `ollama_url` setting |
| Phone requests | When using Android app | Traverses Tailscale VPN (encrypted tunnel, no public internet) | Tailscale configuration |
| Home Assistant commands | When HA integration is configured | User's own HA instance (typically local) | HA config |
| Cloud tunnel (if enabled) | `public_tunnel` setting ON | Cloudflare Quick Tunnel / Tailscale Funnel | **Setting — was ON by default in past, now off** |

### What Is Encrypted

| Item | Encryption | Key Management |
|------|-----------|----------------|
| `phoenix.db` | SQLCipher AES-256-CBC | Auto-generated 32-byte hex key in `phoenix.key` |
| `phoenix.key` | File permissions only (mode 0o600 on Linux) | Not encrypted at rest on Windows; relies on user-session NTFS ACLs |
| API keys | Stored as plaintext in DB `settings` table | Redacted from API responses by `secrets.js` |
| Tailscale tunnel | WireGuard-based | Managed by Tailscale |

---

## 6. Existing Installer Infrastructure

### NSIS Script (`installer/phoenix-setup.nsi`)
- Creates `Phoenix-Setup.exe` (~2KB stub)
- Extracts `install.ps1` to temp folder
- Runs the PowerShell script as admin
- Has uninstaller section
- **Not fully tested as a product installer**

### PowerShell Script (`installer/install.ps1`)
- Downloads portable Node.js 22 LTS
- Copies service files via robocopy
- Runs `npm install --omit=dev`
- Builds the SvelteKit dashboard
- Generates encryption keys
- Creates `PHOENIX.bat` launcher
- Creates desktop/Start Menu shortcuts
- Optionally registers Windows Service
- Sets up startup-on-login fallback
- Adds firewall rule
- **Does NOT handle Ollama**
- **Does NOT handle Tauri shell binary**
- **Has `# TODO: download release from GitHub` for remote install**

### Self-Contained Client Installer (`service/installer/phoenix-installer.cjs`)
- 1090-line standalone Node.js script
- Built to binary via `@yao-pkg/pkg`
- Has browser-based GUI (localhost:17999, SSE progress)
- Designed for **remote client installation**, not main product
- Supports LAN discovery + Tailscale peer discovery
- Uses invite codes/URLs

---

## 7. Third-Party Licensing for Redistribution

| Dependency | License | Can Bundle? |
|------------|---------|-------------|
| **Node.js** | MIT | ✅ Yes (already downloading portable) |
| **Ollama** | MIT | ✅ Yes, but binary is large (~200MB). Check redistribution terms for bundled models. |
| **Gemma 4** (via Ollama) | Google Gemma Terms of Use | ⚠️ Redistribution allowed for inference; must include license notice |
| **Qwen3-embedding** | Apache 2.0 | ✅ Yes |
| **Tauri 2** | MIT/Apache 2.0 | ✅ Yes |
| **WebView2** | Microsoft Edge WebView2 Runtime license | ✅ Evergreen runtime auto-updates; can bootstrap install |
| **better-sqlite3-multiple-ciphers** | MIT | ✅ Yes |
| **Electron** (if considered) | MIT | ✅ Yes — but Tauri is already in use |

---

## 8. System Requirements (Current)

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | Any i5 (2018+) | i5 10th gen+ |
| RAM | 8 GB | 16 GB |
| Storage | 128 GB SSD | 256 GB+ SSD |
| OS | Windows 10 (64-bit) | Windows 11 |
| Runtime | WebView2 (ships with Win10/11) | — |
| For Local AI | Ollama + ~2GB for models | GPU with 6GB+ VRAM |

---

## 9. Files & Scripts to Replace or Hide

### Must Be Replaced (User-Facing Startup)

| File | Current Purpose | Replacement |
|------|----------------|-------------|
| `PHOENIX.bat` | Manual server start + shell launch | Unified launcher (Tauri starts backend) |
| `PHOENIX.vbs` | Hidden window launcher | Eliminate |
| `PHOENIX_DEBUG.bat` | Debug launcher | Move to developer tools |
| `service/phoenix-loop.bat` | Restart loop | Build into launcher |
| `service/phoenix-loop.vbs` | Hidden restart | Eliminate |
| `service/restart.bat` | Manual restart | Build into app |

### Must Remain Developer-Only

| File | Reason |
|------|--------|
| `service/phoenix.js` | CLI entry point (developer) |
| `service/dev-server.js` | Dev server |
| `service/phoenix-guardian.ps1` | Guardian watchdog |
| `service/open-dev-dashboard.cjs` | Dev dashboard opener |
| All `.ps1` files | Developer scripts |
| `service/src/cli/` | CLI commands |
| `.mcp.json` | MCP config for Claude Code |

---

## 10. What Must Be Built

| Item | Priority | Complexity | Notes |
|------|----------|-----------|-------|
| **Unified launcher** (Tauri starts Node backend as child process) | P0 | Medium | Core architecture change |
| **First-run onboarding wizard** | P0 | High | 8-12 screen flow |
| **Ollama management** (detect, guide install, auto-pull models) | P0 | High | Licensing check needed |
| **Human-readable error layer** | P0 | Medium | Wrap all user-facing errors |
| **In-app Help center** | P1 | Medium | Content + navigation |
| **Settings redesign** (non-technical language) | P1 | Medium | Relabel + reorganize |
| **Permission consent UI** (for screen/webcam/activity) | P1 | Low | Mostly exists via capture-consent.js |
| **Clean shutdown** (Tauri → stop Node → exit) | P1 | Low | Signal handling |
| **Auto-update mechanism** | P2 | High | Download + replace + restart |
| **Production installer** (NSIS or Tauri bundler) | P2 | Medium | Extend existing NSIS |
| **Security hardening** (CSP, IPC validation) | P2 | Medium | Audit + fix |
| **Website** (marketing + download page) | P3 | Medium | Static site |

---

## 11. What Can Be Reused As-Is

| Component | Confidence | Notes |
|-----------|------------|-------|
| Three-tier server architecture | High | Proven stability, hot-swap works |
| Encrypted database + schema | High | 980-line schema, production-tested |
| Memory subsystem (episodic/semantic/procedural) | High | Core value proposition |
| LLM fallback chain | High | Well-engineered, model-agnostic |
| Capture consent system | High | Already has user-friendly labels + blurbs |
| Secrets handling | High | Env-first, redaction, source tracking |
| SvelteKit dashboard | High | Rich feature set, many pages |
| Tauri shell (tray, shortcuts, screen capture) | High | Needs extension, not replacement |
| PowerShell installer (as base) | Medium | Good structure, needs Ollama + onboarding additions |
| NSIS wrapper | Medium | Functional, needs polish |

---

## 12. What Must Be Rewritten

| Component | Reason |
|-----------|--------|
| **Startup sequence** | BAT files → embedded in Tauri launcher |
| **Ollama boot** (`ollama-boot.js`) | Disabled, needs RAM-aware auto-start + model management |
| **WinSW daemon config** | Hardcoded paths to developer machine |
| **Tauri hardcoded paths** (`lib.rs` L112-114) | Must use runtime-resolved paths |
| **Error surfaces** | No human-readable error translation exists |

---

## 13. What Is Missing

| Item | Status |
|------|--------|
| First-run onboarding | ❌ Not started |
| In-app Help/Guide | ❌ Not started |
| Human-readable error layer | ❌ Not started |
| Auto-update mechanism | ❌ Not started |
| Cloud memory sync | ❌ Not implemented (do NOT claim it exists) |
| Cross-device memory merge | ❌ Not implemented |
| Ollama guided installer | ❌ Not started |
| Production-ready Windows installer | ⚠️ Partially exists (NSIS + PS1 + pkg) |
| Code signing | ❌ Not started |

---

## 14. What Is Technically Infeasible (Current Phase)

| Item | Reason |
|------|--------|
| Silent Ollama bundling | Binary is ~200MB; licensing allows it but installer size becomes ~400MB+. **Guided install is more practical.** |
| Cloud memory sync | No server infrastructure exists. Do not fake it. |
| Microsoft Store distribution | Requires MSIX/AppX, full sandboxing review, and Store certification. Not this phase. |
| Code signing | Requires purchasing a code-signing certificate ($200-500/year). Can be deferred but will show SmartScreen warnings. |

---

## 15. Summary Assessment

**Phoenix is a technically sophisticated, feature-rich system with a working encrypted database, multi-provider AI abstraction, three-tier process hierarchy, ambient sensing, and a real SvelteKit dashboard.** The core technology is production-quality.

**The gap is entirely in the product layer:**
1. No unified launcher
2. No onboarding
3. No managed Ollama lifecycle
4. No in-app help
5. No human-readable errors
6. No auto-updates
7. Hardcoded developer paths
8. Disabled security (CSP null)

**Approximately 80% of the existing codebase can be reused.** The work is additive (building the product shell around the existing engine) rather than rewriting the engine.

**Estimated scope:** Medium-large. The onboarding wizard, Ollama management, and unified launcher are the three highest-effort items. The rest is wrapping and polishing what already works.
