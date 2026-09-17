# Phoenix Phase 4: Human-Readable Error & Recovery System — Implementation Plan

**Date:** 2026-09-08  
**Status:** PROPOSED (Pending User Review & Authorization)  
**Target:** Consumer-Friendly, Actionable Error & Recovery Architecture for Windows Users

---

## 1. Executive Summary & Objective

Phase 4 bridges the critical gap between backend failure conditions and consumer user experience. When errors occur in Phoenix (e.g. Ollama daemon stopped, local model not pulled, SQLite database busy, port collision, or cloud API key expired), Phoenix must never leave the user staring at raw stack traces, generic "thinking problem" messages, or unhandled promise errors.

### The Guiding Principle: Every Error Must Provide an Honest Explanation and a Clear Way Forward
1. **Plain English, Zero Jargon:** No `ECONNREFUSED`, `SQLITE_BUSY`, `EADDRINUSE`, or `404 Not Found` shown to the user as raw text.
2. **One-Click Recovery:** Whenever Phoenix knows how to fix the issue (e.g., wake up Ollama, trigger a missing model download, retry a locked database operation), it must provide a primary button that executes that fix directly.
3. **No Silent Surprises:** Phoenix must never silently bypass user choices (e.g., silently routing prompts to cloud providers when local Ollama is asleep).
4. **Collapsible Technical Details:** Diagnostics are preserved for debugging or bug reporting, sanitized of personal directories, usernames, and secret tokens.

---

## 2. Architecture & Design Specifications

### A. Normalized Error Card Schema (`HumanErrorCard`)
Every humanized error conforms to the following standardized data contract:

```typescript
interface HumanErrorCard {
  code: string;                 // Normalized error code (e.g. 'LOCAL_AI_OFFLINE')
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;                // Short, reassuring title (e.g. 'Local AI Engine is Sleeping')
  description: string;          // 1-2 sentence plain-language explanation
  primary_action?: {
    label: string;              // e.g. 'Wake Up Local AI'
    action_type: 'api_call' | 'navigate' | 'retry' | 'copy';
    endpoint?: string;          // e.g. '/api/v1/ollama/start'
    method?: 'GET' | 'POST';
    body?: Record<string, any>;
    target?: string;            // for navigation, e.g. '/settings'
  };
  secondary_action?: {
    label: string;              // e.g. 'Open Settings'
    action_type: 'api_call' | 'navigate' | 'retry' | 'dismiss';
    target?: string;
  };
  technical_details: {
    raw_message: string;        // Sanitized error string
    code?: string;              // OS / library error code
    subsystem: string;          // 'ollama' | 'database' | 'cloud' | 'network' | 'supervisor'
    timestamp: string;          // ISO 8601 string
    sanitized_stack?: string;   // Scrubbed call stack (stripped of PII)
  };
}
```

---

### B. Core Module Specification: `service/src/error-humanizer.js`

```javascript
/**
 * Maps raw errors, HTTP statuses, and system codes to HumanErrorCard objects.
 * Sanitizes all output to prevent leakage of paths, usernames, and API tokens.
 */
export function humanizeError(err, context = {}) { ... }
export function sanitizeDiagnostics(text) { ... }
```

#### Sanitization Rules:
1. **User Directories:** Replace `C:\Users\<username>\...` and `%USERPROFILE%` with `~` or `<phoenix-home>`.
2. **API Keys & Secrets:** Match patterns like `sk-ant-[a-zA-Z0-9_\-]+`, `gsk_[a-zA-Z0-9_\-]+`, and `Bearer [a-zA-Z0-9_\.\-]+` and replace with `[REDACTED_API_KEY]`.
3. **Internal Tokens:** Redact password hashes, auth session tokens, and database keys.

---

### C. Backend API Integration Plan

1. **Express Centralized Error Middleware (`service/src/server.js`)**:
   - Register a standardized 4-argument Express error handler at the bottom of `server.js`:
     ```javascript
     app.use((err, req, res, next) => {
       const humanCard = humanizeError(err, { path: req.path, method: req.method });
       res.status(err.status || 500).json({
         ok: false,
         error: humanCard.description,
         human_error: humanCard
       });
     });
     ```
