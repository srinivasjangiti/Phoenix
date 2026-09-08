import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceDir = join(__dirname, '..', '..');
const phoenixJs = join(serviceDir, 'phoenix.js');

describe('Phoenix Unified Desktop Supervisor & Lifecycle Tests', () => {
  it('should support --help and display standard commands', async () => {
    const proc = spawn('node', [phoenixJs, 'help'], {
      cwd: serviceDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));

    const exitCode = await new Promise((resolve) => proc.on('close', resolve));
    assert.equal(exitCode, 0, 'Help command should exit with code 0');
    assert.match(stdout, /Phoenix — Local-First AI Memory Layer/, 'Help output should match tagline');
    assert.match(stdout, /start/, 'Help output should list start command');
  });

  it('should accept --supervised environment flag cleanly', async () => {
    const testPort = 7789;
    const proc = spawn('node', [phoenixJs, 'start', '--no-carrier', '--supervised'], {
      cwd: serviceDir,
      env: {
        ...process.env,
        PHOENIX_PORT: String(testPort),
        PHOENIX_DEV: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';
    proc.stdout.on('data', (d) => (output += d.toString()));
    proc.stderr.on('data', (d) => (output += d.toString()));

    await new Promise((r) => setTimeout(r, 2000));

    assert.ok(
      output.includes('Running under Desktop Supervisor'),
      `Expected output to mention supervisor, got: ${output.slice(0, 300)}`
    );

    proc.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 1000));
    try {
      proc.kill('SIGKILL');
    } catch {}
  });

  it('should support graceful shutdown via POST /api/v1/shutdown on SuperCarrier', async () => {
    const testPort = 7795;
    const carrierPort = 17795;
    const proc = spawn('node', ['src/super-carrier.js'], {
      cwd: serviceDir,
      env: {
        ...process.env,
        PHOENIX_PORT: String(testPort),
        PHOENIX_CARRIER_INTERNAL_PORT: String(carrierPort),
        PHOENIX_DEV: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Wait for SuperCarrier to begin listening
    let ready = false;
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${testPort}/health`, {
          signal: AbortSignal.timeout(1000),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.superCarrier) {
            ready = true;
            break;
          }
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 300));
    }

    assert.ok(ready, `SuperCarrier failed to become healthy on port ${testPort}`);

    // Send graceful shutdown request
    const shutdownRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/shutdown`, {
      method: 'POST',
      signal: AbortSignal.timeout(2000),
    });
    assert.equal(shutdownRes.status, 200, 'Shutdown endpoint should respond with 200 OK');
    const shutdownBody = await shutdownRes.json();
    assert.equal(shutdownBody.ok, true, 'Shutdown response should be ok');

    // Wait for process to exit cleanly
    const exitCode = await Promise.race([
      new Promise((resolve) => proc.on('exit', resolve)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Process exit timeout')), 6000)),
    ]);

    assert.equal(exitCode, 0, 'SuperCarrier should exit with code 0 on graceful shutdown');
  });
});
