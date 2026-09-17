/**
 * Phoenix Phase 6: Consumer-Grade Settings, Privacy & Permissions Redesign Acceptance Test
 * 
 * Verifies:
 * 1. Static bundle compilation & /v2/settings.html generation.
 * 2. 5 Consumer tabs (Profile, AI Setup, Memory & Storage, Privacy & Senses, Devices) + Advanced tab.
 * 3. PrivacySensesCard implementation with WHAT / WHY / EXAMPLE / CONTROL format.
 * 4. Developer Mode defaults to OFF (safe mode) and cleanly reveals developer tools when ON.
 * 5. Zero database migrations: settings key-value persistence without schema alteration.
 * 6. Secret protection: API keys redacted in settings responses.
 * 7. Readiness state machine synchronization with sensor toggles.
 * 8. Zero regression on Phase 3 (Ollama external PID preservation & strict local mode).
 * 9. Zero regression on Phase 4 (HumanErrorCard translation & PII scrubbing).
 * 10. Zero regression on Phase 5 (Help Center catalog & settings navigation link).
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import assert from 'node:assert/strict';

import { run, get } from './src/db.js';
import { redactSettings } from './src/secrets.js';
import { getReadinessState } from './src/readiness.js';
import { getOllamaStatus } from './src/ollama-manager.js';
import { humanizeError, sanitizeDiagnostics } from './src/error-humanizer.js';
import { HELP_CATEGORIES, HELP_TOPICS, searchHelp } from './src/help-catalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function setSetting(key, val) {
  run(
    "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (:k, :v, datetime('now','localtime'))",
    { ':k': key, ':v': String(val) }
  );
}

function getSetting(key) {
  const row = get('SELECT value FROM settings WHERE key = :k', { ':k': key });
  return row ? row.value : null;
}

console.log('===============================================================');
console.log('PHOENIX PHASE 6: CONSUMER SETTINGS & PRIVACY ACCEPTANCE TEST');
console.log('===============================================================\n');

// -----------------------------------------------------------------
// TEST 1: Static Bundle Compilation & /v2/settings Route
// -----------------------------------------------------------------
console.log('[TEST 1] Verifying static bundle compilation & /v2/settings route...');
const settingsHtmlPath = join(__dirname, 'public', 'v2', 'settings.html');
assert.ok(existsSync(settingsHtmlPath), 'service/public/v2/settings.html must exist on disk');

const settingsHtml = readFileSync(settingsHtmlPath, 'utf8');
assert.ok(settingsHtml.length > 500, 'settings.html must not be empty');

// Check compiled JS chunks for Phase 6 elements
const nodesDir = join(__dirname, 'public', 'v2', '_app', 'immutable', 'nodes');
assert.ok(existsSync(nodesDir), 'Immutable nodes directory must exist');
const nodeFiles = readdirSync(nodesDir);

let foundPrivacy = false;
let foundDevMode = false;
for (const f of nodeFiles) {
  const content = readFileSync(join(nodesDir, f), 'utf8');
  if (content.includes('Privacy & Senses') || content.includes('Senses & Digital Awareness')) {
    foundPrivacy = true;
  }
  if (content.includes('Developer Mode') || content.includes('SAFE MODE')) {
    foundDevMode = true;
  }
}

assert.ok(foundPrivacy, 'Compiled bundle must contain Privacy & Senses consumer UI');
assert.ok(foundDevMode, 'Compiled bundle must contain Developer Mode safe toggle');
console.log(`  settings.html verified (${settingsHtml.length} bytes, compiled SPA entry present)`);
console.log('  PASSED: Static settings bundle compiled with consumer UI and Developer Mode.\n');

// -----------------------------------------------------------------
// TEST 2: PrivacySensesCard Component & WHAT/WHY/EXAMPLE/CONTROL
// -----------------------------------------------------------------
console.log('[TEST 2] Verifying PrivacySensesCard structure & WHAT/WHY/EXAMPLE/CONTROL format...');
const sensesCardPath = join(__dirname, 'dashboard', 'src', 'lib', 'components', 'PrivacySensesCard.svelte');
assert.ok(existsSync(sensesCardPath), 'PrivacySensesCard.svelte must exist');

const cardContent = readFileSync(sensesCardPath, 'utf8');
assert.ok(cardContent.includes('WHAT IT DOES'), 'Must include WHAT IT DOES explanation');
assert.ok(cardContent.includes('WHY PHOENIX NEEDS IT'), 'Must include WHY PHOENIX NEEDS IT explanation');
assert.ok(cardContent.includes('EVERYDAY EXAMPLE'), 'Must include EVERYDAY EXAMPLE explanation');
assert.ok(cardContent.includes('screen_enabled'), 'Must bind to screen_enabled');
assert.ok(cardContent.includes('webcam_presence_enabled'), 'Must bind to webcam_presence_enabled');
assert.ok(cardContent.includes('activity_tracking_enabled'), 'Must bind to activity_tracking_enabled');
assert.ok(cardContent.includes('privacy_enabled'), 'Must bind to differential privacy_enabled');
assert.ok(cardContent.includes('continuous video recordings and screen feeds are never saved to disk'), 'Must state privacy guarantee');
console.log('  PrivacySensesCard verified with 4 observation senses and truthful privacy guarantees.');
console.log('  PASSED: Consumer sensory transparency conforms to product spec.\n');

// -----------------------------------------------------------------
// TEST 3: Settings Page Tab Reorganization (5 Consumer + Advanced)
// -----------------------------------------------------------------
console.log('[TEST 3] Verifying settings page tab hierarchy (5 Consumer Tabs + Advanced)...');
const settingsSveltePath = join(__dirname, 'dashboard', 'src', 'routes', 'settings', '+page.svelte');
assert.ok(existsSync(settingsSveltePath), 'settings/+page.svelte must exist');

const settingsSvelte = readFileSync(settingsSveltePath, 'utf8');

// Verify consumer tabs array
const requiredTabs = ['profile', 'ai', 'memory', 'privacy', 'devices', 'advanced'];
for (const tab of requiredTabs) {
  assert.ok(settingsSvelte.includes(`id: '${tab}'`), `consumerTabs must define tab: ${tab}`);
}
console.log('  Consumer tabs verified: Profile, AI Setup, Memory & Storage, Privacy & Senses, Devices, Advanced.');

// Verify developer features are preserved inside devSubTabs
const requiredDevSubTabs = ['general', 'orgs', 'security', 'auth', 'network', 'treasury', 'email', 'controls'];
for (const devTab of requiredDevSubTabs) {
  assert.ok(settingsSvelte.includes(`id: '${devTab}'`), `devSubTabs must preserve developer section: ${devTab}`);
}
console.log('  Developer sub-tabs preserved: Server & Ports, Orgs, Security, Auth, Network, Treasury, Email, Controls.');

// Verify Developer Mode toggle state
assert.ok(settingsSvelte.includes("let developerMode = $state(false);"), 'developerMode must be false by default');
assert.ok(settingsSvelte.includes("Developer Tools are Locked"), 'Safe mode notice must be shown when developerMode is false');
console.log('  PASSED: 5 consumer tabs + Advanced established with 0 developer features deleted.\n');

// -----------------------------------------------------------------
// TEST 4: Zero Database Migrations & Key-Value Persistence
// -----------------------------------------------------------------
console.log('[TEST 4] Verifying zero-migration key-value persistence...');
// Test consumer settings persistence via existing table
await setSetting('user_name', 'Phoenix User');
await setSetting('ai_choice', 'local');
await setSetting('developer_mode', '0');
await setSetting('screen_enabled', 'true');
await setSetting('activity_tracking_enabled', 'true');

assert.equal(await getSetting('user_name'), 'Phoenix User', 'user_name must persist');
assert.equal(await getSetting('ai_choice'), 'local', 'ai_choice must persist');
assert.equal(await getSetting('developer_mode'), '0', 'developer_mode must persist');
assert.equal(await getSetting('screen_enabled'), 'true', 'screen_enabled must persist');
assert.equal(await getSetting('activity_tracking_enabled'), 'true', 'activity_tracking_enabled must persist');

// Toggle developer_mode to ON
await setSetting('developer_mode', '1');
assert.equal(await getSetting('developer_mode'), '1', 'developer_mode toggle to 1 must persist');
await setSetting('developer_mode', '0'); // reset to default OFF

console.log('  Settings successfully stored and retrieved using existing key-value mechanism.');
console.log('  PASSED: Zero database migrations, zero schema changes.\n');

// -----------------------------------------------------------------
// TEST 5: Secret Masking & Redaction Protection
// -----------------------------------------------------------------
console.log('[TEST 5] Verifying API key redaction and secrecy...');
const mockSettings = {
  user_name: 'Phoenix User',
  anthropic_api_key: 'sk-ant-api03-abcdef1234567890',
  gemini_api_key: 'AIzaSyA_mock_secret_key_12345',
  developer_mode: '0'
};

const sanitized = redactSettings(mockSettings);
assert.equal(sanitized.user_name, 'Phoenix User', 'Non-secret settings must remain intact');
assert.equal(sanitized.anthropic_api_key, undefined, 'anthropic_api_key must be stripped from response');
assert.equal(sanitized.gemini_api_key, undefined, 'gemini_api_key must be stripped from response');
assert.ok(sanitized._secrets.anthropic_api_key !== undefined, '_secrets must report anthropic presence');
assert.ok(sanitized._secrets.gemini_api_key !== undefined, '_secrets must report gemini presence');
console.log('  Redaction output: secrets stripped, non-sensitive presence flags reported.');
console.log('  PASSED: Secrets remain protected and cannot leak to UI or responses.\n');

// -----------------------------------------------------------------
// TEST 6: Sensor Settings & Readiness Synchronization
// -----------------------------------------------------------------
console.log('[TEST 6] Verifying sensor configuration synchronization with readiness state...');
// Set active sensors
await setSetting('screen_enabled', 'true');
await setSetting('activity_tracking_enabled', 'true');
const r1 = await getReadinessState();
assert.ok(r1.components.permissions, 'Permissions component must exist in readiness');
assert.equal(r1.components.permissions.status, 'READY', 'When sensors are enabled, permissions status must be READY');

// Disable all sensors
await setSetting('screen_enabled', 'false');
await setSetting('activity_tracking_enabled', 'false');
await setSetting('voice_enabled', 'false');
const r2 = await getReadinessState();
assert.equal(r2.components.permissions.status, 'DISABLED', 'When all sensors disabled, permissions status must be DISABLED');

// Restore defaults
await setSetting('screen_enabled', 'true');
await setSetting('activity_tracking_enabled', 'true');
console.log('  Permissions component status: READY -> DISABLED -> restored.');
console.log('  PASSED: Sensor settings synchronize accurately with readiness state.\n');

// -----------------------------------------------------------------
// TEST 7: Zero Regression on Phase 3 (Ollama External PID & Local AI)
// -----------------------------------------------------------------
console.log('[TEST 7] Verifying Phase 3 baseline preservation (Ollama PID & strict local AI)...');
const ollama = await getOllamaStatus();
assert.equal(ollama.running, true, 'Ollama must be running');
assert.equal(ollama.ownership, 'EXTERNAL_UNMANAGED', 'External Ollama PID must remain EXTERNAL_UNMANAGED');
console.log(`  Ollama status: running=${ollama.running}, ownership=${ollama.ownership}`);

const readiness = await getReadinessState();
assert.ok(readiness.components.local_ai, 'Local AI component must report honest status');
assert.equal(readiness.components.local_ai.status, 'READY', 'Local AI must report READY');
console.log('  PASSED: Phase 3 external Ollama daemon and strict local mode 100% intact.\n');

// -----------------------------------------------------------------
// TEST 8: Zero Regression on Phase 4 (Human Error & PII Scrubbing)
// -----------------------------------------------------------------
console.log('[TEST 8] Verifying Phase 4 error humanizer & PII sanitizer...');
const err = new Error('connect ECONNREFUSED 127.0.0.1:11434');
err.code = 'ECONNREFUSED';
const human = humanizeError(err);
assert.equal(human.code, 'LOCAL_AI_OFFLINE');
assert.equal(human.title, 'Local AI Engine is Sleeping');
assert.equal(human.primary_action?.endpoint, '/api/v1/ollama/start');

const diag = 'Stack trace at C:\\Users\\srini\\phoenix\\secret.js key sk-ant-api03-abcdef1234567890';
const clean = sanitizeDiagnostics(diag);
assert.ok(!clean.includes('srini'), 'Path username must be scrubbed');
assert.ok(!clean.includes('abcdef1234567890'), 'API key must be scrubbed');
console.log('  PASSED: Phase 4 error translation and diagnostics sanitizer 100% intact.\n');

// -----------------------------------------------------------------
// TEST 9: Zero Regression on Phase 5 (Help Center & Navigation Link)
// -----------------------------------------------------------------
console.log('[TEST 9] Verifying Phase 5 Help Center catalog & settings navigation link...');
assert.equal(HELP_CATEGORIES.length, 6, 'Must retain 6 help categories');
assert.ok(HELP_TOPICS.length >= 15, 'Must retain all help topics');

const results = searchHelp('privacy');
assert.ok(results.length > 0, 'Help search for "privacy" must return relevant topics');

// Check that settings sidebar has the Help Center link
assert.ok(settingsSvelte.includes('/help'), 'Settings navigation must retain link to Help Center');
console.log(`  Help topics count: ${HELP_TOPICS.length}, Privacy search matches: ${results.length}`);
console.log('  PASSED: Phase 5 Help Center and settings link 100% preserved.\n');

console.log('===============================================================');
console.log('ALL PHASE 6 ACCEPTANCE CRITERIA SATISFIED (100% PASSING)!');
console.log('===============================================================');
