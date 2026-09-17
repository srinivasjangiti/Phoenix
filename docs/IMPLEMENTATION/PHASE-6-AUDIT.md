# Phoenix Phase 6: Settings, Privacy & Permissions Redesign — Codebase Audit

**Date:** 2026-09-08  
**Scope:** Repository-wide audit of configuration interfaces, privacy controls, sensor permissions, AI engine setup, and user preferences across the Phoenix codebase (`service/dashboard/src/routes/settings/`, `service/src/server.js`, `service/src/readiness.js`, `service/src/privacy.js`, `service/src/screen-watcher.js`, `service/src/webcam-watcher.js`).  
**Objective:** Ground Phase 6 in verified repository reality to transform the current developer-oriented 11-tab settings panel into a clean, consumer-grade, non-technical interface with clear privacy guarantees and a dedicated Developer Mode toggle.

---

## 1. Official Phase 6 Definition & Roadmap Verification

### A. Roadmap Authority
In [`docs/IMPLEMENTATION/PHOENIX-PRODUCTIZATION-PLAN.md`](file:///c:/Personal%20Coding/Projects/Phoenix/docs/IMPLEMENTATION/PHOENIX-PRODUCTIZATION-PLAN.md) (Lines 190–200), Phase 6 is explicitly defined as:
```text
### Phase 6: Settings, Privacy & Permissions Redesign

#### [MODIFY] `service/dashboard/src/routes/settings/+page.svelte`
- Clean consumer tabs:
  - **Profile:** User name, display preferences.
  - **AI Setup:** Active provider, model selection with human names, local vs cloud.
  - **Memory & Storage:** Data location, Backup & Restore controls.
  - **Privacy & Senses:** Screen watching, activity tracking, webcam presence with clear WHAT/WHY/EXAMPLE.
  - **Devices:** Phone companion, smart home, remote computers.
  - **Advanced (Developer Mode toggle):** Ports, raw logs, PTY sessions, dev tools.
```

### B. Previous Phase 6 Search in Repository
- Searches for "Phase 6" across the codebase revealed historic references to Tier 0 replication foundation (`routes/replication.js`, `routes/audit.js`) and carrier shadow traffic (`carrier.js`). These were internal architectural iterations.
- In the active **Phoenix Productization Roadmap (Approved 10-Phase Sequence)**, Phase 6 is exclusively **Settings / Privacy / Permissions (Consumer-Grade UI)**. No previous productization audit or plan file existed for Phase 6 prior to this document.

---

## 2. Current State of Settings, Privacy & Permissions

### A. Settings UI Sprawl (`service/dashboard/src/routes/settings/+page.svelte`)
1. **11 Fragmented Tabs:** Currently, the settings navigation exposes 11 separate technical categories:
   - `Appearance` (Theme selection)
   - `General` (User name, internal port, pan mode, raw logs)
   - `AI & Usage` (Ollama status, model pull, raw API keys, fallback chains)
   - `Controls` (Voice key, screenshot shortcuts, voice permissions)
   - `Devices` (Phone companion, Tailscale peers, app versions)
   - `Organizations` (Enterprise multi-tenant org switcher)
   - `Security` (DB encryption key, password)
   - `Authentication` (OAuth provider client secrets)
   - `Remote Access` (Public tunnel, Tailscale status)
   - `Treasury` (Data staking, Phoenix tokens)
   - `Email` (Raw IMAP/SMTP host and port configurations)
2. **High Cognitive Load for Normal Users:** Non-technical users are greeted with developer concepts like "SQLCipher 32-byte hex keys", "OAuth redirects", "IMAP Port 993 SSL", "PTY terminal sessions", and "public tunnels".
3. **Missing Critical Consumer Controls:**
   - There are **no visual toggles** for Screen Observation, Desk Presence (webcam), or Activity Tracking in `Controls`.
   - Sensor controls are isolated in a separate developer screen (`routes/sensors/+page.svelte`), where sensors are listed as raw hardware IDs without plain-English explanations.

### B. Backend Settings & Persistence Architecture
1. **Database Persistence (`service/src/server.js` lines 2849–2897):**
   - Endpoints: `GET /api/v1/settings` and `PUT /api/v1/settings`.
   - Reads/writes to the `settings` table (`key TEXT PRIMARY KEY, value TEXT, updated_at TEXT`).
   - Uses partial merge (`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (:key, :val, ...)`).
   - Automatically redacts API keys and secrets via `redactSettings()` (`service/src/secrets.js`).
2. **Readiness Alignment (`service/src/readiness.js` lines 155–195):**
   - The centralized readiness state machine reads:
     - `screen_enabled` (Screen observation)
     - `voice_enabled` (Voice input)
     - `activity_tracking_enabled` (Activity & idle tracker)
     - `permissions_confirmed` (First-run consent flag)
     - `ai_choice` & `ai_engine_choice` (`local` vs `cloud`)
     - `user_name` & `display_name`
   - If `screen_enabled`, `voice_enabled`, and `activity_tracking_enabled` are all toggled off, readiness reports `status: "DISABLED"` with message `"All sensor observation disabled by user"`.

### C. Privacy & Watchers Architecture
1. **Active Window Awareness (`service/src/screen-watcher.js`):**
   - Gathers foreground window titles (e.g. *"Word - History Paper"*).
   - Never saves full screenshot image files to disk.
2. **Desk Presence Glance (`service/src/webcam-watcher.js`):**
   - Checks webcam frames in-memory for human face presence.
   - Pauses notifications when the user walks away from the desk.
   - Raw video is never saved, recorded, or transmitted.
3. **Differential Privacy Engine (`service/src/privacy.js`):**
   - Applies Laplace/exponential statistical noise to data queries using privacy budget (`privacy_enabled`, `privacy_epsilon`, `privacy_daily_budget`).
4. **Data Residency & Local Encryption (`service/src/db.js`):**
   - All user data lives in `%LOCALAPPDATA%\Phoenix\data\phoenix.db` encrypted with AES-256 via SQLCipher.
   - Key is stored locally in `phoenix.key`.

---

## 3. Missing Work Analysis for Phase 6

To fulfill the approved Productization Plan, the Settings panel must be restructured into **5 Clean Consumer Tabs** plus a collapsible **Advanced (Developer Mode)** section:

| New Consumer Tab | Scope & Included Controls | Mapping from Existing Code |
|---|---|---|
| **1. Profile** | User display name, theme picker, visual styling. | Replaces separate `Appearance` tab and user name fields from `General`. |
| **2. AI Setup** | Local AI (Ollama) vs Cloud AI toggle, human-friendly model recommendations (`Llama 3.2 1B`, `3B`, `Qwen 2.5`), model download progress bar, test inference trigger, and secure cloud API key inputs with masking. | Consolidates `AI & Usage` with Phase 3 Ollama Manager and Phase 4 Error Recovery. |
| **3. Memory & Storage** | Transparent data residency indicator ("Your memory is stored on this computer"), database statistics (fact count, memory size), SQLCipher encryption status, and Backup & Restore controls. | Consolidates DB info from `Security` with plain-language local memory assurances. |
| **4. Privacy & Senses** | Sensor observation toggles structured in the **WHAT / WHY / EXAMPLE / CONTROL** format for Screen Watching, Desk Presence (webcam), and Activity Tracking, plus Differential Privacy toggle. | Replaces current `Controls` tab; connects directly to `screen_enabled`, `voice_enabled`, and `activity_tracking_enabled`. |
| **5. Devices** | Android companion phone status, local PC hostname, Smart Home (Home Assistant) integration, and private Tailscale network mesh status. | Streamlines `Devices` and `Remote Access`. |
| **6. Advanced (Developer Mode)** | When Developer Mode is OFF (default), technical developer controls are hidden. When ON, reveals: Server ports, raw debug logs, PTY sessions, Organization switcher, Treasury data staking, and Email IMAP/SMTP parameters. | Encapsulates `orgs`, `treasury`, `email`, `auth`, and raw server settings. |

---

## 4. Architectural & Regression Safety Review

### A. Phase 3 (Ollama & Local AI) Safety
- **Untouched Process Lifecycle:** Settings UI triggers existing API endpoints (`/api/v1/ollama/start`, `/api/v1/ollama/pull`, `/api/v1/ollama/status`). It does NOT kill, stop, or manage processes directly.
- **External Ollama Preservation:** Existing external Ollama (PID `31380`, `EXTERNAL_UNMANAGED`) will remain completely untouched.
- **Strict Local Mode & Zero Cloud Fallback:** Toggling AI choice between `local` and `cloud` updates `ai_choice` and `ai_engine_choice` in the `settings` table, strictly preserving the no-cloud-fallback boundary when `local` is selected.

### B. Phase 4 (Error Humanizer & Recovery) Safety
- **Synergistic Integration:** When invalid keys or connection failures occur in Settings, `HumanErrorCard` from Phase 4 is rendered to guide the user with one-click remediation.
- **Diagnostics Sanitization:** API keys and credentials entered in Settings remain masked and redacted by `secrets.js`.

### C. Phase 5 (In-App Help Center) Safety
- **Direct Deep-Links:** Settings links directly to `/v2/help` via the established Help Center navigation. Help articles linking to `/v2/settings` continue to resolve seamlessly.

### D. Database & Schema Safety
- **Zero Schema Migrations:** The `settings` table already supports arbitrary key-value storage. All new consumer settings (e.g. `developer_mode`, `screen_enabled`, `webcam_presence_enabled`) will be persisted using standard `INSERT OR REPLACE INTO settings (key, value, ...)`.
- **Zero Table Deletions or Alterations:** No existing tables (`events`, `facts`, `devices`, `settings`) are altered. Existing user data is 100% safe.

---

## 5. Audit Summary Matrix

| Audit Item | Status / Finding |
|---|---|
| **Roadmap Alignment** | **Exact match** with Phase 6 of `PHOENIX-PRODUCTIZATION-PLAN.md`. |
| **Current Settings Structure** | 11 fragmented developer-oriented tabs with high cognitive load. |
| **Target Settings Structure** | 5 clean consumer tabs + 1 Developer Mode toggle. |
| **Sensors & Senses** | Backend watchers (`screen-watcher`, `webcam-watcher`) exist; UI needs WHAT/WHY/EXAMPLE consumer controls. |
| **Database Impact** | **NONE.** 0 migrations, 0 schema changes. |
| **Security & Privacy Impact** | **NONE.** 100% local persistence. All secrets redacted over wire. |
| **Regression Risk** | **Zero Risk** to Phase 1–5 baselines. |
| **Phase 6 Readiness** | **WELL DEFINED — READY FOR IMPLEMENTATION PLAN** |
