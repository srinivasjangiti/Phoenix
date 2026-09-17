# Phoenix Phase 4: Human-Readable Error & Recovery System — Codebase Audit

**Date:** 2026-09-08  
**Scope:** Repository-wide audit of error handling, recovery mechanisms, failure modes, error presentation, and user feedback pathways across the Phoenix codebase (`service/src`, `service/dashboard`, `service/tauri`, database, and background daemons).  
**Objective:** Ground Phase 4 productization in verified repository reality to turn cryptic, developer-oriented errors into actionable, consumer-friendly recovery experiences for non-technical Windows users.

---

## 1. Context & Determination of What Phase 4 Actually Is

### A. Roadmap Search Results
A comprehensive search across repository documentation and code revealed the following Phase 4 references:
1. `docs/IMPLEMENTATION/PHOENIX-PRODUCTIZATION-PLAN.md` (Line 159):  
   **"Phase 4: Human-Readable Error & Recovery System"**  
   Preceded by Phase 1 (Single Executable & Desktop Supervisor), Phase 2 (First-Run & Readiness System), and Phase 3 (AI / Ollama Manager). Followed by Phase 5 (In-App Help Center) through Phase 10.
2. Older architectural migration notes:
   - `docs/carrier-plan.md` (PTY Handoff to Carrier) — *completed architectural task*.
   - `docs/SHIP-PLAN.md` (Consent UX & minimal surface) — *completed in Tier 0*.
   - `service/src/org-db.js` (Per-Org DBs & cross-org sharing) — *internal multi-tenant subsystem*.

### B. Confirmed Scope of Phase 4
Phase 4 in the active productization roadmap is explicitly:  
**Human-Readable Error & Recovery System (`service/src/error-humanizer.js` + UI error cards & recovery workflows).**

### C. Core Objective
Transform technical exceptions (e.g. `ECONNREFUSED 11434`, `Ollama 404`, `SQLITE_BUSY`, `EADDRINUSE 7777`, `401 Unauthorized`, timeouts, rate limits) into clear, reassuring consumer cards with:
1. Plain-English title and description explaining what happened without jargon.
2. Primary Action Button: Automated one-click fix/recovery (e.g., wake up Ollama, trigger download, retry with backoff).
3. Secondary Action Button: Graceful alternative (e.g., open settings, switch engine, dismiss).
4. Collapsible "Technical Details": Sanitized diagnostic information for troubleshooting without leaking sensitive user data or file paths.

---

## 2. Current State of Error Handling in Phoenix

### A. Backend Server & API Routes (`service/src/server.js`, `service/src/routes/api.js`)
- **Missing Global Error Middleware:** `service/src/server.js` does NOT register a standard Express 4-argument error middleware (`app.use((err, req, res, next) => ...)`). Unhandled synchronous route errors fall back to Express default HTML error pages with raw call stacks.
- **Inconsistent Error JSON Structure:**
  - In `service/src/routes/api.js` (line 148): `catch (err) { res.status(500).json({ error: err.message }); }`
  - In `service/src/server.js` (line 6397): `catch (e) { res.status(500).json({ ok: false, error: e.message }); }`
  - In `service/src/server.js` (line 6327): `catch (err) { res.json({ ok: false, error: 'Tauri shell not responding: ' + err.message }); }`
  - Some endpoints return HTTP 500, others HTTP 200 with `{ ok: false, error: ... }`, and others `{ error: '...' }` without an `ok` field.
- **Raw Technical Strings Passed to Client:**
  When Ollama is stopped, the API sends:
  `"All AI models in fallback chain failed: ollama:llama3.2:1b: connect ECONNREFUSED 127.0.0.1:11434"`
  When a model is uninstalled, it sends:
  `"Ollama 404: {\"error\":\"model 'llama3.2:1b' not found\"}"`
  When SQLite encounters write contention, it sends:
  `"SqliteError: database is locked (code: SQLITE_BUSY)"`

### B. LLM & Router Subsystem (`service/src/llm-fallback.js`, `service/src/router.js`)
- **Strict Local Mode Clean Failure:** Phase 3 successfully configured `service/src/llm-fallback.js` so that when `ai_choice === 'local'` and `allow_cloud_fallback` is false, cloud models are excluded and errors throw cleanly without silent cloud leaks.
- **Generic Fallback in Router:**
  In `service/src/router.js` (line 763):
  `response: 'Phoenix is having trouble thinking right now.'`
  In `service/src/router.js` (line 1879 for streaming):
  `response: 'Sorry, I ran into a problem thinking that through. Try again.'`
  The user is given an apologetic sentence, but receives zero explanation of *why* (e.g. whether Ollama is stopped, the model is missing, or the computer is low on memory) and zero one-click recovery action.

### C. Readiness State Machine (`service/src/readiness.js`)
- `service/src/readiness.js` already evaluates 8 components (`database`, `memory`, `platform`, `steward`, `carrier`, `ollama`, `selected_model`, `devices`) into structured statuses (`READY`, `NEEDS_ACTION`, `UNAVAILABLE`, `DISABLED`, `ERROR`).
- **Gap:** While `readiness.js` produces accurate messages (e.g., `"Configured model \"llama3.2:1b\" is not installed in local Ollama"`), there is no shared humanization contract between the readiness checker and the runtime API/router handlers. Runtime errors repeat raw strings instead of leveraging the readiness recovery actions.

