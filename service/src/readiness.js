/**
 * readiness.js — Centralized Readiness State Machine for Phoenix
 *
 * Evaluates the 8 core subsystems:
 *   1. core           (Phoenix Core)
 *   2. database       (Database)
 *   3. memory         (Memory)
 *   4. permissions    (Permissions & Senses)
 *   5. local_ai       (Local AI / Ollama Engine)
 *   6. selected_model (Selected AI Model)
 *   7. cloud_ai       (Cloud AI)
 *   8. devices        (Devices & Desktop Shell)
 *
 * Normalized States:
 *   READY | CHECKING | INSTALLING | NEEDS_ACTION | UNAVAILABLE | DISABLED | ERROR
 *
 * Truthful, factual reporting — no marketing language.
 */

import { get, all, run, DB_PATH } from './db.js';
import { hasSecret, secretSource } from './secrets.js';
import { getDataDir, isWindows } from './platform.js';
import { existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const OLLAMA_DEFAULT_URL = process.env.PHOENIX_OLLAMA_URL || 'http://127.0.0.1:11434';

/**
 * Check if Ollama HTTP API is reachable and fetch list of models.
 */
async function probeOllamaHttp(url = OLLAMA_DEFAULT_URL, timeoutMs = 1200) {
  try {
    const res = await fetch(`${url}/api/tags`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { reachable: false, models: [] };
    const data = await res.json();
    const models = Array.isArray(data.models) ? data.models.map(m => m.name) : [];
    return { reachable: true, models };
  } catch {
    return { reachable: false, models: [] };
  }
}

/**
 * Check whether Ollama binary exists on system disk or PATH.
 */
function isOllamaBinaryInstalled() {
  if (isWindows) {
    const localAppData = process.env.LOCALAPPDATA || '';
    const stdPath = join(localAppData, 'Programs', 'Ollama', 'ollama.exe');
    if (existsSync(stdPath)) return true;
  }
  try {
    const cmd = isWindows ? 'where ollama' : 'which ollama';
    execSync(cmd, { stdio: 'ignore', timeout: 800, windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Probe the 8 components and produce the normalized readiness report.
 */
export async function getReadinessState() {
  const components = {};

  // 1. Phoenix Core
  try {
    const uptimeSecs = Math.floor(process.uptime());
    components.core = {
      label: 'Phoenix Core',
      status: 'READY',
      message: `Operational (uptime: ${uptimeSecs}s, PID: ${process.pid})`,
      details: {
        version: '0.4.0',
        pid: process.pid,
        uptime_seconds: uptimeSecs,
        node_version: process.version,
      },
    };
  } catch (err) {
    components.core = {
      label: 'Phoenix Core',
      status: 'ERROR',
      message: `Core service fault: ${err.message}`,
      details: { error: err.message },
    };
  }

  // 2. Database
  let dbTablesCount = 0;
  try {
    const probe = get('SELECT 1 as alive');
    if (probe && probe.alive === 1) {
      const tables = all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      dbTablesCount = tables.length;
      components.database = {
        label: 'Database',
        status: 'READY',
        message: `Encrypted local SQLite operational (${dbTablesCount} tables)`,
        details: {
          path: DB_PATH,
          table_count: dbTablesCount,
          encrypted: true,
        },
      };
    } else {
      components.database = {
        label: 'Database',
        status: 'ERROR',
        message: 'Database query test failed',
        details: { path: DB_PATH },
      };
    }
  } catch (err) {
    components.database = {
      label: 'Database',
      status: 'ERROR',
      message: `Database connection error: ${err.message}`,
      details: { path: DB_PATH, error: err.message },
    };
  }

  // 3. Memory
  try {
    let memoryCount = 0;
    try {
      const row = get("SELECT COUNT(*) as c FROM memories");
      memoryCount = row?.c || 0;
    } catch {}

    components.memory = {
      label: 'Memory',
      status: 'READY',
      message: `Local memory vault ready (${memoryCount} items on this computer)`,
      details: {
        storage: 'Local SQLite (on this device)',
        item_count: memoryCount,
        sync_mode: 'local_only',
        cloud_sync_available: false,
      },
    };
  } catch (err) {
    components.memory = {
      label: 'Memory',
      status: 'ERROR',
      message: `Memory subsystem error: ${err.message}`,
      details: { error: err.message },
    };
  }

  // Settings lookup
  let settingsMap = {};
  try {
    const rows = all('SELECT key, value FROM settings');
    for (const r of rows) {
      try { settingsMap[r.key] = JSON.parse(r.value); } catch { settingsMap[r.key] = r.value; }
    }
  } catch {}

  const firstRunVal = settingsMap['first_run_complete'];
  const firstRunComplete = firstRunVal === '1' || firstRunVal === 1 || firstRunVal === true || firstRunVal === 'true';
  const aiChoice = settingsMap['ai_engine_choice'] || 'local'; // 'local' | 'cloud' | 'keyword'

  // 4. Permissions & Senses
  const permVal = settingsMap['permissions_confirmed'];
  const permissionsConfirmed = permVal === '1' || permVal === 1 || permVal === true || permVal === 'true';
  const screenEnabled = settingsMap['screen_enabled'] !== false && settingsMap['screen_enabled'] !== '0' && settingsMap['screen_enabled'] !== 0;
  const voiceEnabled = settingsMap['voice_enabled'] !== false && settingsMap['voice_enabled'] !== '0' && settingsMap['voice_enabled'] !== 0;
  const activityEnabled = settingsMap['activity_tracking_enabled'] !== false && settingsMap['activity_tracking_enabled'] !== '0' && settingsMap['activity_tracking_enabled'] !== 0;

  if (!firstRunComplete && !permissionsConfirmed) {
    components.permissions = {
      label: 'Permissions',
      status: 'NEEDS_ACTION',
      message: 'Senses and privacy preferences not yet reviewed',
      details: { permissionsConfirmed: false },
    };
  } else if (!screenEnabled && !voiceEnabled && !activityEnabled) {
    components.permissions = {
      label: 'Permissions',
      status: 'DISABLED',
      message: 'All sensor observation disabled by user',
      details: { screenEnabled, voiceEnabled, activityEnabled },
    };
  } else {
    components.permissions = {
      label: 'Permissions',
      status: 'READY',
      message: `Configured: Screen (${screenEnabled ? 'on' : 'off'}), Voice (${voiceEnabled ? 'on' : 'off'}), Activity (${activityEnabled ? 'on' : 'off'})`,
      details: { screenEnabled, voiceEnabled, activityEnabled },
    };
  }

  // 5. Local AI (Ollama)
  const ollamaProbe = await probeOllamaHttp(OLLAMA_DEFAULT_URL);
  const ollamaInstalled = isOllamaBinaryInstalled();

  if (aiChoice === 'cloud' || aiChoice === 'keyword') {
    components.local_ai = {
      label: 'Local AI',
      status: 'DISABLED',
      message: `Local AI inactive (selected mode: ${aiChoice})`,
      details: { selected_mode: aiChoice, reachable: ollamaProbe.reachable },
    };
  } else if (ollamaProbe.reachable) {
    components.local_ai = {
      label: 'Local AI',
      status: 'READY',
      message: `Ollama active at ${OLLAMA_DEFAULT_URL} (${ollamaProbe.models.length} models installed)`,
      details: {
        url: OLLAMA_DEFAULT_URL,
        models: ollamaProbe.models,
      },
    };
  } else if (ollamaInstalled) {
    components.local_ai = {
      label: 'Local AI',
      status: 'NEEDS_ACTION',
      message: 'Ollama is installed but not running on port 11434',
      details: { installed: true, reachable: false },
    };
  } else {
    components.local_ai = {
      label: 'Local AI',
      status: 'UNAVAILABLE',
      message: 'Ollama engine not installed on this computer',
      details: { installed: false, reachable: false },
    };
  }

  // 6. Selected AI Model
  let selectedModelName = 'none';
  try {
    const sel = get("SELECT model, provider FROM model_selections WHERE purpose = 'vision' OR purpose = 'general' LIMIT 1");
    if (sel) selectedModelName = sel.model;
  } catch {}

  if (aiChoice === 'keyword') {
    components.selected_model = {
      label: 'Selected AI Model',
      status: 'DISABLED',
      message: 'Lightweight mode active (no neural model required)',
      details: { mode: 'keyword' },
    };
  } else if (aiChoice === 'cloud') {
    const hasAnyKey = hasSecret('anthropic_api_key') || hasSecret('openai_api_key') || hasSecret('gemini_api_key') || hasSecret('cerebras_api_key');
    if (hasAnyKey) {
      components.selected_model = {
        label: 'Selected AI Model',
        status: 'READY',
        message: 'Cloud provider API configured',
        details: { mode: 'cloud' },
      };
    } else {
      components.selected_model = {
        label: 'Selected AI Model',
        status: 'NEEDS_ACTION',
        message: 'Cloud AI selected but no API key configured',
        details: { mode: 'cloud' },
      };
    }
  } else {
    // Local AI mode
    if (ollamaProbe.reachable) {
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
      } else {
        components.selected_model = {
          label: 'Selected AI Model',
          status: 'NEEDS_ACTION',
          message: 'Local AI is running, but no suitable model has been downloaded yet',
          details: { available_models: ollamaProbe.models },
        };
      }
    } else {
      components.selected_model = {
        label: 'Selected AI Model',
        status: components.local_ai.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'NEEDS_ACTION',
        message: 'Waiting for local AI engine before model can be loaded',
        details: {},
      };
    }
  }

  // 7. Cloud AI
  const cloudProviders = [];
  if (hasSecret('anthropic_api_key')) cloudProviders.push('Anthropic');
  if (hasSecret('openai_api_key')) cloudProviders.push('OpenAI');
  if (hasSecret('gemini_api_key')) cloudProviders.push('Google Gemini');
  if (hasSecret('cerebras_api_key')) cloudProviders.push('Cerebras');

  if (cloudProviders.length > 0) {
    components.cloud_ai = {
      label: 'Cloud AI',
      status: 'READY',
      message: `Configured: ${cloudProviders.join(', ')}`,
      details: { providers: cloudProviders },
    };
  } else if (aiChoice === 'cloud') {
    components.cloud_ai = {
      label: 'Cloud AI',
      status: 'NEEDS_ACTION',
      message: 'Cloud AI chosen, but no API keys have been entered',
      details: { providers: [] },
    };
  } else {
    components.cloud_ai = {
      label: 'Cloud AI',
      status: 'DISABLED',
      message: 'Not configured (using local PC storage)',
      details: { providers: [] },
    };
  }

  // 8. Devices
  let deviceCount = 1;
  try {
    const devRows = all('SELECT COUNT(*) as c FROM devices WHERE last_seen > datetime("now","-1 day")');
    deviceCount = Math.max(1, devRows?.[0]?.c || 1);
  } catch {}

  components.devices = {
    label: 'Devices',
    status: 'READY',
    message: `Primary desktop active (${deviceCount} device registered)`,
    details: { active_devices: deviceCount },
  };

  // Determine overall status
  let overall = 'READY';
  if (!firstRunComplete) {
    overall = 'NEEDS_ACTION';
  } else if (Object.values(components).some(c => c.status === 'ERROR')) {
    overall = 'ERROR';
  } else if (components.core.status !== 'READY' || components.database.status !== 'READY') {
    overall = 'NEEDS_ACTION';
  }

  return {
    ok: overall !== 'ERROR',
    first_run_complete: firstRunComplete,
    overall,
    components,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Complete First-Run Onboarding and persist user choices.
 */
export function completeSetup(payload = {}) {
  const {
    userName = '',
    aiChoice = 'local',
    screenEnabled = true,
    voiceEnabled = true,
    activityEnabled = true,
    apiKey = null,
    apiProvider = 'anthropic',
  } = payload;

  // Persist settings
  const entries = [
    ['first_run_complete', '1'],
    ['first_run_at', new Date().toISOString()],
    ['ai_engine_choice', aiChoice],
    ['permissions_confirmed', '1'],
    ['screen_enabled', screenEnabled ? '1' : '0'],
    ['voice_enabled', voiceEnabled ? '1' : '0'],
    ['activity_tracking_enabled', activityEnabled ? '1' : '0'],
  ];

  if (userName && userName.trim()) {
    entries.push(['user_name', userName.trim()]);
    entries.push(['display_name', userName.trim()]);
  }

  // If cloud key was provided during onboarding, save it
  if (apiKey && apiKey.trim()) {
    const keyName = `${apiProvider.toLowerCase().trim()}_api_key`;
    entries.push([keyName, apiKey.trim()]);
  }

  for (const [k, v] of entries) {
    run(
      "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (:key, :val, datetime('now','localtime'))",
      { ':key': k, ':val': typeof v === 'string' ? v : JSON.stringify(v) }
    );
  }

  console.log(`[Phoenix Setup] First-run onboarding completed successfully for "${userName || 'User'}" (mode: ${aiChoice})`);
  return { ok: true, first_run_complete: true };
}
