# Phoenix Phase 3: Ollama & Local AI Deep Codebase Audit

**Date:** 2026-09-08  
**Scope:** Complete architectural and code-level audit of the existing Ollama and local AI implementation across the entire Phoenix repository (`service/src`, `service/dashboard`, `service/tauri`, SQLite schemas, and background workers).  
**Objective:** Ground Phase 3 productization in verified repository reality to turn local AI setup into a seamless consumer experience for non-technical Windows users.

---

## 1. Inventory of Every Existing Ollama Integration

### A. Detection & Reachability Probing
- **`service/src/readiness.js` (`probeOllamaHttp`)**:
  - Sends `GET ${url}/api/tags` with a 1,200ms timeout via `AbortSignal.timeout(1200)`.
  - Parses `.models[]` and returns `{ reachable: true, models: [...] }` or `{ reachable: false, models: [] }`.
  - Default URL is `process.env.PHOENIX_OLLAMA_URL || 'http://127.0.0.1:11434'`.
- **`service/src/db.js` (`getOllamaUrl`)**:
  - Hierarchical resolution:
    1. `PHOENIX_OLLAMA_URL` environment variable.
    2. `settings` table key `ollama_url`.
    3. Auto-discovery of remote devices enrolled via Tailscale with reported service `ollama: up` (cached for 30 seconds).
    4. Fallback: `http://localhost:11434`.
- **`service/src/server.js` (`autoDetectLocalModels`)**:
  - At server startup, probes `getOllamaUrl() + '/api/tags'` with a 3,000ms timeout.
  - If successful, converts detected models into an array and writes to `settings` table under `custom_models`.
- **`service/src/routes/dashboard.js` (`getDashboardSnapshot`)**:
  - Periodically polls `getOllamaUrl() + '/api/tags'` with a 4,000ms timeout.
  - Populates dashboard service tile for `Ollama` (`up` or `down`).
- **`service/src/steward.js`**:
  - Registers service `id: 'ollama'`, `healthCheck: 'url'`, `healthEndpoint: '/api/tags'`. Probes every interval.

### B. Binary Detection
- **`service/src/readiness.js` (`isOllamaBinaryInstalled`)**:
  - Checks if `%LOCALAPPDATA%\Programs\Ollama\ollama.exe` exists on Windows.
  - If missing, executes `where ollama` (Windows) or `which ollama` (Unix) with a 1,500ms timeout.
  - Returns `true` if found, `false` otherwise.
- **`service/src/memory/ollama-boot.js` (`isOllamaInstalled`)**:
  - Executes `execSync('ollama --version', { stdio: 'pipe', timeout: 3000, windowsHide: true })`.

### C. Process Startup & Shutdown
- **`service/src/memory/ollama-boot.js` (`startOllama`, `ensureOllama`)**:
  - `startOllama()` originally spawned `ollama serve` with `detached: true, stdio: 'ignore', shell: true`.
  - **CRITICAL FINDING: DISABLED DEAD CODE.** Lines 88–91:
    ```javascript
    // DISABLED: Ollama auto-start causes RAM exhaustion. Using keyword fallback only.
    async function ensureOllama() {
      console.log('[Phoenix Memory] Ollama auto-start DISABLED (RAM protection) — using keyword fallback');
    }
    ```
- **`service/src/steward.js` (lines 213–219)**:
  - `startFn: null, stopFn: null`. Comment states:
    `// #470: startFn was a no-op that printed "auto-start disabled" on every restart attempt and falsely transitioned the service to STARTING -> DOWN in a loop. Setting startFn: null short-circuits the auto-restart loop... Ollama recovery now relies on the external ollama serve process being up.`
- **Windows Ollama Process Architecture**:
  - On Windows, official Ollama runs as a background tray application (`ollama app.exe`) installed in `%LOCALAPPDATA%\Programs\Ollama`.
  - When active, it manages its own internal `ollama.exe serve` worker listening on `127.0.0.1:11434`.
  - Many users already have Ollama running independently before starting Phoenix.
  - **Result:** Phoenix currently has zero active code to detect if an external instance is running, cannot start one if stopped, and lacks lifecycle ownership rules.

### D. Model Discovery & Cataloging
- **Ollama HTTP API (`/api/tags`)**:
  - Used in `readiness.js`, `server.js`, `dashboard.js`, `embeddings.js`, `ollama-boot.js`.
  - Returns array of installed model objects containing `name`, `model`, `size`, `digest`, `details` (format, family, parameter_size, quantization_level).
