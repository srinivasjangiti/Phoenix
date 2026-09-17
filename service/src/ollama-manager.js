// Phoenix Ollama Manager — Consumer Lifecycle, Installation & Model Engine
//
// Governs local Ollama detection, on-demand starting, user-controlled installation,
// streaming model downloads with cancellation, model verification, and honest readiness.

import { spawn, execSync } from 'child_process';
import { existsSync, createWriteStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { getOllamaUrl, getModelForPurpose, setModelForPurpose, run, get } from './db.js';
import { RECOMMENDED_MODELS, getDefaultRecommendedModel } from './models-catalog.js';

let _ownership = 'UNKNOWN'; // 'EXTERNAL_UNMANAGED' | 'PHOENIX_MANAGED'
let _phoenixSpawnedPid = null;
let _activePull = null; // { model, status, completed, total, percent, speed, startedAt, abortController }

/**
 * Locate the Ollama binary on Windows / PATH.
 */
export function getOllamaBinaryPath() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const progFiles = process.env.ProgramFiles || 'C:\\Program Files';

  const candidates = [
    join(localAppData, 'Programs', 'Ollama', 'ollama.exe'),
    join(progFiles, 'Ollama', 'ollama.exe'),
    join(localAppData, 'Programs', 'Ollama', 'ollama app.exe'),
  ];

  for (const c of candidates) {
    if (existsSync(c)) return c;
  }

  // Fallback: check PATH via `where` or `which`
  try {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? 'where ollama' : 'which ollama';
    const out = execSync(cmd, { stdio: 'pipe', timeout: 1500, windowsHide: true })
      .toString()
      .trim()
      .split(/\r?\n/)[0];
    if (out && existsSync(out)) return out;
  } catch {}

  return null;
}

/**
 * Check if Ollama HTTP API is reachable.
 */
export async function probeOllamaHttp(url = getOllamaUrl(), timeoutMs = 1500) {
  try {
    const cleanUrl = url.replace(/\/$/, '');
    const res = await fetch(`${cleanUrl}/api/tags`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { reachable: false, models: [], version: null };
    const data = await res.json();
    const models = Array.isArray(data.models) ? data.models : [];

    let version = null;
    try {
      const vRes = await fetch(`${cleanUrl}/api/version`, {
        signal: AbortSignal.timeout(800),
      });
      if (vRes.ok) {
        const vData = await vRes.json();
        version = vData.version || null;
      }
    } catch {}

    return {
      reachable: true,
      url: cleanUrl,
      version,
      models: models.map(m => ({
        name: m.name || m.model,
        size: m.size || 0,
        modifiedAt: m.modified_at,
        details: m.details || {},
      })),
    };
  } catch (err) {
    return { reachable: false, models: [], version: null, error: err.message };
  }
}

/**
 * Comprehensive Ollama status for UI and readiness state machine.
 */
export async function getOllamaStatus() {
  const probe = await probeOllamaHttp();
  const binaryPath = getOllamaBinaryPath();
  const installed = !!binaryPath;

  let state = 'not_installed';
  let ownership = _ownership;

  if (probe.reachable) {
    state = probe.models.length > 0 ? 'ready' : 'running_no_models';
    if (_ownership === 'UNKNOWN') {
      // It was already running before Phoenix or managed externally
      ownership = 'EXTERNAL_UNMANAGED';
      _ownership = ownership;
    }
  } else if (installed) {
    state = 'installed_stopped';
  } else {
    state = 'not_installed';
  }

  // Active configured model
  let selectedModel = null;
  try {
    const sel = getModelForPurpose('chat_local');
    if (sel?.model) selectedModel = sel.model;
  } catch {}

  // Check if selected model is verified present in Ollama catalog
  let selectedModelInstalled = false;
  let selectedModelDetails = null;
  if (probe.reachable && selectedModel) {
    const match = probe.models.find(m => m.name === selectedModel);
    if (match) {
      selectedModelInstalled = true;
      selectedModelDetails = match;
    }
  }

  return {
    state, // 'not_installed' | 'installed_stopped' | 'running_no_models' | 'ready'
    installed,
    running: probe.reachable,
    reachable: probe.reachable,
    binaryPath,
    url: probe.url || getOllamaUrl(),
    version: probe.version,
    ownership,
    models: probe.models,
    installedModels: probe.models,
    selectedModel,
    selected: { model: selectedModel, sizeBytes: selectedModelDetails?.size || 0 },
    selectedModelInstalled,
    selectedModelDetails,
    pulling: _activePull ? {
      model: _activePull.model,
      status: _activePull.status,
      completed: _activePull.completed,
      total: _activePull.total,
      percent: _activePull.percent,
    } : null,
    recommended: RECOMMENDED_MODELS,
    recommendedModels: RECOMMENDED_MODELS,
  };
}

/**
 * Start the local Ollama daemon on demand.
 * Will NEVER attempt to start if an instance is already listening.
 */
export async function startOllamaDaemon() {
  const current = await probeOllamaHttp();
  if (current.reachable) {
    _ownership = 'EXTERNAL_UNMANAGED';
    return { ok: true, message: 'Ollama is already running and accessible', alreadyRunning: true };
  }

  const binary = getOllamaBinaryPath();
  if (!binary) {
    return { ok: false, error: 'Ollama binary not found. Please install Ollama first.' };
  }

  try {
    console.log(`[OllamaManager] Launching on-demand Ollama daemon: "${binary}" serve`);
    const child = spawn(binary, ['serve'], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.unref();

    _phoenixSpawnedPid = child.pid;
    _ownership = 'PHOENIX_MANAGED';

    // Poll until port responds (up to 15 seconds)
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 600));
      const check = await probeOllamaHttp();
      if (check.reachable) {
        console.log(`[OllamaManager] Daemon online at ${check.url}`);
        return { ok: true, message: 'Ollama started successfully', pid: _phoenixSpawnedPid };
      }
    }

    return { ok: false, error: 'Timed out waiting for Ollama service to respond on port 11434' };
  } catch (err) {
    console.error('[OllamaManager] Failed to spawn Ollama:', err);
    return { ok: false, error: `Failed to launch Ollama: ${err.message}` };
  }
}

