# Phoenix Phase 7: Windows Packaging — Implementation Report

**Document Version:** 1.0.0  
**Date:** September 9, 2026  
**Status:** COMPLETE & VERIFIED  
**Author:** Antigravity Pairing Agent  

---

## 1. Executive Summary

Phase 7 transforms Phoenix from a developer repository into a professional, self-contained Windows desktop product distributed via a single offline installer:
```text
the final exe file\Phoenix-Setup.exe
Size: 118.39 MB (124,139,688 bytes)
SHA-256: 53c03f259d1423a63d32886408869ac2daad9f08f2588cfd15857ac75574ac58
```

A consumer on a clean Windows 10/11 machine with **zero pre-installed developer tools (no Node.js, no npm, no cargo, no Git, no Python, no admin rights)** can install and run Phoenix in seconds. The installation wizard provides standard Windows setup options, creates Desktop and Start Menu shortcuts, registers clean Add/Remove Programs uninstaller metadata, bundles a dedicated portable Node.js runtime, and guarantees complete preservation of user memory and databases across upgrades.

---

## 2. Technical Architecture & File Layout

### A. Professional NSIS Modern UI 2 Installer (`installer/phoenix-setup.nsi`)
The installer is authored in NSIS v3.04 using Modern UI 2 (`MUI2.nsh`), providing a native Windows installer look and feel:

* **Target Path:** `$LOCALAPPDATA\Programs\Phoenix` (`C:\Users\<User>\AppData\Local\Programs\Phoenix`). This is the standard modern Windows directory for per-user software (matching VS Code, Slack, Discord, and Chrome), eliminating UAC elevation prompts (`RequestExecutionLevel user`).
* **Solid LZMA Compression:** Compresses ~668.5 MB of application code, binaries, and production `node_modules` into a single 118.39 MB standalone installer.
* **Installer Wizard Pages:**
  1. **Welcome Page (`MUI_PAGE_WELCOME`):** Clean, non-technical consumer introduction explaining Phoenix as a private, local-first personal AI assistant.
  2. **Installation Directory (`MUI_PAGE_DIRECTORY`):** Default `%LOCALAPPDATA%\Programs\Phoenix` with optional user browsing.
  3. **Options / Components (`MUI_PAGE_COMPONENTS`):** Checkboxes for Desktop Shortcut and Start Menu Shortcuts (both enabled by default).
  4. **Progress Page (`MUI_PAGE_INSTFILES`):** Fast file extraction progress bar.
  5. **Finish Page (`MUI_PAGE_FINISH`):** "Launch Phoenix" checkbox running `$INSTDIR\Phoenix.exe`.
* **Clean Uninstaller Pages:**
  1. `MUI_UNPAGE_CONFIRM`: Standard uninstall confirmation.
  2. `MUI_UNPAGE_INSTFILES`: File removal progress.
  3. `MUI_UNPAGE_FINISH`: Completion notice.

