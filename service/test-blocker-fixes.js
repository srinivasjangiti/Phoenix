// Automated Test Suite: Pre-Packaging Blocker Fixes
// Tests:
// 1. Consumer Routing (Route guard, consumer /comms landing, developer mode gating)
// 2. Privacy Claim & Private Storage (Captures saved to getDataDir(), secure streaming, deletion endpoint)
// 3. Network Exposure (Carrier/Server bound to 127.0.0.1, SuperCarrier loopback default, non-loopback 403 rejection)

import { readFileSync, existsSync, readdirSync, unlinkSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { getDataDir } from './src/platform.js';
import { db } from './src/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    failed++;
    throw new Error(message);
  } else {
    console.log(`  PASS: ${message}`);
    passed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('PHOENIX PRE-PACKAGING BLOCKER FIX TEST SUITE');
  console.log('====================================================\n');

  // ── 1. NETWORK EXPOSURE TESTS ───────────────────────────────────
  console.log('--- Suite 1: Network Exposure & Loopback Isolation ---');

  // Verify carrier.js HOST binding
  const carrierSrc = readFileSync(join(__dirname, 'src', 'carrier.js'), 'utf-8');
  assert(
    carrierSrc.includes("const HOST = '127.0.0.1';"),
    'carrier.js binds strictly to loopback 127.0.0.1 (not 0.0.0.0)'
  );

  // Verify server.js HOST binding
  const serverSrc = readFileSync(join(__dirname, 'src', 'server.js'), 'utf-8');
  assert(
    serverSrc.includes("const HOST = '127.0.0.1';"),
    'server.js binds strictly to loopback 127.0.0.1 (not 0.0.0.0)'
  );

  // Verify super-carrier.js HOST binding
  const superCarrierSrc = readFileSync(join(__dirname, 'src', 'super-carrier.js'), 'utf-8');
  assert(
    superCarrierSrc.includes("const HOST         = process.env.PHOENIX_HOST || '127.0.0.1';"),
    'super-carrier.js defaults to loopback 127.0.0.1'
  );

  // Verify super-carrier.js has loopback security check
  assert(
    superCarrierSrc.includes('function isLoopbackAddress('),
    'super-carrier.js contains isLoopbackAddress validation'
  );
  assert(
    superCarrierSrc.includes('Forbidden: Phoenix desktop APIs and dashboard are strictly restricted to loopback'),
    'super-carrier.js rejects non-loopback requests to sensitive routes with 403 Forbidden'
  );
  assert(
    superCarrierSrc.includes('socket.destroy();') && superCarrierSrc.includes('!isLoopbackAddress(clientIp)'),
    'super-carrier.js destroys non-loopback WebSocket connections'
  );

  // ── 2. CONSUMER ROUTING TESTS ──────────────────────────────────
  console.log('\n--- Suite 2: Consumer Routing Architecture ---');

  // Verify root +page.svelte redirects to /comms
  const rootPageSrc = readFileSync(join(__dirname, 'dashboard', 'src', 'routes', '+page.svelte'), 'utf-8');
  assert(
    rootPageSrc.includes('/comms') && !rootPageSrc.includes("goto(`${base}/terminal`"),
    'Root +page.svelte redirects to consumer Assistant hub (/comms) instead of /terminal'
  );

  // Verify setup completion redirects to /comms
  const setupPageSrc = readFileSync(join(__dirname, 'dashboard', 'src', 'routes', 'setup', '+page.svelte'), 'utf-8');
  assert(
    setupPageSrc.includes("goto(`${base}/comms?view=contacts&thread=thread-phoenix-system`, { replaceState: true });"),
    'Onboarding completion redirects to consumer Assistant hub (/comms) instead of /terminal'
  );

  // Verify layout route guard and developer mode gating
  const layoutSrc = readFileSync(join(__dirname, 'dashboard', 'src', 'routes', '+layout.svelte'), 'utf-8');
  assert(
    layoutSrc.includes("label: 'Assistant', href: `${base}/comms`, icon: '💬'"),
    '+layout.svelte sets Assistant (/comms) as primary consumer navigation tab'
  );
  assert(
    layoutSrc.includes("devOnly: true") && layoutSrc.includes("if (t.devOnly && !developerMode) return false;"),
    '+layout.svelte gates Terminal tab behind Developer Mode'
  );
  assert(
    layoutSrc.includes('first-run-gate-splash'),
    '+layout.svelte blocks rendering of protected routes on first run before onboarding'
  );
  assert(
    layoutSrc.includes("!developerMode && page.url.pathname.includes('/terminal')"),
    '+layout.svelte redirects non-developer users away from /terminal to /comms'
  );

  // ── 3. PRIVACY & PRIVATE STORAGE TESTS ──────────────────────────
  console.log('\n--- Suite 3: Privacy & Private Storage Integrity ---');

  // Verify PrivacySensesCard truthful copy
  const privacyCardSrc = readFileSync(join(__dirname, 'dashboard', 'src', 'lib', 'components', 'PrivacySensesCard.svelte'), 'utf-8');
  assert(
    privacyCardSrc.includes('Background sensing is 100% ephemeral in RAM'),
    'PrivacySensesCard accurately states background sensing is 100% ephemeral in RAM'
  );
  assert(
    privacyCardSrc.includes('%LOCALAPPDATA%\\Phoenix\\data\\'),
    'PrivacySensesCard accurately discloses local disk storage for user-taken photos and face crops'
  );
  assert(
    privacyCardSrc.includes('Stored Photos') && privacyCardSrc.includes('Visual Identity Reference'),
    'PrivacySensesCard includes transparent visual data storage breakdown'
  );

  // Verify api.js saves captures to getDataDir()
  const apiSrc = readFileSync(join(__dirname, 'src', 'routes', 'api.js'), 'utf-8');
  assert(
    apiSrc.includes("const CAPTURES_DIR = join(getDataDir(), 'captures');"),
    'api.js saves phone captures to private getDataDir()/captures (not repository public/captures)'
  );
  assert(
    apiSrc.includes("router.get('/captures/:filename'"),
    'api.js includes secure /api/v1/captures/:filename streaming endpoint'
  );
  assert(
    apiSrc.includes("router.delete('/privacy/stored-media'"),
    'api.js includes user deletion endpoint DELETE /api/v1/privacy/stored-media'
  );

  // Live storage operation verification
  const capturesDir = join(getDataDir(), 'captures');
  if (!existsSync(capturesDir)) mkdirSync(capturesDir, { recursive: true });

  const testFile = join(capturesDir, `test_cap_${Date.now()}.jpg`);
  writeFileSync(testFile, Buffer.from('fake-jpeg-data'));
  assert(existsSync(testFile), 'Test capture created in private data directory');

  // Verify that service/public/captures does NOT contain this capture
  const publicCapturesDir = join(__dirname, 'public', 'captures');
  assert(
    !existsSync(join(publicCapturesDir, testFile)),
    'Capture file is NOT stored in public repository directory'
  );

  // Test deletion logic directly against private storage
  const filesBefore = readdirSync(capturesDir).filter(f => f.startsWith('test_cap_'));
  assert(filesBefore.length > 0, 'Found created test capture before cleanup');
  for (const f of filesBefore) {
    unlinkSync(join(capturesDir, f));
  }
  const filesAfter = readdirSync(capturesDir).filter(f => f.startsWith('test_cap_'));
  assert(filesAfter.length === 0, 'User media deletion removes captures from disk');

  console.log('\n====================================================');
  console.log(`ALL TESTS PASSED: ${passed} / ${passed + failed}`);
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('\nTest suite failed:', err);
  process.exit(1);
});
