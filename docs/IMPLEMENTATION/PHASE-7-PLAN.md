# Phoenix Phase 7: Windows Packaging — Implementation Plan

> **STATUS: AUTHORIZED, IMPLEMENTED & VERIFIED**  
> **COMPLETED: 2026-09-09**  
> **DELIVERABLE:** `the final exe file\Phoenix-Setup.exe` (118.39 MB, Solid LZMA, Self-Contained)

---

## 1. Executive Summary & Objective

The objective of **Phase 7 (Windows Packaging)** is to transform Phoenix from a developer repository that requires Node.js, npm, and cargo into a **fully self-contained, offline-capable Windows installer (`Phoenix-Setup.exe`)**.

A consumer receiving `Phoenix-Setup.exe` will be able to double-click the file on a clean Windows 10/11 machine, install Phoenix in seconds without administrative elevation or command-line tools, launch the application from standard Desktop and Start Menu shortcuts, and have all background Node.js engines automatically managed via a bundled portable Node runtime.

---

## 2. Current State vs. Target State

| Dimension | Current State (Phase 6) | Target State (Phase 7) |
|---|---|---|
| **Distribution Format** | Unbundled `Phoenix.exe` (18.4 MB) | Self-extracting, compressed NSIS installer `Phoenix-Setup.exe` (~100–140 MB) |
| **Node.js Dependency** | Expects Node.js pre-installed on system or in PATH | Bundled portable Node.js LTS (`node/node.exe`) requiring 0 system dependencies |
| **Service Dependencies** | Requires repository `service/` and `node_modules/` | Pre-packages production `service/` bundle and compiled `service/public/v2/` assets |
| **Installation Target** | None (runs in place) | Clean user-level install into `%LOCALAPPDATA%\Phoenix\` |
| **Privileges** | N/A | User-level execution (`RequestExecutionLevel user`, no UAC prompt) |
| **Shortcuts** | None | Desktop (`Phoenix.lnk`) and Start Menu (`Programs\Phoenix\Phoenix.lnk`) with app icon |
| **Uninstaller** | None | Full Windows Settings / Add & Remove Programs uninstaller (`uninstall.exe`) |
| **Data Safety** | Manual | Automatic: Reinstall/upgrade strictly preserves `%LOCALAPPDATA%\Phoenix\data\` |

---

## 3. Technical Architecture & Component Strategy

### A. NSIS Installer Architecture (`installer/phoenix-setup.nsi`)
1. **Execution Level:** `RequestExecutionLevel user`
   - Installs to `$LOCALAPPDATA\Phoenix`.
   - Never triggers Windows User Account Control (UAC) prompts.
   - Restricts file access strictly to the active Windows user profile.
2. **Solid LZMA Compression:**
   - Pre-packages `Phoenix.exe`, `node/node.exe`, and the pruned production `service/` tree.
   - Compresses ~600 MB of uncompressed binaries and modules into ~100–140 MB.
3. **Shortcuts & Shell Registration:**
   - Desktop Shortcut: `$DESKTOP\Phoenix.lnk` → `$INSTDIR\Phoenix.exe` (Icon: `icon.ico`, WorkingDir: `$INSTDIR`).
   - Start Menu: `$SMPROGRAMS\Phoenix\Phoenix.lnk` and `$SMPROGRAMS\Phoenix\Uninstall Phoenix.lnk`.
   - Registry Registration:
     - `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix`
     - Keys: `DisplayName`, `DisplayIcon`, `DisplayVersion`, `Publisher`, `InstallLocation`, `UninstallString`.
4. **Upgrade & Data Preservation:**
   - The installer checks if `%LOCALAPPDATA%\Phoenix\data\` exists.
   - Application binaries (`Phoenix.exe`, `node/`, `service/`) are overwritten with the latest versions.
   - **`%LOCALAPPDATA%\Phoenix\data\` is NEVER overwritten, touched, or cleared.**
   - Existing databases (`phoenix.db`), encryption keys (`phoenix.key`), and personal memory graphs persist across all updates.
5. **Clean Uninstaller (`uninstall.exe`):**
   - Gracefully terminates running `Phoenix.exe` and background `node.exe` processes.
   - Removes Desktop and Start Menu shortcuts.
   - Removes application directory (`$INSTDIR\node`, `$INSTDIR\service`, `$INSTDIR\Phoenix.exe`).
   - Prompts the user:
     *"Do you want to keep your private memory database and personal notes? Click 'Yes' to preserve your memories in case you reinstall later. Click 'No' to permanently delete your data."*
     - If `Yes`: Leaves `%LOCALAPPDATA%\Phoenix\data\` intact.
     - If `No`: Cleans up `%LOCALAPPDATA%\Phoenix\data\`.
   - Cleans up registry keys under `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix`.

### B. Portable Node.js Runtime
- **Version:** Node.js v22.x LTS (x64 Windows).
- **Placement:** `$INSTDIR\node\node.exe`.
- **Runtime Resolution:** The existing supervisor in `service/tauri/src-tauri/src/backend.rs` already contains logic to inspect `exe_dir.join("node").join("node.exe")`. This enables immediate zero-configuration startup without touching system PATH.

### C. Production Release Script (`service/scripts/build-release.js`)
- Single orchestrator script executing:
  1. **Frontend Compilation:** Executes `npm run build` in `service/dashboard` (produces `service/public/v2/`).
  2. **Shell Compilation:** Executes `cargo build --release` in `service/tauri/src-tauri` (produces `phoenix-shell.exe`, copied to `Phoenix.exe`).
  3. **Payload Staging:** Assembles clean production payload into `dist/staging/`:
     - `Phoenix.exe`
     - `node/node.exe` (copies or acquires portable Node.js LTS binary)
     - `service/` (includes `phoenix.js`, `package.json`, `src/`, `public/v2/`, and production `node_modules/`; excludes git, tests, dashboard source, dev dependencies)
  4. **NSIS Compilation:** Invokes `makensis` on `installer/phoenix-setup.nsi` targeting `dist/staging/`.
  5. **Release Publishing:** Emits `Phoenix-Setup.exe` into `the final exe file/Phoenix-Setup.exe` and reports binary size and hashes.

---

## 4. Exact Files Expected to Change / Be Created

### A. Existing Files to Modify
1. `[MODIFY]` [`installer/phoenix-setup.nsi`](file:///c:/Personal%20Coding/Projects/Phoenix/installer/phoenix-setup.nsi)
   - Rewrite to package the full pre-bundled offline payload, portable Node runtime, shortcuts, uninstaller registry entries, and user-data preservation logic.
2. `[MODIFY]` [`service/package.json`](file:///c:/Personal%20Coding/Projects/Phoenix/service/package.json)
   - Add `"build:release": "node scripts/build-release.js"` and `"package:windows": "node scripts/build-release.js"`.

### B. New Files to Create
1. `[NEW]` [`service/scripts/build-release.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/scripts/build-release.js)
   - Master release builder script orchestrating dashboard build, Tauri build, staging, portable node acquisition, and NSIS compilation.