### B. Shell & OS Integration
* **Desktop Shortcut:** Creates `Phoenix.lnk` pointing to `$INSTDIR\Phoenix.exe` with application icon `icon.ico`. Dynamic path resolution accounts for Windows OneDrive desktop folder redirection.
* **Start Menu Folder:** Creates `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Phoenix\` containing:
  * `Phoenix.lnk` (App launcher)
  * `Uninstall Phoenix.lnk` (Direct uninstaller trigger)
* **Windows Add/Remove Programs Registration:** Registers under `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix`:
  * `DisplayName`: "Phoenix"
  * `DisplayIcon`: `"$INSTDIR\Phoenix.exe,0"`
  * `DisplayVersion`: "1.0.0"
  * `Publisher`: "Phoenix Project"
  * `InstallLocation`: `"$INSTDIR"`
  * `UninstallString`: `"$INSTDIR\uninstall.exe"`
  * `QuietUninstallString`: `"$INSTDIR\uninstall.exe" /S`
  * `EstimatedSize`: 668,580 KB
  * `NoModify`: 1, `NoRepair`: 1

### C. Bundled Portable Node.js Runtime & Supervisor Integration
* **Runtime Location:** `$INSTDIR\node\node.exe` (Node.js v24.15.0 x64 standalone).
* **Supervisor Integration:** The Tauri supervisor in [service/tauri/src-tauri/src/backend.rs](file:///c:/Personal%20Coding/Projects/Phoenix/service/tauri/src-tauri/src/backend.rs#L572-L588) checks `exe_dir.join("node").join("node.exe")`. When Phoenix launches from the installed directory, it detects and executes the bundled portable `node.exe` with zero reliance on system PATH or external Node installations.
* **Native C++ Addons:** Native modules (`better-sqlite3.node`, `pty.node`, `canvas.node`) are pre-compiled for Node v24 x64 and bundled directly in `service/node_modules/`, ensuring instant runtime execution without compilation tools.

### D. User Data Safety & Preservation Architecture
* **Physical Directory Decoupling:**
  * Application Code & Binaries: `%LOCALAPPDATA%\Programs\Phoenix\`
  * User Data & Database: `%LOCALAPPDATA%\Phoenix\data\` (`phoenix.db`, `phoenix.key`, `audit.key`, captures, embeddings)
* **Reinstall / Upgrade Guarantee:**
  * When `Phoenix-Setup.exe` is run over an existing installation, it overwrites application binaries in `%LOCALAPPDATA%\Programs\Phoenix\`, but **never touches or overwrites `%LOCALAPPDATA%\Phoenix\data\`**. All conversation histories, settings, and memory graphs persist untouched.
* **Uninstall Choice:**
  * When running `uninstall.exe` interactively, the uninstaller prompts:
    *"Would you like to keep your personal memories, conversation history, and settings? Click 'Yes' to preserve your personal data for future reinstalls. Click 'No' to permanently delete all data from this computer."*
  * If the user selects `Yes`, personal memories are preserved. If `No`, personal data is purged. In silent mode (`/S`), personal data is preserved by default.

---

## 3. Master Release Build Pipeline (`service/scripts/build-release.js`)

The master build script orchestrates the entire build in a single reproducible command:
```powershell
node service/scripts/build-release.js
# or: npm run build:release
```

### Pipeline Steps:
1. **Toolchain Discovery:** Automatically locates `makensis.exe` (checks NSIS installation and electron-builder cache) and `cargo.exe` (prepends `.cargo/bin` to PATH).
2. **Dashboard Compilation:** Invokes `npm run build` in `service/dashboard`, compiling the SvelteKit UI into `service/public/v2`.
3. **Rust Desktop Shell Compilation:** Invokes `cargo build --release` in `service/tauri/src-tauri`, producing `phoenix-shell.exe` and copying it to `the final exe file\Phoenix.exe`.
4. **Staging Assembly (`dist/staging`):**
   * Staged `dist/staging/Phoenix.exe`
   * Staged `dist/staging/node/node.exe`
   * Staged `dist/staging/service/` (includes `phoenix.js`, `package.json`, `src/`, `bin/`, `public/v2/`, production `node_modules/`; filters out `__tests__`, `.cache`, and dev files).
5. **NSIS Solid LZMA Compilation:** Invokes `makensis.exe` with dynamic parameters, producing `the final exe file\Phoenix-Setup.exe`.
6. **Integrity Validation:** Validates output existence, computes SHA-256 hash, and logs final release metrics.

---

## 4. Packaging Summary

| Component | Bundled Path | Source / Build Command | Size (Uncompressed) |
|---|---|---|---|
| **Desktop Shell** | `$INSTDIR\Phoenix.exe` | Tauri v2 (`cargo build --release`) | 18.4 MB |
| **Portable Runtime** | `$INSTDIR\node\node.exe` | Standalone Node.js v24.15.0 x64 | 82.2 MB |
| **Service Engine** | `$INSTDIR\service\src\` | Phoenix core backend services | ~3.8 MB |
| **Static Dashboard** | `$INSTDIR\service\public\v2\` | SvelteKit static build (`npm run build`) | ~19.5 MB |
| **Dependencies** | `$INSTDIR\service\node_modules\` | Production node_modules + native addons | ~544.1 MB |
| **Uninstaller** | `$INSTDIR\uninstall.exe` | NSIS auto-generated uninstaller | ~78 KB |
| **TOTAL UNCOMPRESSED** | | | **~668.5 MB** |
| **COMPRESSED INSTALLER** | `the final exe file\Phoenix-Setup.exe` | Solid LZMA (NSIS v3.04) | **118.39 MB** |