/**
 * Launch the official Ollama Windows installer.
 * User controls the Windows UAC confirmation dialog.
 */
export async function launchOfficialInstaller() {
  const installerUrl = 'https://ollama.com/download/OllamaSetup.exe';
  const targetPath = join(tmpdir(), 'OllamaSetup.exe');

  console.log(`[OllamaManager] Fetching official installer from ${installerUrl}...`);

  try {
    const res = await fetch(installerUrl);
    if (!res.ok) {
      throw new Error(`Download failed with HTTP status ${res.status}`);
    }

    // Save installer to disk
    const dest = createWriteStream(targetPath);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    dest.write(buffer);
    dest.end();

    await new Promise((resolve, reject) => {
      dest.on('finish', resolve);
      dest.on('error', reject);
    });

    console.log(`[OllamaManager] Installer saved to ${targetPath}. Spawning process...`);

    // Launch official installer with standard user execution
    const installerProc = spawn(targetPath, [], {
      detached: true,
      stdio: 'ignore',
    });
    installerProc.unref();

    return {
      ok: true,
      message: 'Official Ollama installer launched. Please accept the Windows prompt to complete setup.',
      path: targetPath,
    };
  } catch (err) {
    console.warn('[OllamaManager] Direct installer download error, falling back to browser:', err.message);
    // Fallback: open official download page in user's browser
    try {
      const openCmd = process.platform === 'win32'
        ? `start https://ollama.com/download/windows`
        : `xdg-open https://ollama.com/download`;
      execSync(openCmd, { stdio: 'ignore' });
      return {
        ok: true,
        fallback: true,
        message: 'Opened official Ollama download page in your browser. Please install and return here.',
      };
    } catch (openErr) {
      return { ok: false, error: `Unable to launch installer: ${err.message}` };
    }
  }
}

/**
 * Pull a model from Ollama with real-time NDJSON stream monitoring and cancellation.
 */