2. **Chat & Stream Routes (`service/src/routes/api.js`)**:
   - Update `POST /api/v1/chat` catch block:
     When an LLM failure occurs, attach `human_error: humanizeError(err, { subsystem: 'chat' })` to the response payload.
   - Update `GET /api/v1/chat/stream`:
     When a streaming failure occurs, emit an event of type `error` or `done` carrying `result.human_error = humanizeError(err)`.
3. **Readiness System Integration (`service/src/readiness.js`)**:
   - When a component is `NEEDS_ACTION` or `ERROR`, attach a corresponding `recovery_action` or `human_error` card so the UI can render standard recovery controls directly from readiness checks.

---

### D. Frontend UI Integration Plan

1. **Reusable Component: `service/dashboard/src/lib/components/HumanErrorCard.svelte`**:
   - Clean Svelte 5 component with:
     - Warning/Error badge with intuitive iconography.
     - Title and description.
     - Primary button that executes the recovery action (with loading spinner and success notification).
     - Secondary button for alternatives.
     - Accordion `<details><summary>Technical Details</summary><pre>` with a "Copy Diagnostics" button.
2. **Dashboard Disconnect Banner (`service/dashboard/src/routes/+layout.svelte`)**:
   - When `serverStatus === 'offline'`, render a floating recovery banner:
     "Phoenix Service Disconnected" + [Reconnect] button.
3. **Chat Failure Integration (`service/dashboard/src/routes/terminal/+page.svelte` & `comms/+page.svelte`)**:
   - When a chat message fails (e.g. Ollama offline), render the `HumanErrorCard` inside the conversation view with the one-click `[Wake Up Local AI]` or `[Download Model]` button.

---

## 3. Preservation & Compatibility Constraints

1. **External Ollama Preservation (`EXTERNAL_UNMANAGED`):**
   - The error humanizer's "Wake Up Local AI" action calls `POST /api/v1/ollama/start` which executes `startOllamaDaemon()` in `ollama-manager.js`.
   - It will **NEVER** kill existing processes or call `taskkill`.
2. **Strict Local Mode & Zero Fake Readiness:**
   - Error humanization provides truth and clarity. It will **NEVER** fabricate a successful message or substitute a model without user consent.
   - It will **NEVER** silently fall back to cloud AI when local AI is selected.
3. **Backward Compatibility for Tests:**
   - All API endpoints continue to provide the legacy `error` string field alongside the new `human_error` card object. All 15 existing unit tests will continue to pass.

---

## 4. Required Changes by Subsystem

### Backend Changes (`service/src/`)
- **[NEW]** `service/src/error-humanizer.js`: Core error classification, normalization, and sanitization module.
- **[MODIFY]** `service/src/server.js`: Mount global Express error middleware; standardize error responses.
- **[MODIFY]** `service/src/routes/api.js`: Attach `human_error` to chat endpoints and streaming error events.
- **[MODIFY]** `service/src/router.js`: Propagate `human_error` on router exceptions.

### Frontend Changes (`service/dashboard/src/`)
- **[NEW]** `service/dashboard/src/lib/components/HumanErrorCard.svelte`: Reusable UI card with actions and collapsible diagnostics.
- **[MODIFY]** `service/dashboard/src/routes/+layout.svelte`: Global service disconnect banner with reconnect trigger.
- **[MODIFY]** `service/dashboard/src/routes/comms/+page.svelte`: Render humanized card on voice/chat turn failures.
- **[MODIFY]** `service/dashboard/src/lib/api.js`: Expose parsed `human_error` on API exceptions.

### Database Changes
- **NONE.** Zero schema changes required. All humanization logic is stateless or consumes existing settings and readiness state.

### Tauri / Desktop Shell Changes
- **NONE.** The existing Tauri supervisor in `backend.rs` already emits `backend-state-changed` and logs to `desktop.log`. The WebView2 frontend will receive and display the humanized recovery cards.

---

## 5. Risk Analysis

