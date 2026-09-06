#!/usr/bin/env node
// Phoenix Dev Server — runs on a separate port with its own database
// Automatically kills any existing process on the port before starting.
//
// Usage: node dev-server.js [port]

import { join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = process.argv[2] || 7781;

// Auto-kill any process already on this port
try {
  const result = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf8', timeout: 5000, windowsHide: true });
  const pids = new Set();
  for (const line of result.trim().split('\n')) {
    const parts = line.trim().split(/\s+/);
    const pid = parseInt(parts[parts.length - 1]);
    if (pid && pid !== process.pid) pids.add(pid);
  }
  for (const pid of pids) {
    console.log(`[Phoenix Dev] Killing existing process on port ${port} (PID: ${pid})`);
    try { execSync(`taskkill /PID ${pid} /T /F`, { timeout: 5000, windowsHide: true }); } catch {}
  }
  if (pids.size > 0) {
    // Wait for port to release
    await new Promise(r => setTimeout(r, 2000));
  }
} catch {
  // No process on port — good
}

// Dev config — separate port, database, and dev mode (skips steward/reaper/device registration)
process.env.PHOENIX_PORT = String(port);
process.env.PHOENIX_DEV = '1';

const baseLocal = process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local');
process.env.PHOENIX_DATA_DIR = join(baseLocal, 'Phoenix', 'data-dev');

// Clone prod DB to dev on first start (gives dev a real copy of all data)
const prodDataDir = join(baseLocal, 'Phoenix', 'data');
const devDataDir = process.env.PHOENIX_DATA_DIR;
const devDbPath = join(devDataDir, 'phoenix.db');
const prodDbPath = join(prodDataDir, 'phoenix.db');
const prodKeyPath = join(prodDataDir, 'phoenix.key');
const devKeyPath = join(devDataDir, 'phoenix.key');

if (!existsSync(devDataDir)) {
  mkdirSync(devDataDir, { recursive: true });
}

if (!existsSync(devDbPath) && existsSync(prodDbPath)) {
  console.log(`[Phoenix Dev] Cloning prod database to dev...`);
  copyFileSync(prodDbPath, devDbPath);
  // Copy encryption key so dev can read the cloned DB
  if (existsSync(prodKeyPath)) {
    copyFileSync(prodKeyPath, devKeyPath);
  }
  console.log(`[Phoenix Dev] Clone complete: ${devDbPath}`);
} else if (existsSync(devDbPath)) {
  console.log(`[Phoenix Dev] Using existing dev database`);
}
// Copy encryption key if missing (dev needs same key to open cloned DB)
if (!existsSync(devKeyPath) && existsSync(prodKeyPath)) {
  copyFileSync(prodKeyPath, devKeyPath);
}

console.log(`[Phoenix Dev] Starting dev server on port ${port}`);
console.log('[Phoenix Dev] Database:', process.env.PHOENIX_DATA_DIR);
console.log(`[Phoenix Dev] Dashboard: http://localhost:${port}/v2/terminal`);
console.log('');

// Import and start
const { start } = await import('./src/server.js');
await start();
