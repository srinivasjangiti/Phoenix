// PHOENIX PHASE 7: ACCEPTANCE VERIFICATION TEST SUITE
// Verifies all 20 criteria for Windows packaging and installer behavior.

import { spawn, execSync } from 'child_process';
import {
  existsSync,
  statSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  readdirSync,
} from 'fs';
import { join, resolve } from 'path';
import http from 'http';
import crypto from 'crypto';

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

function queryRegistry(keyPath, valueName) {
  try {
    const out = execSync(`reg query "${keyPath}" /v "${valueName}" 2>nul`, { encoding: 'utf8' });
    const match = out.match(new RegExp(`${valueName}\\s+REG_\\w+\\s+(.+)`));
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

async function runPhase7Tests() {
  console.log('===============================================================');
  console.log('PHOENIX PHASE 7: WINDOWS PACKAGING ACCEPTANCE VERIFICATION');
  console.log('===============================================================\n');

  const repoRoot = resolve('.');
  const installerPath = join(repoRoot, 'the final exe file', 'Phoenix-Setup.exe');
  const targetInstallDir = join(process.env.LOCALAPPDATA || '', 'Programs', 'Phoenix');

  let desktopDir = join(process.env.USERPROFILE || '', 'Desktop');
  try {
    const psDesktop = execSync('powershell -Command "[Environment]::GetFolderPath(\'Desktop\')"', { encoding: 'utf8' }).trim();
    if (psDesktop && existsSync(psDesktop)) desktopDir = psDesktop;
  } catch {}

  const desktopShortcut = join(desktopDir, 'Phoenix.lnk');
  const startMenuDir = join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Phoenix');
  const startMenuShortcut = join(startMenuDir, 'Phoenix.lnk');
  const uninstallerShortcut = join(startMenuDir, 'Uninstall Phoenix.lnk');

  // ── TEST 1: Installer Binary Validation ─────────────────────────────
  console.log('--- Test 1: Installer Artifact Integrity ---');
  assert(existsSync(installerPath), `Phoenix-Setup.exe exists at: ${installerPath}`);

  const stat = statSync(installerPath);
  const sizeMb = stat.size / (1024 * 1024);
  assert(sizeMb > 50 && sizeMb < 250, `Installer size is valid for bundled app: ${sizeMb.toFixed(2)} MB`);

  // Verify PE header
  const fd = readFileSync(installerPath);
  assert(fd[0] === 0x4D && fd[1] === 0x5A, 'Installer has valid DOS MZ signature');
  const peOffset = fd.readUInt32LE(0x3C);
  assert(fd[peOffset] === 0x50 && fd[peOffset + 1] === 0x45, 'Installer has valid PE signature');

  const sha256 = crypto.createHash('sha256').update(fd).digest('hex');
  console.log(`  Installer SHA-256: ${sha256}`);

  // ── TEST 2: Installation Execution ──────────────────────────────────
  console.log('\n--- Test 2: Execution & File Installation ---');
  console.log(`  Executing silent installation to: ${targetInstallDir}...`);
  execSync(`cmd.exe /c start /wait "" "${installerPath}" /S`, { stdio: 'inherit' });

  // Poll until Phoenix-Setup.exe is completely finished
  for (let i = 0; i < 90; i++) {
    try {
      const procs = execSync('tasklist /FI "IMAGENAME eq Phoenix-Setup.exe" 2>nul', { encoding: 'utf8' });
      if (!procs.includes('Phoenix-Setup.exe')) {
        console.log(`  Installer process completed after ${i + 1}s.`);
        break;
      }
    } catch {}
    await sleep(1000);
  }
  await sleep(2000);

  assert(existsSync(targetInstallDir), 'Target installation directory exists');
  assert(existsSync(join(targetInstallDir, 'Phoenix.exe')), 'Installed Phoenix.exe desktop binary exists');
  assert(existsSync(join(targetInstallDir, 'node', 'node.exe')), 'Installed bundled portable node/node.exe exists');
  assert(existsSync(join(targetInstallDir, 'service', 'phoenix.js')), 'Installed service/phoenix.js exists');
  assert(existsSync(join(targetInstallDir, 'service', 'src', 'server.js')), 'Installed service/src/server.js exists');
  assert(existsSync(join(targetInstallDir, 'service', 'public', 'v2', 'index.html')), 'Installed compiled dashboard exists');
  assert(existsSync(join(targetInstallDir, 'service', 'public', 'v2', 'help.html')), 'Installed Help Center bundle exists');
  assert(existsSync(join(targetInstallDir, 'service', 'node_modules')), 'Installed production node_modules exists');
  assert(existsSync(join(targetInstallDir, 'uninstall.exe')), 'Installed uninstaller (uninstall.exe) exists');

  // ── TEST 3: Shortcuts & Shell Integration ───────────────────────────
  console.log('\n--- Test 3: Windows Shortcuts & Registry Integration ---');
  assert(existsSync(desktopShortcut), `Desktop shortcut created at: ${desktopShortcut}`);
  assert(existsSync(startMenuShortcut), `Start Menu shortcut created at: ${startMenuShortcut}`);
  assert(existsSync(uninstallerShortcut), `Start Menu uninstaller shortcut created at: ${uninstallerShortcut}`);

  const regKey = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Phoenix';
  const displayName = queryRegistry(regKey, 'DisplayName');
  const installLoc = queryRegistry(regKey, 'InstallLocation');
  const uninstString = queryRegistry(regKey, 'UninstallString');

  assert(displayName === 'Phoenix', `Registry DisplayName is "Phoenix" (got: "${displayName}")`);
  assert(installLoc && installLoc.toLowerCase().includes('phoenix'), `Registry InstallLocation points to Phoenix directory: ${installLoc}`);
  assert(uninstString && uninstString.includes('uninstall.exe'), `Registry UninstallString configured: ${uninstString}`);

  // ── TEST 4: Runtime Execution from Installed Location ────────────────
  console.log('\n--- Test 4: Launching Installed Product (Self-Contained) ---');
  const installedExe = join(targetInstallDir, 'Phoenix.exe');

  console.log(`  Spawning installed application: ${installedExe}...`);
  const child = spawn(installedExe, [], {
    cwd: targetInstallDir,
    detached: false,
    stdio: 'ignore'
  });
  console.log(`  Spawned installed Phoenix (PID: ${child.pid}). Waiting for startup...`);

  let healthy = false;
  for (let i = 0; i < 45; i++) {
    await sleep(1000);
    try {
      const res = await httpGet('http://127.0.0.1:7777/health');
      if (res.status === 200) {
        const b = JSON.parse(res.body);
        if (b.carrier === true) {
          healthy = true;
          console.log(`  Installed Phoenix HTTP API & Carrier healthy after ${i + 1}s.`);
          break;
        }
      }
    } catch {}
  }
  assert(healthy, 'Installed Phoenix launched and reported healthy on port 7777');

  // ── TEST 5: Bundled Node.js Runtime Verification ────────────────────
  console.log('\n--- Test 5: Bundled Node.js vs System Node.js Isolation ---');
  // Check process path for the child node process
  let usingBundledNode = false;
  try {
    const procOut = execSync('powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, Path"', { encoding: 'utf8' });
    console.log(procOut.trim().split('\n').map(l => '    ' + l.trim()).join('\n'));
    if (procOut.toLowerCase().includes(targetInstallDir.toLowerCase())) {
      usingBundledNode = true;
    }
  } catch (e) {
    console.warn('Process inspection note:', e.message);
  }
  assert(usingBundledNode, 'Phoenix backend runs via the bundled portable node.exe in installed directory');

  // ── TEST 6: Dashboard & Core Services ───────────────────────────────
  console.log('\n--- Test 6: Dashboard & Core Subsystems ---');
  const dashRes = await httpGet('http://127.0.0.1:7777/v2/index.html');
  assert(dashRes.status === 200, 'Installed dashboard root returns HTTP 200');

  const helpRes = await httpGet('http://127.0.0.1:7777/v2/help.html');
  assert(helpRes.status === 200, 'Installed offline Help Center returns HTTP 200');

  const readinessRes = await httpGet('http://127.0.0.1:7777/api/v1/readiness');
  assert(readinessRes.status === 200, 'Readiness API returns HTTP 200');
  const readinessData = JSON.parse(readinessRes.body);
  assert(readinessData.components.core.status === 'READY', 'Core subsystem is READY');
  assert(readinessData.components.database.status === 'READY', 'Database subsystem is READY');

  // ── TEST 7: Graceful Clean Shutdown ─────────────────────────────────
  console.log('\n--- Test 7: Clean Process Shutdown (Zero Orphans) ---');
  await httpPost('http://127.0.0.1:7777/api/v1/shutdown');
  await sleep(3000);

  // Check that port 7777 is released
  let portReleased = false;
  try {
    const netstatOut = execSync('netstat -ano | findstr "7777"', { encoding: 'utf8' });
    if (!netstatOut.includes('LISTENING')) portReleased = true;
  } catch {
    portReleased = true;
  }
  assert(portReleased, 'Installed Phoenix shut down cleanly with 0 orphan listeners');

  // ── TEST 8: Upgrade & Data Preservation ─────────────────────────────
  console.log('\n--- Test 8: Reinstall / Upgrade Data Preservation ---');
  const dataDir = join(process.env.LOCALAPPDATA || '', 'Phoenix', 'data');
  const markerFile = join(dataDir, `phase7_test_${Date.now()}.marker`);
  writeFileSync(markerFile, 'PHOENIX_UPGRADE_SAFETY_MARKER');
  assert(existsSync(markerFile), 'Test data marker created in %LOCALAPPDATA%\\Phoenix\\data\\');

  console.log('  Running simulated upgrade install (Phoenix-Setup.exe /S)...');
  execSync(`cmd.exe /c start /wait "" "${installerPath}" /S`, { stdio: 'inherit' });
  for (let i = 0; i < 90; i++) {
    try {
      const procs = execSync('tasklist /FI "IMAGENAME eq Phoenix-Setup.exe" 2>nul', { encoding: 'utf8' });
      if (!procs.includes('Phoenix-Setup.exe')) break;
    } catch {}
    await sleep(1000);
  }
  await sleep(2000);

  assert(existsSync(markerFile), 'User data marker preserved across reinstall/upgrade');
  try { unlinkSync(markerFile); } catch {}

  // ── TEST 9: Uninstaller & Clean Removal ──────────────────────────────
  console.log('\n--- Test 9: Uninstaller Execution & Cleanup ---');
  const uninstallerExe = join(targetInstallDir, 'uninstall.exe');
  assert(existsSync(uninstallerExe), 'Uninstaller executable exists');

  console.log('  Executing silent uninstall (uninstall.exe /S)...');
  // Pass _?=<dir> so uninstaller runs synchronously in-place without spawning temp clone
  execSync(`cmd.exe /c start /wait "" "${uninstallerExe}" /S _?=${targetInstallDir}`, { stdio: 'inherit' });
  await sleep(3000);

  assert(!existsSync(join(targetInstallDir, 'Phoenix.exe')), 'Phoenix.exe removed by uninstaller');
  assert(!existsSync(join(targetInstallDir, 'node')), 'node directory removed by uninstaller');
  assert(!existsSync(join(targetInstallDir, 'service')), 'service directory removed by uninstaller');
  assert(!existsSync(desktopShortcut), 'Desktop shortcut removed by uninstaller');
  assert(!existsSync(startMenuShortcut), 'Start Menu shortcut removed by uninstaller');

  const regAfter = queryRegistry(regKey, 'DisplayName');
  assert(regAfter === null, 'Registry Add/Remove Programs entry deleted by uninstaller');

  // Verify data directory is intact in silent uninstall
  assert(existsSync(dataDir), '%LOCALAPPDATA%\\Phoenix\\data\\ preserved by default');

  console.log('\n===============================================================');
  console.log(`PHASE 7 ACCEPTANCE CRITERIA VERIFIED: ${passed} / ${passed + failed} PASSING`);
  console.log('===============================================================\n');
}

runPhase7Tests().catch(err => {
  console.error('\nPhase 7 Acceptance Verification Failed:', err);
  process.exit(1);
});