| Risk | Severity | Affected Component | Mitigation |
|---|:---:|---|---|
| **Masking Critical Errors** (user doesn't realize something failed) | Medium | `error-humanizer.js` | Every card clearly displays severity (`warning`/`error`) and preserves raw sanitized logs in the collapsible accordion. |
| **Recovery Action Loops** (repeated failed auto-fixes) | Medium | UI & recovery buttons | Recovery buttons disable after click, show a loading spinner, and report clean failure if the recovery action itself fails. |
| **Accidental PII Leak in Diagnostics** | High | Sanitizer | Thorough regex scrubbing for Windows usernames, home paths, and API token signatures (`sk-ant-`, `Bearer`, etc.). |
| **Breaking Existing Test Assertions** | Low | `server.js`, `api.js` | Preserve all existing top-level properties (`{ ok: false, error: err.message, human_error: ... }`). |

---

## 6. Testing Plan

### A. Automated Unit Tests (`service/src/__tests__/error-humanizer.test.js`)
1. Verify mapping of `ECONNREFUSED 11434` to `LOCAL_AI_OFFLINE` card with `POST /api/v1/ollama/start` action.
2. Verify mapping of `Ollama 404` to `MODEL_NOT_DOWNLOADED` card with download action.
3. Verify mapping of `SQLITE_BUSY` to `DATABASE_BUSY` card with retry action.
4. Verify mapping of `401 Unauthorized` to `CLOUD_AUTH_ERROR` card with settings navigation action.
5. Verify sanitization function strips usernames, `%USERPROFILE%`, and API keys from stack traces.

### B. Integration Tests
1. Verify `POST /api/v1/chat` returns HTTP 500 with both `error` and `human_error` when Ollama is stopped.
2. Verify `GET /api/v1/chat/stream` emits humanized error frame on failure.

### C. Regression Verification
1. Re-run all 7 existing unit test suites (`node --test src/__tests__/*.test.js`).
2. Run `test-acceptance-phase3.js` to confirm all 3 Phase 3 criteria remain 100% satisfied.

### D. Production Executable Verification
1. Build Tauri release binary (`Phoenix.exe`) and test on Windows desktop.
2. Manually trigger an Ollama-stopped state and verify the consumer error card appears with a functional "Wake Up Local AI" button.

---

## 7. Acceptance Criteria

1. **Deterministic Error Mapping:**
   - `ECONNREFUSED 11434` MUST map to a card titled "Local AI Engine is Sleeping" with a primary action that calls `/api/v1/ollama/start`.
   - `Ollama 404: model not found` MUST map to a card titled "AI Model Needs Download" with a primary action that calls `/api/v1/ollama/pull`.
   - `SQLITE_BUSY` MUST map to a card titled "Memory is Saving Notes" with a retry action.
2. **Zero PII / Secret Leaks in UI Diagnostics:**
   - Collapsible technical details MUST NEVER display raw Windows usernames, user home directories, or API keys (`sk-ant-`, `Bearer`, etc.).
3. **One-Click Recovery Action Functionality:**
   - Clicking "Wake Up Local AI" on a stopped Ollama instance successfully attaches to Ollama and transitions the UI back to ready without manual command-line intervention.
4. **Phase 3 Zero Regression:**
   - Phoenix never force-kills external Ollama processes.
   - Readiness truth is strictly maintained.
   - Strict local AI mode never falls back to cloud silently.
   - All 15 existing unit tests pass with 0 failures.

---

## 8. Implementation Sequence (Step-by-Step)

```text
Step 1: Create service/src/error-humanizer.js with mapping tables and PII sanitizers.
Step 2: Add comprehensive unit tests in service/src/__tests__/error-humanizer.test.js.
Step 3: Integrate error humanizer into service/src/server.js Express error middleware.
Step 4: Update service/src/routes/api.js (/chat and /chat/stream) to return human_error.
Step 5: Create service/dashboard/src/lib/components/HumanErrorCard.svelte.
Step 6: Integrate HumanErrorCard into dashboard layout and chat interfaces.
Step 7: Re-compile frontend bundle (npm run build).
Step 8: Execute all automated test suites and verify 100% pass rate.
Step 9: Compile release binary Phoenix.exe and place in "the final exe file/".
Step 10: Perform end-to-end acceptance verification and present walkthrough.
```

---

## 9. Rollback Plan

If Phase 4 introduces regressions:
1. `service/src/error-humanizer.js` is an additive module. Reverting `server.js` and `api.js` error handling returns the system to the exact Phase 3 baseline.
2. No database migrations were executed, so database rollback is unnecessary.
3. The previous release binary of `Phoenix.exe` (Phase 3 baseline, 18,442,752 bytes) can be restored immediately.