### D. Desktop Shell & Supervisor (`service/tauri/src-tauri/src/backend.rs`, `index.html`)
- In `service/tauri/src/index.html`, a splash screen error card already exists for startup timeouts:
  `#error-state` with "Phoenix took longer than expected", "Try Again", "Open in Browser", and `<details><summary>View Technical Details</summary>`.
- **Gap:** This pattern only exists on the Tauri splash page *before* the dashboard loads. Once the dashboard loads at `http://127.0.0.1:7777/v2/`, any subsequent backend error has no equivalent consumer card.

### E. Frontend / Dashboard (`service/dashboard/src/`)
- In `service/dashboard/src/lib/api.js` (line 172):
  ```javascript
  if (!res.ok) {
    let detail = '';
    try { const body = await res.json(); detail = body.error || ''; } catch {}
    throw new Error(detail || `API ${path}: ${res.status}`);
  }
  ```
- In `service/dashboard/src/routes/+layout.svelte` (lines 620, 778, 1092):
  If the backend drops or fails health check, `serverStatus` becomes `'offline'`. The UI only shows a small red dot in the navbar with "Disconnected". There is no banner explaining why it disconnected, whether port 7777 was reclaimed, or how to restart it.
- In `service/dashboard/src/routes/comms/+page.svelte` (line 699):
  `voiceError = e?.message || 'Voice turn failed';` — displays raw string in the UI banner.

---

## 3. Inventory of Core Failure Modes & Humanization Mappings

| Error Code / Signature | Root Cause in Codebase | Current Raw Output | Phase 4 Humanized Card Specification |
|---|---|---|---|
| `ECONNREFUSED 11434` | Ollama daemon not running or closed | `connect ECONNREFUSED 127.0.0.1:11434` | **Title:** "Local AI Engine is Sleeping"<br>**Description:** "Ollama is installed on your computer but is not running right now. Phoenix needs it to think privately on this PC."<br>**Primary Action:** `[Wake Up Local AI]` (`POST /api/v1/ollama/start`)<br>**Secondary Action:** `[Switch to Cloud AI]` or `[Open Settings]` |
| `Ollama 404: model not found` | Selected local model is missing from `/api/tags` | `Ollama 404: {"error":"model '...' not found"}` | **Title:** "AI Model Needs Download"<br>**Description:** "The selected model '{modelName}' is not installed on this PC yet."<br>**Primary Action:** `[Download Model (~{size})]` (`POST /api/v1/ollama/pull`)<br>**Secondary Action:** `[Choose Another Model]` (`/settings`) |
| `SQLITE_BUSY` / `SQLITE_LOCKED` | SQLite write lock contention (FTS5 / dream cycle / events) | `SqliteError: database is locked (code: SQLITE_BUSY)` | **Title:** "Memory is Saving Notes"<br>**Description:** "Phoenix is busy organizing your memories and notes. This usually takes just a few seconds."<br>**Primary Action:** `[Try Again]`<br>**Secondary Action:** `[Dismiss]` |
| `EADDRINUSE 7777` | Port collision with orphan Node process or another app | Server retries 15x and crashes with `EADDRINUSE` | **Title:** "Port 7777 is Busy"<br>**Description:** "Another instance of Phoenix or a background program is using port 7777."<br>**Primary Action:** `[Close Other Phoenix & Retry]`<br>**Secondary Action:** `[Open in Browser]` |
| `HTTP 401` / `HTTP 403` | Invalid, expired, or missing Cloud API key | `Claude API error: 401 unauthorized` / `Invalid API Key` | **Title:** "Cloud AI Key Needs Attention"<br>**Description:** "Your cloud API key was not recognized or has expired."<br>**Primary Action:** `[Update API Key]` (`/settings`)<br>**Secondary Action:** `[Switch to Local AI]` |
| `HTTP 429` | Cloud provider rate limit or quota exhausted | `rate_limit_error: Number of request tokens per minute exceeded` | **Title:** "Cloud Provider is Busy"<br>**Description:** "Your cloud AI provider temporarily limited requests. You can wait a moment or switch to local AI."<br>**Primary Action:** `[Switch to Local AI]`<br>**Secondary Action:** `[Wait & Retry]` |
| `ECONNRESET` / `ETIMEDOUT` | Network dropped during remote inference or sync | `TypeError: fetch failed (ETIMEDOUT)` | **Title:** "Connection Dropped"<br>**Description:** "Phoenix lost connection with the network while processing your request."<br>**Primary Action:** `[Reconnect & Retry]`<br>**Secondary Action:** `[Work Offline]` |
| Unhandled Runtime Exception | Uncaught logic or schema error | `TypeError: Cannot read properties of undefined` | **Title:** "Something Interrupted Phoenix"<br>**Description:** "Phoenix encountered an unexpected hiccup while processing this step."<br>**Primary Action:** `[Restart Service]`<br>**Secondary Action:** `[Copy Diagnostics]` |

