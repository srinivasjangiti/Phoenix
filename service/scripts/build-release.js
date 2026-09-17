/**
 * build-release.js — Master Release Build Pipeline for Phoenix
 *
 * One-command end-to-end production build:
 *   1. Build SvelteKit static dashboard (service/dashboard -> service/public/v2)
 *   2. Build Tauri desktop release binary (cargo build --release -> Phoenix.exe)
 *   3. Acquire & stage portable Node.js runtime (node/node.exe)
 *   4. Stage production service engine & dependencies (dist/staging/)
 *   5. Compile self-contained NSIS installer (installer/phoenix-setup.nsi)
 *   6. Output final consumer installer: the final exe file/Phoenix-Setup.exe
 */

import { execSync, spawnSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  rmSync,
  cpSync,
  copyFileSync,
  statSync,
  readFileSync,
  readdirSync
} from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..', '..');

function step(title) {
  console.log('\n' + '='.repeat(70));
  console.log(`  ${title}`);
  console.log('='.repeat(70) + '\n');
}

function findMakensis() {
  const candidates = [
    join(process.env.LOCALAPPDATA || '', 'electron-builder', 'Cache', 'nsis', 'nsis-3.0.4.1', 'makensis.exe'),
    'C:\\Program Files (x86)\\NSIS\\makensis.exe',
    'C:\\Program Files\\NSIS\\makensis.exe',
  ];

  for (const c of candidates) {
    if (existsSync(c)) return c;
  }

  // Check PATH
  try {
    const whereOut = execSync('where.exe makensis 2>nul', { encoding: 'utf8' }).trim();
    if (whereOut) return whereOut.split('\n')[0].trim();
  } catch {}

  throw new Error('makensis.exe not found! Please install NSIS or verify electron-builder cache.');
}

function findCargo() {
  const userCargo = join(process.env.USERPROFILE || '', '.cargo', 'bin', 'cargo.exe');
  if (existsSync(userCargo)) return userCargo;
  try {
    const whereOut = execSync('where.exe cargo 2>nul', { encoding: 'utf8' }).trim();
    if (whereOut) return whereOut.split('\n')[0].trim();
  } catch {}
  return 'cargo';
}

