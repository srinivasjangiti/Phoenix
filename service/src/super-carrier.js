/**
 * super-carrier.js — The permanent outer layer. Never restarts.
 *
 * Owns port 7777 and all browser connections (HTTP + WebSocket).
 * Spawns Carrier on an internal port and proxies everything to it.
 * When Carrier restarts, browser connections are held open — WebSocket frames
 * are buffered for up to ~5s, then drained once the new Carrier is ready.
 * The browser never sees a disconnect.
 *
 * Architecture:
 *   [Browser] ←─ WS/HTTP ─→ [SuperCarrier :7777] ←─ proxy ─→ [Carrier :17760]
 *                                                                    ↕ IPC
 *                                                             [Craft :17700+]
 */

import { createServer } from 'http';
import { fork }         from 'child_process';
import { WebSocketServer, WebSocket } from 'ws';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { request as httpRequest } from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SC_PORT      = parseInt(process.env.PHOENIX_PORT) || 7777;
const CARRIER_PORT = parseInt(process.env.PHOENIX_CARRIER_INTERNAL_PORT) || 17760;
const HOST         = process.env.PHOENIX_HOST || '127.0.0.1';

function isLoopbackAddress(ip) {
  if (!ip) return false;
  return ip === '127.0.0.1' ||
         ip === '::1' ||
         ip === '::ffff:127.0.0.1' ||
         ip.endsWith('127.0.0.1');
}

// ── Carrier readiness gate ───────────────────────────────────────────────────
// Requests that arrive while Carrier is restarting wait here instead of failing.

let _carrierReady   = false;
let _carrierWaiters = [];

function markCarrierReady() {
  _carrierReady = true;
  const w = _carrierWaiters.splice(0);
  for (const resolve of w) resolve();
}

function markCarrierDown() {
  _carrierReady = false;
}

function waitForCarrier() {
  if (_carrierReady) return Promise.resolve();
  return new Promise(r => _carrierWaiters.push(r));
}

// ── Carrier process management ───────────────────────────────────────────────

let carrierProc   = null;
let _shuttingDown = false;