---

## 4. Reusable vs. Missing Components

### Reusable Components (Unmodified Phase 1-3 Baseline)
1. **`service/src/ollama-manager.js`:**
   - Functions `startOllamaDaemon()`, `pullModel()`, `cancelModelPull()`, `checkOllamaStatus()`, `testLocalInference()`.
   - Used directly by error recovery primary actions (wake up daemon, pull model).
2. **`service/src/readiness.js`:**
   - Function `checkReadiness()` with normalized component states.
   - Provides truth foundation for diagnosing system health.
3. **`service/src/models-catalog.js`:**
   - Isolated catalog providing human-friendly model names and download/RAM estimates (`~1.3 GB download (estimate)`).
4. **`service/src/db.js` & `service/src/events.js`:**
   - Logging mechanisms `client_logs` and `events` for recording sanitized error diagnostics.
5. **`service/tauri/src/index.html`:**
   - Native splash screen UI pattern (accordion `<details>` with copyable logs).

### Missing Pieces (To Be Implemented in Phase 4)
1. **`service/src/error-humanizer.js` (NEW):**
   - Core classifier mapping raw errors, codes, and HTTP statuses into the standardized `HumanErrorCard` payload schema.
   - Sanitizer function removing file paths, usernames (`C:\Users\...`), environment paths, and API keys.
2. **Express Error Handling Integration:**
   - Centralized Express error-formatting middleware that decorates API failure responses with `human_error`.
   - Updates to `service/src/routes/api.js` (`POST /api/v1/chat`, `GET /chat/stream`) to pass humanized cards to the client.
3. **Frontend Reusable Component (`service/dashboard/src/lib/components/HumanErrorCard.svelte`):**
   - Renders the humanized card with title, plain language explanation, primary action button (with loading spinner), secondary button, and collapsible technical details.
4. **Global Disconnect / Offline Banner (`service/dashboard/src/routes/+layout.svelte`):**
   - Replaces the passive red dot with a dismissible or actionable recovery drawer when `serverStatus === 'offline'`.
5. **Chat & Stream Error Recovery Integration:**
   - Allows chat messages that failed (due to Ollama asleep or model missing) to render an inline error card with an immediate "Wake Up" or "Download" button.

---

## 5. Security & Privacy Audit for Phase 4

### Data Boundaries
- **No External Transmission:** Error humanization is a 100% on-device, local transformation. No error logs, stack traces, or diagnostics are sent to any external server or telemetry endpoint.
- **Sanitization of Diagnostic Strings:**
  Technical error messages frequently leak private user context:
  - Windows file paths: `C:\Users\JohnDoe\Personal Coding\Phoenix\...` -> must be scrubbed to `<phoenix_root>\...`.
  - User profile tokens: `%USERPROFILE%` / username scrubbing.
  - Secret keys: `sk-ant-...`, `Bearer ...` -> regex redacted before reaching the UI or logs.
  - User query leaks: If an error includes prompt snippets, it must be truncated and sanitized.
- **Local vs Cloud Attribution:** When an error occurs in the local Ollama subsystem, it must be explicitly tagged `subsystem: "local_ollama"`. When a cloud provider fails, it must be tagged `subsystem: "cloud_<provider>"`.

---

## 6. Preservation & Regression Analysis against Phase 3

| Phase 3 Rule / Requirement | Phase 4 Risk | Architectural Mitigation |
|---|---|---|
| **Never kill external Ollama** | An error recovery action like "Restart Ollama" might attempt to force-kill PID `31380`. | Phase 4 recovery actions will NEVER invoke `taskkill` or stop Ollama. The primary action for `ECONNREFUSED` is strictly `startOllamaDaemon()`, which attaches to external Ollama if reachable, or spawns safely if stopped. |
| **Zero fake readiness** | An error handler might try to mask errors by returning a fabricated success message. | Phase 4 explicitly reports failure honest cards (`NEEDS_ACTION` / `ERROR`) with an action button to resolve the genuine issue. It never fabricates "everything is fine." |
| **Strict local AI mode (no silent cloud fallback)** | An error handler might silently route to Claude when Ollama is asleep. | Strict local AI mode remains untouched. If Ollama fails, Phase 4 renders the humanized recovery card asking the user if *they* want to switch or wake up Ollama. It NEVER switches silently. |
| **Test Suite Integrity** | Changes to error JSON shapes could break tests expecting `{ error: ... }`. | Phase 4 maintains backward compatibility: API responses continue to provide `{ ok: false, error: err.message, human_error: card }`. Existing tests asserting `err.message` will pass without modification. |

---

## 7. Audit Conclusion & Recommendation
Phase 4 is **WELL DEFINED** in the Productization Roadmap as the **Human-Readable Error & Recovery System**. The codebase has a strong foundation (Phase 1-3 baseline, readiness state machine, Ollama manager), but currently exposes raw exceptions, unformatted 500 JSON, and generic "having trouble thinking" strings.

Phase 4 will close this gap completely by adding `service/src/error-humanizer.js`, standardizing API error responses, and providing a clean, accessible UI card component with one-click recovery.