- **Download/Pull Semantics (`/api/pull`)**:
  - Ollama's `/api/pull` accepts `{"name": "...", "stream": true}` and emits newline-delimited JSON chunks.
  - **Cancellation vs. Pause/Resume:** Ollama has **no pause API endpoint**. Aborting the HTTP connection terminates the pull stream on the server. However, Ollama commits completed layer digests (`sha256:*`) to its local blob store (`%USERPROFILE%\.ollama\models\blobs\`). Starting a pull for the same model again verifies existing blobs and only downloads remaining layers. Claiming byte-level "pause/resume" is technically inaccurate; the accurate capability is **safe cancellation** with native layer-level caching on restart.

### E. Model Selection & Configuration Storage
- **`model_selections` Table (`service/src/db.js:931`)**:
  - Schema:
    ```sql
    CREATE TABLE IF NOT EXISTS model_selections (
      purpose TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      dim INTEGER,
      context_window INTEGER,
      notes TEXT,
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );
    ```
  - Hardcoded Seeds:
    - `embedding` -> `ollama@local`, `qwen3-embedding:0.6b` (dim 1024)
    - `chat_local` -> `ollama@local`, `gemma4:e2b` (context 131072)
    - `vision` -> `ollama@local`, `gemma4:e2b`
    - `reasoning_cloud` -> `cerebras`, `qwen-3-235b`
    - `chat_cloud_fallback` -> `anthropic`, `claude-haiku-4-5-20251001`
- **Helpers**:
  - `getModelForPurpose(purpose)`: Reads matching row from `model_selections`.
  - `setModelForPurpose(purpose, provider, model, options)`: Upserts row.
  - `listModelSelections()`: Returns all rows.

### F. Generation & Chat Calls
- **Text Chat (`service/src/llm.js:749`)**:
  - When `provider === 'ollama'` (prefixed as `ollama:<model>` by `llm-fallback.js`):
    ```javascript
    const resp = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: { num_predict: maxTokens }
      }),
      signal: controller.signal
    });
    ```
- **Vision Analysis (`service/src/llm.js:924`)**:
  - Calls `POST ${ollamaUrl}/api/generate` with:
    `{ model: visionModel, prompt, images: allImages, stream: false, keep_alive: -1, options: { num_gpu: 0 } }`.
- **Embeddings (`service/src/memory/embeddings.js:102`)**:
  - Calls `POST ${url}/api/embeddings` with:
    `{ model, prompt: text.slice(0, 8000), keep_alive: -1 }`.

### G. Error Handling & Fallbacks
- **`service/src/llm-fallback.js`**:
  - Retries on network errors (`ECONNREFUSED`, `ETIMEDOUT`, `fetch failed`), 5xx, or internal attempt abort.
  - Default chain for `background`: `[chat_local, reasoning_cloud]`.
  - Default chain for `voice`: `[reasoning_cloud, chat_cloud_fallback, chat_local]`.
  - Attempt timeout for Ollama is `75_000ms` (75s).
- **`service/src/memory/embeddings.js`**:
  - If Ollama is unreachable or lacks the exact embedding model (`qwen3-embedding:0.6b`), silently falls back to `embedFallback(text)` (deterministic hash-based keyword pseudo-embedding) and SQLite FTS.

---

## 2. Failure Mode Analysis (Current Behavior)

| Scenario | What Phoenix Currently Does | User Experience Impact |
|---|---|---|
| **Ollama is not installed** | `probeOllamaHttp` fails, `isOllamaBinaryInstalled` returns `false`. `readiness.js` reports `local_ai: UNAVAILABLE` ("Ollama engine not installed on this computer"). `llm.js` throws `fetch failed` (ECONNREFUSED). `embeddings.js` falls back to FTS. | **Blocking**: User is shown a red/grey badge in setup/dashboard with zero instructions or install mechanisms. Non-technical user is stranded. |
| **Ollama is installed but stopped** | `probeOllamaHttp` fails, `isOllamaBinaryInstalled` returns `true`. `readiness.js` reports `local_ai: NEEDS_ACTION` ("Ollama is installed but not running on port 11434"). All calls fail with ECONNREFUSED. `ollama-boot.js` is disabled. | **Blocking**: User has no way to start Ollama from within the desktop app. Must know how to open Windows Command Prompt and type `ollama serve`. |
| **Ollama is running with no models** | `probeOllamaHttp` returns `{ reachable: true, models: [] }`. `readiness.js` marks `local_ai: READY` but `selected_model: NEEDS_ACTION` ("Ollama is running but has no AI models installed"). Chat/vision calls return HTTP 404 from Ollama (`model '...' not found`). | **Broken**: No download UI exists in Phoenix. App throws runtime errors during chat. |
| **Ollama is running with models, but selected model is missing** | `readiness.js` checks if any installed model matches families (`gemma4`, `llama`, `qwen`, `mistral`). If found, it **falsely claims** in readiness `Using <model> (substituted)`. However, `llm.js` passes the un-substituted model name directly to `/api/chat` and Ollama responds with HTTP 404! | **Deceptive/Broken**: UI says the model is ready, but all actual AI queries crash with HTTP 404. |
| **Model download fails** | The only download code is the dead `pullModel()` in `ollama-boot.js`, which uses `stream: false` with a 5-minute timeout. If it fails, it logs `console.error` and returns `false`. | **No Recovery**: No retry, no user notification, no disk space check. |
| **Ollama becomes unavailable/crashes during runtime** | `fetch` fails with `ECONNREFUSED`. `llm-fallback.js` catches error and attempts cloud fallbacks (if configured). If no cloud key, request throws. `embeddings.js` falls back to keyword hash. `steward.js` logs service transition to `down`. | **Silent Degradation**: Phoenix does not attempt to restart the daemon. |
| **Ollama takes a long time to start / load model** | On CPU inference, cold-loading a 4GB model takes 15–60s. `llm-fallback.js` gives 75s. But `embeddings.js:100` has a **3-second timeout**! The embedding call times out and permanently evicts semantic search for that session. | **Performance Defect**: Embeddings fail prematurely while Ollama is warming up. |

---

## 3. Current AI Settings & UI Audit

### A. Settings Page (`service/dashboard/src/routes/settings/+page.svelte`)
- Tab `activeTab === 'ai'` exposes:
  1. **Terminal AI**: Dropdowns for Claude Code, Gemini CLI, Aider, Copilot, plus a raw command template input (`e.g. gemini --model pro`).
  2. **Server API Model**: A bare text input (`placeholder="e.g. claude-haiku-4-5-20251001"`).
  3. **Phone AI**: Gemini API key input.
  4. **Job Models**: 5 raw text inputs for individual job types.
  5. **Model Providers (Custom Models)**: Form with 5 raw inputs: Display Name, Provider Type ("ollama, lmstudio"), Base URL ("http://localhost:11434"), Model ID ("llama3.2:8b"), API Key.
- **Flaws**:
  - Utterly unusable for a normal consumer. Requires memorizing model strings, URLs, and port numbers.
  - Zero presence of Ollama daemon controls (no Start, Stop, Check, or Download buttons).
  - No display of installed Ollama models.

### B. Onboarding Page (`service/dashboard/src/routes/setup/+page.svelte`)
- Step 3 ("Choose Your AI Engine"):
  - Allows selecting radio option "Local AI (Ollama)".
  - Notes: "Runs open-weight models locally on this PC via Ollama (127.0.0.1:11434)... Requires ~4 GB to 8 GB of available RAM".
  - Does NOT check whether Ollama is installed or running when selected.
  - Does NOT offer to install Ollama or pull models.
- Step 7 ("System Readiness Check"):
  - Displays badges from `/api/v1/readiness`.
  - If Ollama is missing or stopped, displays a static `NEEDS_ACTION` badge with zero actionable buttons.

---

## 4. Current `readiness.js` Audit

### A. `local_ai` Component
- Evaluates:
  - If mode is `cloud` or `keyword` -> `DISABLED`.
  - If `ollamaProbe.reachable` -> `READY` (`Ollama active at ... (N models installed)`).
  - If `ollamaInstalled` -> `NEEDS_ACTION` (`Ollama is installed but not running on port 11434`).
  - Else -> `UNAVAILABLE` (`Ollama engine not installed on this computer`).
- **Verdict**: The `local_ai` component states are structurally accurate regarding reachability and binary presence, but lack lifecycle controls (cannot initiate an install or launch).

### B. `selected_model` Component
- **Critical Flaw 1**: False Substitution Claim:
  ```javascript
  const hasModel = ollamaProbe.models.some(m =>
    m.startsWith('gemma4') || m.startsWith('llama') || m.startsWith('qwen') || m.startsWith('mistral')
  );
  if (hasModel) {
    components.selected_model = {
      label: 'Selected AI Model',
      status: 'READY',
      message: `Local model ready (${ollamaProbe.models[0]})`,
      details: { active_model: ollamaProbe.models[0] },
    };
  }
  ```
  It picks `ollamaProbe.models[0]` regardless of whether it is an embedding model (e.g. `qwen3-embedding`), a vision model, or a text chat model.
- **Critical Flaw 2**: Runtime Desynchronization:
  Even though `readiness.js` displays `Local model ready (llama3.2:1b)`, the database `model_selections` table still contains `gemma4:e2b`. When the user enters the app and chats, `llm.js` queries `gemma4:e2b` and fails!

---

## 5. Feasibility of Consumer Actions

| Capability | Feasible? | Technical Mechanism on Windows | Safety & Caveats |
|---|---|---|---|
| **Detect existing Ollama** | **YES** | 1. Check `%LOCALAPPDATA%\Programs\Ollama\ollama.exe` and `%ProgramFiles%\Ollama\ollama.exe`.<br>2. Run `where ollama`.<br>3. Check running process `Get-Process ollama`.<br>4. HTTP probe `127.0.0.1:11434/api/version`. | Completely safe and fast (<50ms). |
| **Start / Launch Ollama** | **YES** | Execute `ollama.exe serve` (background daemon) or launch `%LOCALAPPDATA%\Programs\Ollama\ollama app.exe` (tray application). | Must launch detached and prevent duplicate processes. Must verify port 11434 opens within 10s. |
| **Guide through Installation** | **YES** | 1. Provide a one-click automated download & execution of official `OllamaSetup.exe` from `https://ollama.com/download/OllamaSetup.exe`.<br>2. Support `winget install Ollama.Ollama` fallback.<br>3. Provide clear step-by-step Windows UAC guidance.<br>4. Live-poll for installation completion. | Safe. Requires standard Windows user consent (UAC prompt from official Ollama installer). |
| **Download a Model** | **YES** | Send `POST http://127.0.0.1:11434/api/pull` with `{"name": "...", "stream": true}`. Read streaming NDJSON response containing `total`, `completed`, and `status`. | Must check disk space first. Must show progress bar and MB/GB to user. Never download silently. |
| **Select a Model** | **YES** | Update `model_selections` table (`chat_local`, `embedding`, `vision`) in `phoenix.db`. Sync with `custom_models` setting. | Must validate that the model exists in Ollama's local catalog before setting. |
| **Verify Model Execution** | **YES** | Send minimal non-streaming prompt `{"model": "...", "messages": [{"role": "user", "content": "Respond with 1 word: OK"}], "stream": false}` to `/api/chat`. | Verifies both model weight integrity and RAM execution. Timeout after 20s. |