export async function pullModelStream(modelName) {
  if (_activePull && _activePull.active) {
    return { ok: false, error: `A download is already in progress for ${_activePull.model}` };
  }

  const cleanUrl = getOllamaUrl().replace(/\/$/, '');
  const abortController = new AbortController();

  _activePull = {
    active: true,
    model: modelName,
    status: 'connecting',
    completed: 0,
    total: 0,
    percent: 0,
    speed: '',
    startedAt: Date.now(),
    abortController,
  };

  try {
    const res = await fetch(`${cleanUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName, stream: true }),
      signal: abortController.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      _activePull = null;
      return { ok: false, error: `Ollama ${res.status}: ${errText || 'Failed to initiate download'}` };
    }

    // Process streaming NDJSON
    (async () => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const chunk = JSON.parse(line);
              if (_activePull) {
                _activePull.status = chunk.status || _activePull.status;
                if (typeof chunk.completed === 'number') _activePull.completed = chunk.completed;
                if (typeof chunk.total === 'number') _activePull.total = chunk.total;
                if (_activePull.total > 0) {
                  _activePull.percent = Math.round((_activePull.completed / _activePull.total) * 100);
                }
              }
            } catch {}
          }
        }

        console.log(`[OllamaManager] Model pull complete: ${modelName}`);
        // Auto-select downloaded model in database
        setModelForPurpose('chat_local', 'ollama@local', modelName);
      } catch (streamErr) {
        if (streamErr.name !== 'AbortError') {
          console.error('[OllamaManager] Pull stream error:', streamErr);
        }
      } finally {
        _activePull = null;
      }
    })();

    return { ok: true, message: `Download initiated for ${modelName}` };
  } catch (err) {
    _activePull = null;
    if (err.name === 'AbortError') {
      return { ok: true, canceled: true, message: 'Download canceled' };
    }
    return { ok: false, error: err.message };
  }
}

/**
 * Cancel an active model download.
 */
export function cancelActivePull() {
  if (_activePull && _activePull.abortController) {
    try {
      _activePull.abortController.abort();
    } catch {}
    const model = _activePull.model;
    _activePull = null;
    return { ok: true, message: `Canceled download for ${model}` };
  }
  return { ok: true, message: 'No active download to cancel' };
}

/**
 * Get active download progress.
 */
export function getActivePullProgress() {
  if (!_activePull) {
    return { active: false };
  }
  return {
    active: true,
    model: _activePull.model,
    status: _activePull.status,
    completed: _activePull.completed,
    total: _activePull.total,
    percent: _activePull.percent,
    elapsedMs: Date.now() - _activePull.startedAt,
  };
}

/**
 * Live test inference against a specific model to verify real execution.
 */
export async function testModelInference(modelName) {
  const cleanUrl = getOllamaUrl().replace(/\/$/, '');
  const startedAt = Date.now();

  try {
    const res = await fetch(`${cleanUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: 'Respond with the single word: READY' }],
        stream: false,
        options: { num_predict: 20 },
      }),
      signal: AbortSignal.timeout(20000), // 20s generous timeout for CPU warm-up
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { ok: false, error: `Ollama returned ${res.status}: ${errText}` };
    }

    const data = await res.json();
    const text = (data.message?.content || '').trim();
    const latencyMs = Date.now() - startedAt;

    return {
      ok: true,
      text,
      latencyMs,
      evalCount: data.eval_count || 0,
      promptEvalCount: data.prompt_eval_count || 0,
      message: `Verified successfully in ${latencyMs}ms`,
    };
  } catch (err) {
    return { ok: false, error: `Inference failed: ${err.message}` };
  }
}

/**
 * Select a local model and ensure it is valid.
 */
export async function selectLocalModel(modelName) {
  const probe = await probeOllamaHttp();
  if (!probe.reachable) {
    return { ok: false, error: 'Ollama is not running. Please start Ollama first.' };
  }

  const exists = probe.models.some(m => m.name === modelName);
  if (!exists) {
    return { ok: false, error: `Model "${modelName}" is not installed in Ollama.` };
  }

  const ok = setModelForPurpose('chat_local', 'ollama@local', modelName, {
    notes: 'Configured by Phoenix Local AI Manager',
  });

  if (ok) {
    // Sync into custom_models in settings
    try {
      const current = get("SELECT value FROM settings WHERE key = 'custom_models'");
      let arr = [];
      try { arr = JSON.parse(current?.value || '[]'); } catch {}
      if (!Array.isArray(arr)) arr = [];
      if (!arr.some(m => m.id === modelName)) {
        arr.push({
          id: modelName,
          name: modelName.split(':')[0] + ' (Local Ollama)',
          provider: 'ollama',
          url: getOllamaUrl(),
        });
        run("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('custom_models', :v, datetime('now','localtime'))", {
          ':v': JSON.stringify(arr),
        });
      }
    } catch {}

    return { ok: true, model: modelName, message: `Selected ${modelName} as local model` };
  }

  return { ok: false, error: 'Failed to update database model selection' };
}