2. `[NEW]` [`service/test-acceptance-phase7.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/test-acceptance-phase7.js)
   - Automated acceptance test verifying installer existence, valid PE headers, bundled payload components, shortcut targets, data preservation logic, and Phase 3–6 regression criteria.

### C. Output Artifacts Produced Upon Build
1. `[OUTPUT]` `the final exe file\Phoenix-Setup.exe` (Standalone self-extracting Windows installer).

---

## 5. Explicit List of Out-of-Scope Items

To avoid scope creep and maintain strict project boundaries:
- **No Database Schema Changes:** Zero migrations, zero schema alterations, zero new SQL tables.
- **No Localhost Lockdown / CSP Hardening:** Binding restrictions and strict CSP belong strictly to **Phase 8**.
- **No Backup Compression Engine:** Creating zip archives or backup files on disk belongs strictly to **Phase 9**.
- **No Cloud Auto-Updates:** GitHub release polling and silent updater services belong strictly to **Phase 10**.
- **No Linux / macOS Packaging:** Phase 7 is strictly Windows packaging (NSIS, portable node.exe, Windows shortcuts).

---

## 6. Verification & Regression Protection Plan

### A. Preservation of Phase 1–6 Baseline
1. **Phase 1–2 (Readiness & Supervisor):**
   - The packaged `Phoenix.exe` must launch `node/node.exe` with `service/phoenix.js start --supervised`, bind to port 7777, and report `READY` status.
2. **Phase 3 (Ollama & Local AI):**
   - The installer must never install or bundle Ollama. External Ollama PID `31380` must remain completely untouched (`EXTERNAL_UNMANAGED`).
   - Strict local AI mode with zero silent cloud fallback must remain active.
3. **Phase 4 (Error Humanizer & Recovery):**
   - `HumanErrorCard.svelte` and `error-humanizer.js` must be packaged in the production assets.
4. **Phase 5 (In-App Help Center):**
   - `/v2/help.html` and the full 18-topic catalog must be present in the packaged `service/public/v2/`.
5. **Phase 6 (Consumer Settings & Developer Mode):**
   - The redesigned 5 consumer tabs, `PrivacySensesCard.svelte`, and gated Developer Mode must be packaged in `service/public/v2/`.

### B. Acceptance Test Suite (`service/test-acceptance-phase7.js`)
The acceptance test will verify:
1. `Phoenix-Setup.exe` exists in `the final exe file\`.
2. Installer file size is reasonable for a bundled desktop app (~80–150 MB).
3. Payload staging contains `Phoenix.exe`, `node\node.exe`, `service\phoenix.js`, and production `node_modules`.
4. Shortcut creation script points to `$INSTDIR\Phoenix.exe` with working directory `$INSTDIR`.
5. Reinstall/upgrade logic leaves `%LOCALAPPDATA%\Phoenix\data\` intact.
6. Uninstaller is registered in `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix`.
7. Zero regressions on Phase 3, Phase 4, Phase 5, and Phase 6 acceptance criteria.

---

## 7. Step-by-Step Implementation Order (Upon Authorization)

1. **Step 1:** Create `service/scripts/build-release.js` with staging and NSIS build orchestration.
2. **Step 2:** Update `installer/phoenix-setup.nsi` to implement the offline pre-packaged installer architecture with user-level installation, shortcuts, uninstaller registry, and data preservation.
3. **Step 3:** Update `service/package.json` with release packaging scripts.
4. **Step 4:** Create `service/test-acceptance-phase7.js`.
5. **Step 5:** Execute `node service/scripts/build-release.js` to compile the installer.
6. **Step 6:** Run full test and regression verification:
   - `node test-acceptance-phase3.js`
   - `node test-acceptance-phase4.js`
   - `node test-acceptance-phase5.js`
   - `node test-acceptance-phase6.js`
   - `node test-acceptance-phase7.js`
7. **Step 7:** Document walkthrough and report final verification evidence.