async function pollCarrierHealth(maxMs = 25_000) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${CARRIER_PORT}/api/carrier/ready`,
        { signal: AbortSignal.timeout(1000) });
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  return false;
}

async function launchCarrier() {
  if (_shuttingDown) return;
  markCarrierDown();

  console.log('[SuperCarrier] Spawning Carrier...');

  carrierProc = fork(join(__dirname, 'carrier.js'), [], {
    env: {
      ...process.env,
      PHOENIX_PORT:                    String(SC_PORT),
      // carrier knows public port for logging
      PHOENIX_CARRIER_INTERNAL_PORT:   String(CARRIER_PORT),
      PAN_CARRIER_INTERNAL_PORT:       String(CARRIER_PORT),    // carrier listens here
      PHOENIX_UNDER_SUPER_CARRIER:     '1',
      PAN_UNDER_SUPER_CARRIER:         '1',                     // carrier adjusts its behavior
    },
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],  // ipc required by fork(); not actively used
    windowsHide: true,
  });

  carrierProc.stdout?.on('data', d => process.stdout.write(`[Carrier] ${d}`));
  carrierProc.stderr?.on('data', d => process.stderr.write(`[Carrier!] ${d}`));

  carrierProc.on('exit', (code, signal) => {
    console.log(`[SuperCarrier] Carrier exited (code=${code} signal=${signal})`);
    markCarrierDown();
    if (_shuttingDown) return;
    // code 0 = zombie self-exit or intentional clean stop — don't respawn
    const shouldRespawn = code !== 0 || signal != null;
    if (shouldRespawn) {
      console.log('[SuperCarrier] Respawning Carrier in 1s...');
      setTimeout(launchCarrier, 1000);
    }
  });

  const healthy = await pollCarrierHealth();
  if (healthy) {
    markCarrierReady();
    console.log(`[SuperCarrier] ✓ Carrier ready on :${CARRIER_PORT}`);
  } else {
    console.error('[SuperCarrier] Carrier failed health check — force-killing to ensure clean respawn');
    // Don't just "wait" — if Carrier is alive-but-unhealthy, _carrierReady stays false
    // forever and every HTTP request queues indefinitely. Kill it so exit handler fires.
    try { carrierProc?.kill('SIGKILL'); } catch {}
    // Exit handler will respawn
  }
}

// ── HTTP reverse proxy ───────────────────────────────────────────────────────

function proxyHttp(req, res) {
  const options = {
    hostname: '127.0.0.1',
    port:     CARRIER_PORT,
    path:     req.url,
    method:   req.method,
    headers:  { ...req.headers, host: `127.0.0.1:${CARRIER_PORT}`, 'x-forwarded-host': req.headers.host || '' },
  };

  const proxy = httpRequest(options, proxyRes => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxy.on('error', err => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Carrier unavailable', detail: err.message }));
    }
  });

  req.pipe(proxy, { end: true });
}

// ── WebSocket proxy with buffering ───────────────────────────────────────────
// Each browser WS gets a managed proxy that survives Carrier restarts.

function proxyWs(browserWs, url) {
  const outBuffer = []; // browser→carrier frames buffered during restart (max 200)
  let   internal  = null;
  let   dead      = false;   // true once browser disconnects

  // Phoenix-clients (/ws/client) must re-register after Carrier restarts — their state
  // (clients Map entry) is lost. We track whether internal has connected before so
  // that on reconnect we close the browser WS, forcing phoenix-client to reconnect fresh
  // and re-send its register message to the new Carrier.
  // Browser dashboard connections (/ws/terminal etc.) keep the buffering behavior.
  const isPhoenixClient = url.startsWith('/ws/client');
  let   hasConnectedBefore = false;

  function connectInternal() {
    if (dead) return;

    internal = new WebSocket(`ws://127.0.0.1:${CARRIER_PORT}${url}`);

    internal.on('open', () => {
      // Phoenix-client reconnecting after Carrier restart: close so it re-registers fresh.
      if (isPhoenixClient && hasConnectedBefore) {
        dead = true;
        try { internal.close(); } catch {}
        try { browserWs.close(1001, 'Carrier restarted — reconnect to re-register'); } catch {}
        return;
      }
      hasConnectedBefore = true;

      // Drain any frames that arrived while Carrier was restarting
      const pending = outBuffer.splice(0);
      for (const { data, isBinary } of pending) {
        if (internal.readyState === WebSocket.OPEN) internal.send(data, { binary: isBinary });
      }
    });

    // Carrier → browser
    internal.on('message', (data, isBinary) => {
      if (browserWs.readyState === WebSocket.OPEN) browserWs.send(data, { binary: isBinary });
    });

    internal.on('ping', data => {
      if (browserWs.readyState === WebSocket.OPEN) browserWs.ping(data);
    });

    // Carrier disconnected (restart / crash) — hold the browser open, wait, reconnect
    internal.on('close', async () => {
      if (dead) return;
      console.log(`[SuperCarrier] Carrier WS closed — holding browser open, waiting for restart`);
      await waitForCarrier();
      if (!dead) setTimeout(connectInternal, 100);
    });

    internal.on('error', () => {}); // handled by 'close'
  }

  // Browser → carrier (buffer if carrier is mid-restart)
  browserWs.on('message', (data, isBinary) => {
    if (internal?.readyState === WebSocket.OPEN) {
      internal.send(data, { binary: isBinary });
    } else {
      if (outBuffer.length < 200) outBuffer.push({ data, isBinary });
    }
  });

  browserWs.on('pong', data => {
    if (internal?.readyState === WebSocket.OPEN) internal.pong(data);
  });

  browserWs.on('close', () => {
    dead = true;
    try { internal?.close(); } catch {}
  });

  browserWs.on('error', () => {}); // handled by 'close'

  connectInternal();
}

