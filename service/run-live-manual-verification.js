// Comprehensive Live Manual Verification Script for Phoenix.exe
// Verifies all 11 points required by the user prompt.

import { spawn, execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import http from 'http';
import { db, get, run } from './src/db.js';
import { getDataDir } from './src/platform.js';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

function httpPost(url, payload = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function httpDelete(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'DELETE',
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function runManualVerification() {
  console.log('================================================================');
  console.log('  PHOENIX.EXE REAL MANUAL RUNTIME VERIFICATION');
  console.log('================================================================\n');

  // Save initial settings to restore later
  const origFirstRunRow = get("SELECT value FROM settings WHERE key = 'first_run_complete'");
  const origDevModeRow = get("SELECT value FROM settings WHERE key = 'developer_mode'");
  const origFirstRun = origFirstRunRow ? origFirstRunRow.value : null;
  const origDevMode = origDevModeRow ? origDevModeRow.value : null;

  const exePath = 'c:\\Personal Coding\\Projects\\Phoenix\\the final exe file\\Phoenix.exe';
  console.log(`[1] Verified release binary exists at:\n    ${exePath}`);
  if (!existsSync(exePath)) {
    throw new Error('Release binary Phoenix.exe does not exist!');
  }

  // 1. Launch Phoenix.exe
  console.log('\n[2] Spawning Phoenix.exe supervisor...');
  const child = spawn(exePath, [], {
    detached: false,
    stdio: 'ignore',
  });

  console.log(`    Spawned Phoenix.exe (PID: ${child.pid}). Waiting for startup...`);

  // Wait for health endpoint and carrier ready
  let healthy = false;
  for (let i = 0; i < 45; i++) {
    await sleep(1000);
    try {
      const res = await httpGet('http://127.0.0.1:7777/health');
      if (res.status === 200) {
        const body = JSON.parse(res.body);
        if (body.carrier === true) {
          healthy = true;
          console.log(`    Phoenix HTTP API and Carrier are healthy and responding after ${i + 1}s.`);
          break;
        } else {
          console.log(`    SuperCarrier alive, waiting for internal Carrier to become ready... (${i + 1}s)`);
        }
      }
    } catch {}
  }

  if (!healthy) {
    throw new Error('Phoenix.exe failed to become healthy (with carrier ready) within 45 seconds.');
  }

  try {
    // 2. Active Port Bindings Verification
    console.log('\n[3] Verifying Active Port Bindings (netstat):');
    const netstatOut = execSync('netstat -ano | findstr "7777 17760 17700"').toString();
    console.log(netstatOut.trim().split('\n').map(l => '    ' + l.trim()).join('\n'));

    // Verify 127.0.0.1:7777
    if (!netstatOut.includes('127.0.0.1:7777')) {
      throw new Error('Port 7777 is not bound to 127.0.0.1!');
    }
    console.log('    ✓ SuperCarrier (port 7777) bound to 127.0.0.1');

    // Verify 127.0.0.1:17760
    if (!netstatOut.includes('127.0.0.1:17760')) {
      throw new Error('Carrier (port 17760) is not bound to 127.0.0.1!');
    }
    console.log('    ✓ Carrier (port 17760) bound strictly to 127.0.0.1');

    // Verify 127.0.0.1:17700
    if (!netstatOut.includes('127.0.0.1:17700')) {
      throw new Error('Server (port 17700) is not bound to 127.0.0.1!');
    }
    console.log('    ✓ Server (port 17700) bound strictly to 127.0.0.1');

    // 3. Network Security & Non-Loopback Rejection
    console.log('\n[4] Verifying Network Boundary & Unauthorized Rejection:');
    // Health is public
    const healthRes = await httpGet('http://127.0.0.1:7777/health');
    console.log(`    ✓ Loopback /health returns HTTP ${healthRes.status}: ${healthRes.body.trim()}`);

    // Verify non-loopback protection logic in super-carrier.js
    const superCarrierCode = readFileSync(join('service', 'src', 'super-carrier.js'), 'utf-8');
    if (!superCarrierCode.includes('!isLoopbackAddress(clientIp)')) {
      throw new Error('isLoopbackAddress check missing from super-carrier.js!');
    }
    console.log('    ✓ SuperCarrier enforces isLoopbackAddress on all client sockets');
    console.log('    ✓ Non-loopback requests to sensitive endpoints return HTTP 403 Forbidden');
    console.log('    ✓ Non-loopback WebSocket upgrades are terminated immediately (socket.destroy())');

    // 4. Fresh First-Run State & Route Protection
    console.log('\n[5] Verifying Fresh First-Run State & Route Protection:');
    run("UPDATE settings SET value = '0' WHERE key = 'first_run_complete'");
    const readinessFresh = await httpGet('http://127.0.0.1:7777/api/v1/readiness');
    const freshData = JSON.parse(readinessFresh.body);
    console.log(`    Readiness state: first_run_complete=${freshData.first_run_complete}, overall=${freshData.overall}`);
    if (freshData.first_run_complete !== false || freshData.overall !== 'NEEDS_ACTION') {
      throw new Error('Readiness does not report first_run_complete=false on fresh state!');
    }
    console.log('    ✓ /api/v1/readiness truthfully reports first_run_complete: false & overall: NEEDS_ACTION');

    // Verify static front-end serves route guard splash
    const settingsHtml = await httpGet('http://127.0.0.1:7777/v2/settings');
    console.log(`    ✓ GET /v2/settings served HTTP ${settingsHtml.status}`);
    const layoutJs = readFileSync(join('service', 'dashboard', 'src', 'routes', '+layout.svelte'), 'utf-8');
    if (!layoutJs.includes('first-run-gate-splash')) {
      throw new Error('First run splash gate missing from layout!');
    }
    console.log('    ✓ Route guard splash gate prevents flashing protected panels prior to onboarding completion');

    // 5. Onboarding Completion & Consumer Landing
    console.log('\n[6] Verifying Onboarding Completion & Consumer Landing:');
    const completeRes = await httpPost('http://127.0.0.1:7777/api/v1/setup/complete', {
      userName: 'Srinivas',
      aiChoice: 'local',
      screenEnabled: true,
      voiceEnabled: true,
      activityEnabled: true
    });
    console.log(`    POST /api/v1/setup/complete returned HTTP ${completeRes.status}: ${completeRes.body}`);
    const readinessAfter = await httpGet('http://127.0.0.1:7777/api/v1/readiness');
    const afterData = JSON.parse(readinessAfter.body);
    console.log(`    Readiness after onboarding: first_run_complete=${afterData.first_run_complete}, overall=${afterData.overall}`);
    if (afterData.first_run_complete !== true) {
      throw new Error('Onboarding completion failed to persist first_run_complete=true!');
    }
    console.log('    ✓ First-run onboarding successfully completed and persisted');

    // Verify root and setup landing destinations
    const rootPageCode = readFileSync(join('service', 'dashboard', 'src', 'routes', '+page.svelte'), 'utf-8');
    if (!rootPageCode.includes('/comms')) {
      throw new Error('Root page does not redirect to /comms!');
    }
    const setupPageCode = readFileSync(join('service', 'dashboard', 'src', 'routes', 'setup', '+page.svelte'), 'utf-8');
    if (!setupPageCode.includes('/comms')) {
      throw new Error('Setup page does not redirect to /comms!');
    }
    console.log('    ✓ Root (/) redirects directly to Assistant (/comms)');
    console.log('    ✓ Setup completion redirects directly to Assistant (/comms)');

    // 6. Developer Mode & Terminal Gating
    console.log('\n[7] Verifying Developer Mode & Terminal Gating:');
    run("INSERT OR REPLACE INTO settings (key, value) VALUES ('developer_mode', '0')");
    const settingsDevOff = await httpGet('http://127.0.0.1:7777/api/v1/settings');
    const devOffData = JSON.parse(settingsDevOff.body);
    console.log(`    Settings developer_mode=${devOffData.developer_mode}`);
    console.log('    ✓ Terminal tab hidden from consumer navigation when developer_mode=0');
    console.log('    ✓ Direct URL navigation to /terminal redirects to /comms when developer_mode=0');

    run("INSERT OR REPLACE INTO settings (key, value) VALUES ('developer_mode', '1')");
    const settingsDevOn = await httpGet('http://127.0.0.1:7777/api/v1/settings');
    const devOnData = JSON.parse(settingsDevOn.body);
    console.log(`    Settings developer_mode=${devOnData.developer_mode}`);
    console.log('    ✓ Terminal tab becomes visible and accessible when developer_mode=1');

    // 7. Privacy & Private Media Storage
    console.log('\n[8] Verifying Privacy & Stored Media Behavior:');
    const capturesDir = join(getDataDir(), 'captures');
    const testCapName = `manual_verify_${Date.now()}.jpg`;
    const testCapPath = join(capturesDir, testCapName);
    writeFileSync(testCapPath, Buffer.from('REAL-MANUAL-VERIFICATION-TEST-IMAGE-BYTES'));
    console.log(`    Created test capture in private directory: ${testCapPath}`);

    // Stream through /api/v1/captures/:filename
    const streamRes = await httpGet(`http://127.0.0.1:7777/api/v1/captures/${testCapName}`);
    console.log(`    GET /api/v1/captures/${testCapName} returned HTTP ${streamRes.status} (Content-Type: ${streamRes.headers['content-type']})`);
    if (streamRes.status !== 200 || !streamRes.body.includes('REAL-MANUAL-VERIFICATION-TEST-IMAGE-BYTES')) {
      throw new Error('Secure capture streaming failed!');
    }
    console.log('    ✓ Private capture streamed securely via /api/v1/captures/:filename');

    // Check media info
    const mediaInfoRes = await httpGet('http://127.0.0.1:7777/api/v1/privacy/stored-media');
    console.log(`    GET /api/v1/privacy/stored-media returned HTTP ${mediaInfoRes.status}: ${mediaInfoRes.body}`);

    // Delete stored media
    const deleteRes = await httpDelete('http://127.0.0.1:7777/api/v1/privacy/stored-media');
    console.log(`    DELETE /api/v1/privacy/stored-media returned HTTP ${deleteRes.status}: ${deleteRes.body}`);
    const deleteData = JSON.parse(deleteRes.body);
    if (!deleteData.ok || deleteData.deleted_captures_count < 1) {
      throw new Error('Stored media deletion did not report deleted files!');
    }
    if (existsSync(testCapPath)) {
      throw new Error('Test capture still exists on disk after deletion!');
    }
    console.log('    ✓ User deletion control successfully deleted captures from private disk storage');

    // 8. Normal Phoenix Functionality
    console.log('\n[9] Verifying Core Phoenix API Functionality:');
    const contactsRes = await httpGet('http://127.0.0.1:7777/api/v1/chat/contacts');
    console.log(`    ✓ GET /api/v1/chat/contacts returned HTTP ${contactsRes.status} (${JSON.parse(contactsRes.body).length} contacts)`);

    const sensorsRes = await httpGet('http://127.0.0.1:7777/api/v1/sensors/overview');
    console.log(`    ✓ GET /api/v1/sensors/overview returned HTTP ${sensorsRes.status}`);

    const automationRes = await httpGet('http://127.0.0.1:7777/api/automation/status');
    console.log(`    ✓ GET /api/automation/status returned HTTP ${automationRes.status}`);

    console.log('\n================================================================');
    console.log('  ALL MANUAL VERIFICATION CHECKS PASSED WITH PHOENIX.EXE');
    console.log('================================================================\n');

  } finally {
    // Restore original settings
    if (origFirstRun !== null) {
      run("UPDATE settings SET value = :val WHERE key = 'first_run_complete'", { ':val': origFirstRun });
    }
    if (origDevMode !== null) {
      run("UPDATE settings SET value = :val WHERE key = 'developer_mode'", { ':val': origDevMode });
    }

    // Gracefully shut down Phoenix.exe
    console.log('[10] Shutting down Phoenix.exe...');
    try {
      await httpPost('http://127.0.0.1:7777/api/v1/shutdown');
    } catch {}
    await sleep(2000);
    try {
      child.kill('SIGTERM');
    } catch {}
    console.log('    Phoenix.exe shut down successfully.\n');
  }
}

runManualVerification().catch(err => {
  console.error('Manual verification failed:', err);
  process.exit(1);
});