---

## 6. Audit of Incomplete, Misleading, and Developer-Only Code

1. **`service/src/memory/ollama-boot.js`**:
   - `ensureOllama()` is an empty stub.
   - Hardcoded models (`qwen3-embedding`, `qwen3:4b`, `qwen2.5vl:3b`) are obsolete or absent.
   - `pullModel()` blocks for 5 minutes with `stream: false` and no progress feedback.
2. **`service/src/db.js` Seeds**:
   - `model_selections` defaults to `gemma4:e2b` for chat and vision, which does not exist in standard Ollama libraries.
3. **`service/src/readiness.js` Heuristics**:
   - Fabricates that a fallback model was "substituted" without updating `model_selections` or `llm.js`.
4. **`service/dashboard/src/routes/settings/+page.svelte`**:
   - Requires manual entry of CLI strings, ports, and JSON custom models.
5. **`service/src/steward.js`**:
   - Marked `startFn: null`, relying entirely on external process state without recovery.

---

## 7. Explicit Technical Restrictions (What MUST NOT Be Implemented)

1. **DO NOT bundle multi-gigabyte Ollama binaries or GGUF model weights into the `Phoenix.exe` installer**:
   - Would bloat Phoenix installer from 18 MB to 5–10 GB.
   - Violates desktop modularity. Phoenix is a lightweight desktop shell and supervisor, not an AI runtime distribution.
2. **DO NOT silently auto-download large AI models without explicit user consent**:
   - Models are 1.3 GB to 5 GB+. Silently pulling them consumes metered network data, fills storage, and slows system performance.
   - Always display exact download size (e.g. "Llama 3.2 1B — 1.3 GB download, requires ~2.5 GB RAM") and require the user to click "Download".
3. **DO NOT attempt to pull or run models exceeding system RAM**:
   - Loading an 8B or 14B model on an 8GB machine causes aggressive swapping, Windows freezing, and OOM crashes.
   - The system must detect available system RAM and recommend lightweight models (1B–3B) for standard machines.
4. **DO NOT kill or interfere with foreign Ollama instances**:
   - If a developer is already running Ollama with existing models, do not terminate their background processes or overwrite unrelated models.
5. **DO NOT claim 100% Private Local AI if fallback or cloud is active**:
   - If local AI is down or unconfigured, Phoenix must clearly state "Cloud Fallback" or "Keyword Search Active" and never mislead the user.
6. **DO NOT expose secrets or modify local-only memory architecture**:
   - SQLite DB (`phoenix.db`) and SQLCipher key remain strictly local.