// ── Main HTTP server ─────────────────────────────────────────────────────────

const CARRIER_RESTART_WATCHDOG_MS = 5_000; // force-kill if Carrier hasn't exited in 5s

let _lastProbe = null;

const server = createServer((req, res) => {
  // Allow cross-origin requests from Tauri webview (tauri.localhost)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    });
    res.end();
    return;
  }

  const clientIp = req.socket?.remoteAddress;
  const isLoopback = isLoopbackAddress(clientIp);
  const [urlPath, queryString] = req.url.split('?');

  // Network boundary: Desktop dashboard, admin endpoints, and sensitive APIs are strictly loopback-only.
  if (!isLoopback) {
    if (urlPath === '/health' || urlPath === '/api/carrier/health') {
      // allow public liveness check
    } else {
      res.writeHead(403, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({
        ok: false,
        error: 'Forbidden: Phoenix desktop APIs and dashboard are strictly restricted to loopback (127.0.0.1). Non-loopback access is blocked.',
      }));
      return;
    }
  }

  if (urlPath === '/api/carrier/probe') {
    if (req.method === 'POST') {
      let b = '';
      req.on('data', c => b += c);
      req.on('end', () => {
        try { _lastProbe = JSON.parse(b); } catch { _lastProbe = b; }
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ ok: true }));
      });
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ ok: true, probe: _lastProbe }));
    return;
  }

  // Super-Carrier answers /health directly — instant, never blocked by Carrier state
  if (urlPath === '/health' || urlPath === '/api/carrier/health') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    });
    res.end(JSON.stringify({
      ok:              true,
      carrier:         _carrierReady,  // dashboard checks this field
      superCarrier:    true,
      superCarrierPid: process.pid,
      carrierPid:      carrierProc?.pid ?? null,
      craftHealthy:    _carrierReady,  // optimistic — carrier will report accurately
    }));
    return;
  }

  // Graceful shutdown endpoint — cleanly shuts down Carrier, Craft, and SuperCarrier
  if ((urlPath === '/api/v1/shutdown' || urlPath === '/api/carrier/shutdown') && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, message: 'Phoenix shutting down' }));
    console.log('[SuperCarrier] Received shutdown request from supervisor/API');
    setTimeout(() => shutdown('SUPERVISOR_API'), 50);
    return;
  }

  // Restart request: proxy to Carrier for the 200, then arm a watchdog to force-kill
  // if Carrier hasn't exited on its own within CARRIER_RESTART_WATCHDOG_MS.
  // This prevents the indefinite hang where Carrier's process.exit(1) never fires
  // (blocked event loop, zombie child, etc.) and _carrierReady stays false forever.
  if (req.url.startsWith('/api/carrier/restart') && req.method === 'POST') {
    const procAtStart = carrierProc;
    waitForCarrier()
      .then(() => proxyHttp(req, res))
      .catch(() => {
        if (!res.headersSent) { res.writeHead(503); res.end('Carrier starting'); }
      })
      .finally(() => {
        // Arm watchdog: if the same Carrier process is still alive after the deadline,
        // force-kill it so Super-Carrier's exit handler fires and respawns cleanly.
        const watchdog = setTimeout(() => {
          if (carrierProc && carrierProc === procAtStart && carrierProc.exitCode === null) {
            console.warn('[SuperCarrier] ⚠ Carrier restart watchdog fired — force-killing hung Carrier');
            try { carrierProc.kill('SIGKILL'); } catch {}
          }
        }, CARRIER_RESTART_WATCHDOG_MS);
        watchdog.unref(); // don't keep Super-Carrier alive just for this timer
      });
    return;
  }

  // All other requests: wait for Carrier, then proxy
  waitForCarrier()
    .then(() => proxyHttp(req, res))
    .catch(() => {
      if (!res.headersSent) { res.writeHead(503); res.end('Carrier starting'); }
    });
});