async function main() {
  const startTime = Date.now();
  console.log('PHOENIX MASTER RELEASE BUILD PIPELINE');
  console.log(`Repository Root: ${REPO_ROOT}`);

  const makensisPath = findMakensis();
  console.log(`Found NSIS Compiler: ${makensisPath}`);

  const cargoPath = findCargo();
  console.log(`Found Cargo Toolchain: ${cargoPath}`);

  // Prepend .cargo/bin to process.env.PATH
  const cargoBinDir = join(process.env.USERPROFILE || '', '.cargo', 'bin');
  if (existsSync(cargoBinDir)) {
    process.env.PATH = `${cargoBinDir};${process.env.PATH}`;
  }

  const nodeExePath = process.execPath;
  console.log(`System Node Binary: ${nodeExePath} (${process.version})`);

  // ── 1. COMPILE DASHBOARD ──────────────────────────────────────────────
  step('1. Compiling SvelteKit Dashboard');
  const dashboardDir = join(REPO_ROOT, 'service', 'dashboard');
  console.log(`Executing "npm run build" in ${dashboardDir}...`);
  execSync('npm run build', {
    cwd: dashboardDir,
    stdio: 'inherit',
    env: process.env,
  });

  const publicV2 = join(REPO_ROOT, 'service', 'public', 'v2');
  if (!existsSync(join(publicV2, 'index.html')) || !existsSync(join(publicV2, 'help.html'))) {
    throw new Error('Dashboard build failed: service/public/v2 static assets missing!');
  }
  console.log('✓ SvelteKit dashboard compiled cleanly into service/public/v2');

  // ── 2. COMPILE TAURI RELEASE BINARY ───────────────────────────────────
  step('2. Compiling Tauri Desktop Release Binary');
  const tauriDir = join(REPO_ROOT, 'service', 'tauri', 'src-tauri');
  console.log(`Executing "${cargoPath} build --release" in ${tauriDir}...`);
  execSync(`"${cargoPath}" build --release`, {
    cwd: tauriDir,
    stdio: 'inherit',
    env: process.env,
  });

  const compiledShell = join(tauriDir, 'target', 'release', 'phoenix-shell.exe');
  if (!existsSync(compiledShell)) {
    throw new Error(`Compiled binary not found at ${compiledShell}`);
  }

  const finalExeDir = join(REPO_ROOT, 'the final exe file');
  if (!existsSync(finalExeDir)) mkdirSync(finalExeDir, { recursive: true });

  const releaseExe = join(finalExeDir, 'Phoenix.exe');
  copyFileSync(compiledShell, releaseExe);
  console.log(`✓ Compiled release binary copied to: ${releaseExe} (${statSync(releaseExe).size} bytes)`);

  // ── 3. STAGING PRODUCTION PAYLOAD ─────────────────────────────────────
  step('3. Staging Production Payload');
  const stagingDir = join(REPO_ROOT, 'dist', 'staging');
  if (existsSync(stagingDir)) {
    console.log(`Cleaning old staging directory: ${stagingDir}...`);
    rmSync(stagingDir, { recursive: true, force: true });
  }
  mkdirSync(stagingDir, { recursive: true });

  // A. Stage Phoenix.exe
  console.log('Staging Phoenix.exe...');
  copyFileSync(releaseExe, join(stagingDir, 'Phoenix.exe'));

  // B. Stage Portable Node.js Runtime
  console.log('Staging portable Node.js runtime...');
  const stagingNodeDir = join(stagingDir, 'node');
  mkdirSync(stagingNodeDir, { recursive: true });
  copyFileSync(nodeExePath, join(stagingNodeDir, 'node.exe'));

  // C. Stage Service Bundle
  console.log('Staging production service bundle...');
  const stagingServiceDir = join(stagingDir, 'service');
  mkdirSync(stagingServiceDir, { recursive: true });

  // Copy root service files
  const serviceSrcDir = join(REPO_ROOT, 'service');
  copyFileSync(join(serviceSrcDir, 'phoenix.js'), join(stagingServiceDir, 'phoenix.js'));
  copyFileSync(join(serviceSrcDir, 'package.json'), join(stagingServiceDir, 'package.json'));

  // Copy src/ (filter out __tests__)
  console.log('  -> Copying service/src...');
  cpSync(join(serviceSrcDir, 'src'), join(stagingServiceDir, 'src'), {
    recursive: true,
    filter: (src) => !src.includes('__tests__')
  });

  // Copy bin/ (sounds, vad scripts)
  if (existsSync(join(serviceSrcDir, 'bin'))) {
    console.log('  -> Copying service/bin...');
    cpSync(join(serviceSrcDir, 'bin'), join(stagingServiceDir, 'bin'), { recursive: true });
  }

  // Copy public/
  console.log('  -> Copying service/public (compiled UI)...');
  cpSync(join(serviceSrcDir, 'public'), join(stagingServiceDir, 'public'), { recursive: true });

  // Copy production node_modules
  console.log('  -> Copying service/node_modules (production dependencies)...');
  cpSync(join(serviceSrcDir, 'node_modules'), join(stagingServiceDir, 'node_modules'), {
    recursive: true,
    filter: (src) => !src.includes('.cache')
  });

  // Copy phoenix-config if present
  if (existsSync(join(serviceSrcDir, 'phoenix-config'))) {
    console.log('  -> Copying service/phoenix-config...');
    cpSync(join(serviceSrcDir, 'phoenix-config'), join(stagingServiceDir, 'phoenix-config'), { recursive: true });
  }

  console.log('✓ Staging completed successfully in: ' + stagingDir);

  // ── 4. COMPILE NSIS INSTALLER ─────────────────────────────────────────
  step('4. Compiling Self-Contained NSIS Installer');
  const nsiScript = join(REPO_ROOT, 'installer', 'phoenix-setup.nsi');
  const outputExe = join(finalExeDir, 'Phoenix-Setup.exe');

  console.log(`Compiling NSIS script: ${nsiScript}`);
  console.log(`Staging payload:       ${stagingDir}`);
  console.log(`Target output:         ${outputExe}`);

  const nsisCmd = `"${makensisPath}" "/DSTAGING_DIR=${stagingDir}" "/DOUTPUT_EXE=${outputExe}" "${nsiScript}"`;
  execSync(nsisCmd, {
    cwd: join(REPO_ROOT, 'installer'),
    stdio: 'inherit',
  });

  if (!existsSync(outputExe)) {
    throw new Error(`NSIS compilation completed, but ${outputExe} was not produced!`);
  }

  // ── 5. RELEASE VERIFICATION & SUMMARY ─────────────────────────────────
  step('5. Release Build Complete');
  const finalStat = statSync(outputExe);
  const sizeMb = (finalStat.size / (1024 * 1024)).toFixed(2);

  const fileBytes = readFileSync(outputExe);
  const sha256 = crypto.createHash('sha256').update(fileBytes).digest('hex');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`Installer Location:  ${outputExe}`);
  console.log(`Installer Size:      ${sizeMb} MB (${finalStat.size.toLocaleString()} bytes)`);
  console.log(`SHA-256 Hash:        ${sha256}`);
  console.log(`Bundled Node.js:     ${process.version} (x64 Windows)`);
  console.log(`Build Duration:      ${elapsed} seconds`);
  console.log('\nPHOENIX-SETUP.EXE READY FOR TESTING.');
}

main().catch(err => {
  console.error('\nBuild Pipeline Failed:', err);
  process.exit(1);
});
