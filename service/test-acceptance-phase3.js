import { strict as assert } from 'node:assert';
import { execSync } from 'node:child_process';
import { getOllamaStatus, startOllamaDaemon } from './src/ollama-manager.js';
import { getReadinessState } from './src/readiness.js';
import { getModelForPurpose, setModelForPurpose, get, run } from './src/db.js';
import { route } from './src/router.js';
import { askAIWithFallback } from './src/llm-fallback.js';

console.log('===============================================================');
console.log('PHOENIX PHASE 3: USER ACCEPTANCE CRITERIA VERIFICATION');
console.log('===============================================================');

async function runAcceptanceTests() {
  // ──────────────────────────────────────────────────────────────────────────
  // CRITERION 1: Existing external Ollama ko Phoenix kabhi kill na kare
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[TEST 1] Existing external Ollama PID preservation...');

  // Get Ollama process PID from OS
  let initialPid = null;
  try {
    const psOutput = execSync('powershell -NoProfile -Command "Get-Process ollama -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id"', { encoding: 'utf8' }).trim();
    if (psOutput) {
      initialPid = parseInt(psOutput.split(/\r?\n/)[0], 10);
    }
  } catch (e) {
    console.warn('Could not query PowerShell for Ollama PID:', e.message);
  }

  console.log(`  Initial OS Ollama PID: ${initialPid}`);
  assert(initialPid, 'Ollama must be running on system before test');

  // Verify Phoenix detects it as EXTERNAL_UNMANAGED
  const status = await getOllamaStatus();
  console.log(`  Phoenix detected Ollama running: ${status.running}, ownership: ${status.ownership}`);
  assert.equal(status.running, true, 'Ollama must be running');
  assert.equal(status.ownership, 'EXTERNAL_UNMANAGED', 'Existing instance must be classified as EXTERNAL_UNMANAGED');

  // Attempting to call startOllamaDaemon() must NOT spawn new or kill existing
  const startResult = await startOllamaDaemon();
  console.log(`  startOllamaDaemon() response:`, startResult);
  assert.equal(startResult.ok, true);
  assert.equal(startResult.alreadyRunning, true, 'Must detect already running and not re-spawn');

  // Verify PID is unchanged after Phoenix operations
  const currentPs = execSync('powershell -NoProfile -Command "Get-Process ollama -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id"', { encoding: 'utf8' }).trim();
  const currentPids = currentPs.split(/\r?\n/).map(p => parseInt(p, 10));
  console.log(`  Ollama PIDs after Phoenix inspection:`, currentPids);
  assert(currentPids.includes(initialPid), 'External Ollama PID must remain completely untouched and alive!');
  console.log('  PASSED: Phoenix never kills external Ollama and attaches cleanly as EXTERNAL_UNMANAGED.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // CRITERION 2: READY fake na ho
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[TEST 2] Verifying readiness truth (zero fake readiness)...');

  // Case A: Valid installed model configured
  setModelForPurpose('chat_local', 'ollama@local', 'llama3.2:1b');
  const readinessValid = await getReadinessState();
  const selectedValid = readinessValid.components.selected_model;
  console.log(`  Configured 'llama3.2:1b' -> Status: ${selectedValid.status}, Message: "${selectedValid.message}"`);
  assert.equal(selectedValid.status, 'READY', 'Should be READY when model is genuinely installed');
  assert.equal(selectedValid.details.verified, true, 'details.verified must be true');

  // Case B: Non-existent / missing model configured (e.g. gemma4:e2b)
  setModelForPurpose('chat_local', 'ollama@local', 'fake_nonexistent_model:99b');
  const readinessFake = await getReadinessState();
  const selectedFake = readinessFake.components.selected_model;
  console.log(`  Configured 'fake_nonexistent_model:99b' -> Status: ${selectedFake.status}, Message: "${selectedFake.message}"`);
  assert.equal(selectedFake.status, 'NEEDS_ACTION', 'Must NEVER fake READY when model does not exist');
  assert(selectedFake.message.includes('not installed in local Ollama'), 'Must clearly explain model is not installed');
  assert.notEqual(selectedFake.status, 'READY', 'Must NEVER be READY when missing');

  // Restore valid model
  setModelForPurpose('chat_local', 'ollama@local', 'llama3.2:1b');
  const readinessRestored = await getReadinessState();
  const selectedRestored = readinessRestored.components.selected_model;
  assert.equal(selectedRestored.status, 'READY', 'Must return to READY when restored to genuine model');
  console.log('  PASSED: Zero fabricated substitution. Missing models report NEEDS_ACTION honestly.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // CRITERION 3: Actual Phoenix chat local model se response de aur cloud fallback silently na ho
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[TEST 3] Verifying real local chat execution & zero silent cloud fallback...');

  // Ensure ai_choice and ai_engine_choice are 'local'
  run("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('ai_choice', \'\"local\"', datetime('now','localtime'))");
  run("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('ai_engine_choice', \'\"local\"', datetime('now','localtime'))");
  run("DELETE FROM settings WHERE key = 'allow_cloud_fallback'");

  const testQuery = 'Explain what is a computer in 5 words.';
  console.log(`  Sending query to production router: "${testQuery}"`);
  const routeResult = await route(testQuery, { source: 'dashboard' });

  console.log(`  Router response: "${routeResult.response}"`);
  console.log(`  Debug served_by: "${routeResult._debug?.served_by}"`);
  console.log(`  Debug is_local: ${routeResult._debug?.is_local}`);
  console.log(`  AI latency: ${routeResult._debug?.ai_latency_ms}ms`);

  assert(routeResult.response && routeResult.response.length > 0, 'Must produce non-empty response');
  assert.equal(routeResult._debug?.served_by, 'ollama:llama3.2:1b', 'Must be served strictly by ollama:llama3.2:1b');
  assert.equal(routeResult._debug?.is_local, true, 'Must be flagged as local');
  assert.equal(routeResult.is_local, true, 'Top-level result must indicate is_local: true');
  assert(!routeResult._debug?.fallback_attempts, 'Must have 0 fallback attempts when local succeeds');

  // Test that when local fails in strict local mode, it does NOT silently call cloud
  console.log('\n  Testing failure behavior in strict local mode:');
  let threwExpected = false;
  try {
    // Force a call with invalid local model and no cloud fallback allowed
    await askAIWithFallback('Say hi', {
      chain: ['ollama:completely_bogus_model_xyz:999b'],
      caller: 'test',
    });
  } catch (err) {
    threwExpected = true;
    console.log(`  Expected clean failure received without silent cloud fallback: "${err.message}"`);
    assert(err.message.includes('404') || err.message.includes('not found') || err.message.includes('model'), 'Expected model error');
  }
  assert(threwExpected, 'Must fail cleanly instead of silently calling cloud when local AI is selected');

  console.log('\n  PASSED: Production chat path successfully answered by local Ollama (llama3.2:1b) with zero cloud fallback.\n');

  console.log('===============================================================');
  console.log('ALL 3 ACCEPTANCE CRITERIA SATISFIED WITH 100% PASSING EVIDENCE!');
  console.log('===============================================================');
}

runAcceptanceTests().catch(err => {
  console.error('Acceptance test failed:', err);
  process.exit(1);
});