// WebSocket upgrades: wait for Carrier, then proxy
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', async (req, socket, head) => {
  try {
    const clientIp = socket?.remoteAddress;
    if (!isLoopbackAddress(clientIp)) {
      socket.destroy();
      return;
    }
    await waitForCarrier();
    wss.handleUpgrade(req, socket, head, ws => proxyWs(ws, req.url));
  } catch {
    socket.destroy();
  }
});

let _listenRetries = 0;
const MAX_LISTEN_RETRIES = 10;

server.on('error', err => {
  console.error(`[SuperCarrier] Server error: ${err.message}`);
  if (err.code === 'EADDRINUSE') {
    // Port conflict — almost always transient (TIME_WAIT from prior process, or
    // a race where phoenix-loop kills the old process and we spawn before the port is
    // fully released).  Retry up to 10× with 2s backoff instead of crashing.
    // Previously this called process.exit(1), which phoenix-loop.bat treated as a
    // crash and immediately respawned — causing a "SERVER CRASHED" storm with
    // zero chance of recovery if the conflict lasted >10s.
    _listenRetries++;
    if (_listenRetries <= MAX_LISTEN_RETRIES) {
      console.warn(`[SuperCarrier] Port ${SC_PORT} in use — retry ${_listenRetries}/${MAX_LISTEN_RETRIES} in 2s...`);
      setTimeout(() => server.listen(SC_PORT, HOST), 2000);
    } else {
      console.error(`[SuperCarrier] Port ${SC_PORT} still in use after ${MAX_LISTEN_RETRIES} retries — giving up`);
      process.exit(1);
    }
    return;
  }
  // Other server errors are non-fatal — log and survive
  console.error(`[SuperCarrier] Non-fatal server error:`, err.stack || err);
});

// ── Boot ─────────────────────────────────────────────────────────────────────

server.listen(SC_PORT, HOST, () => {
  console.log(`[SuperCarrier] ══════════════════════════════════════════`);
  console.log(`[SuperCarrier] Listening on :${SC_PORT}  (PID ${process.pid})`);
  console.log(`[SuperCarrier] Carrier internal port: :${CARRIER_PORT}`);
  console.log(`[SuperCarrier] ══════════════════════════════════════════`);
  launchCarrier();
});

// ── Graceful shutdown ────────────────────────────────────────────────────────

function shutdown(sig) {
  if (_shuttingDown) return;
  _shuttingDown = true;
  console.log(`[SuperCarrier] ${sig} — shutting down`);
  try { carrierProc?.kill('SIGTERM'); } catch {}
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000); // force exit after 5s
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ── Process-level survival handlers ─────────────────────────────────────────
// Super-Carrier is the permanent outer layer — it MUST NOT crash.
// Without these, Node 18+ kills the process on any unhandled rejection (from
// the async WS proxy, waitForCarrier chains, or any imported module).
// We log and survive; Carrier/Craft have their own handlers for their own scope.
process.on('uncaughtException', (err) => {
  // EPIPE = broken pipe writing to a dead socket — harmless transient.
  // Check both err.code AND message — process.stdout.write EPIPE sets message only, not code.
  if (err.code === 'EPIPE' || String(err?.message).includes('EPIPE')) return;
  console.error('[SuperCarrier] !! Uncaught exception (keeping alive):', err?.message, err?.stack);
});
process.on('unhandledRejection', (reason) => {
  const msg = String(reason?.message || reason);
  if (msg.includes('EPIPE')) return;
  console.error('[SuperCarrier] !! Unhandled rejection (keeping alive):', msg, reason?.stack || '');
});

// Diagnostic: log the EXACT call stack whenever process.exit is called.
// This fires even for exit(0), giving us a full picture of why the process is ending.
// Remove once the spontaneous crash is identified and fixed.
process.on('exit', (code) => {
  if (code !== 0) {
    console.error(`[SuperCarrier] !! process.exit(${code}) — stack at point of exit:`);
    console.trace('[SuperCarrier] exit trace');
  }
});
