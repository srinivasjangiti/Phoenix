# Phoenix Phase 7: Windows Packaging — Pre-Implementation Audit & Verification

**Date:** 2026-09-09  
**Status:** COMPLETED & VERIFIED  
**Scope:** Repository-wide audit of packaging, installers, runtime distribution, portable Node.js, shortcut generation, desktop shell supervisor, and uninstall/reinstall behavior across the Phoenix codebase (`installer/`, `service/tauri/`, `service/scripts/`, `service/package.json`, `the final exe file/`).  
**Objective:** Ground Phase 7 in verified repository reality to design an offline-capable, consumer-grade NSIS installer (`Phoenix-Setup.exe`) that packages the Tauri desktop shell (`Phoenix.exe`), portable Node.js runtime (`node.exe`), production backend service (`service/` + production `node_modules`), and compiled SvelteKit dashboard (`service/public/v2/`), while creating proper shortcuts, Windows uninstaller registration, and absolute preservation of existing user data.

---

## 1. Official Phase 7 Definition & Roadmap Authority

In [`docs/IMPLEMENTATION/PHOENIX-PRODUCTIZATION-PLAN.md`](file:///c:/Personal%20Coding/Projects/Phoenix/docs/IMPLEMENTATION/PHOENIX-PRODUCTIZATION-PLAN.md) (Lines 203–221), Phase 7 is defined as:

```text
### Phase 7: Windows Packaging

#### Installer Architecture (`installer/phoenix-setup.nsi`)
- Pre-packages:
  - Compiled Tauri desktop executable (`Phoenix.exe`)
  - Portable Node.js runtime (`node.exe`)
  - Production service bundle (`service/` + production `node_modules`)
  - Compiled SvelteKit dashboard (`service/dashboard/build` / `service/public/v2`)
- Creates:
  - Desktop shortcut: `Phoenix`
  - Start Menu shortcut: `Phoenix`
  - Clean uninstaller registered in Windows Settings / Add & Remove Programs.
- User-level install default (no admin required unless Windows Service mode requested).

#### Release Script (`service/scripts/build-release.js`)
- Single command building dashboard, Tauri release binary, production dependencies, and invoking NSIS compiler.
```

---

## 2. Current State of Packaging & Install Capability

### A. Current Production Binary (`the final exe file\Phoenix.exe`)
1. **Nature of Binary:** A 18.4 MB (18,442,752 bytes) Rust executable compiled with Tauri v2.
2. **Supervisor Lifecycle (`service/tauri/src-tauri/src/backend.rs`):**
   - Implements `resolve_runtime_paths()` (lines 515–609).
   - Looks for `phoenix.js` in `exe_dir` or `service/phoenix.js` relative to `exe_dir`.
   - Looks for portable `node.exe` in `exe_dir/node/node.exe` or `exe_dir/node.exe`.
   - If not found, falls back to `C:\Program Files\nodejs\node.exe` or global `node` in PATH.
3. **Current Distribution Flaw:**
   - On a clean consumer Windows PC without development repositories or pre-installed Node.js, double-clicking `Phoenix.exe` standalone will **fail** because neither `node.exe` nor `service/` exist in its directory.
   - `Phoenix.exe` is currently an unbundled executable, not an installed product.

### B. Existing Installer Infrastructure
1. **`installer/phoenix-setup.nsi`:**
   - 86 lines of NSIS script.
   - *Current Limitation:* It is currently a thin wrapper that extracts `install.ps1` and invokes it as Administrator. It does **not** pre-package the offline application payload, portable Node.js, or production `node_modules`.
2. **`installer/install.ps1`:**
   - 363 lines of PowerShell.
   - *Current Limitation:* It attempts to download portable Node.js from `nodejs.org` and runs `npm install --omit=dev` directly on the target machine.
   - *Why this is inadequate for consumer distribution:*
     - Requires high-speed, uncensored internet at install time.
     - Requires `npm` and potentially C++ build tools if any dependency triggers rebuilds.
     - Takes 3–5 minutes to install rather than 10 seconds.
     - Fails completely offline or in restricted corporate networks.
3. **`service/scripts/build-installer.js`:**
   - 44 lines of Node.js using `@yao-pkg/pkg`.
   - *Current Scope:* Compiles `service/installer/phoenix-installer.cjs` for client devices (`Phoenix-Client`), not the primary Phoenix desktop OS.

---

## 3. What is Missing for True Consumer Packaging

1. **Self-Contained Installer Payload:**
   The NSIS installer must package all runtime assets into a single distributable setup binary (`Phoenix-Setup.exe`):
   - `Phoenix.exe` (Tauri desktop window & supervisor)
   - `node/node.exe` (Portable Node.js LTS executable)
   - `service/` (Backend service engine, scripts, and production `node_modules`)
   - `service/public/v2/` (Pre-compiled SvelteKit dashboard static bundle)
2. **User-Level Execution (`RequestExecutionLevel user`):**
   - Installs by default to `$LOCALAPPDATA\Phoenix` (`C:\Users\<User>\AppData\Local\Phoenix`).
   - **Zero UAC Administrator prompts required.** Normal users can install without IT elevation.
3. **Windows Shell Integration:**
   - Desktop shortcut: `%USERPROFILE%\Desktop\Phoenix.lnk` pointing to `$INSTDIR\Phoenix.exe`.
   - Start Menu shortcut: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Phoenix\Phoenix.lnk`.
   - Application icon embedded (`service/tauri/src-tauri/icons/icon.ico`).
4. **Clean Windows Uninstaller & Add/Remove Programs:**
   - Generated `uninstall.exe` in `$INSTDIR`.
   - Windows Registry registration under `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix`:
     - `DisplayName`, `DisplayIcon`, `DisplayVersion`, `Publisher`, `UninstallString`, `QuietUninstallString`.
5. **Data Preservation Safeguards:**
   - **On Upgrade / Reinstall:** The installer must overwrite application files (`Phoenix.exe`, `node/`, `service/`), but **must NEVER overwrite or touch `$LOCALAPPDATA\Phoenix\data/`** (`phoenix.db`, `phoenix.key`, `audit.key`). All personal memories survive upgrades automatically.
   - **On Uninstall:** The uninstaller must ask the user whether they wish to keep or delete their personal memories and database.
6. **Automated Master Build Pipeline (`service/scripts/build-release.js`):**
   - A single automated script that runs:
     1. `npm run build` in `service/dashboard`
     2. `cargo build --release` in `service/tauri/src-tauri`
     3. Stages production files and copies portable `node.exe`
     4. Compiles NSIS installer into `the final exe file\Phoenix-Setup.exe`

---

## 4. Runtime & Dependency Packaging Strategy

### A. Portable Node.js Runtime
- **Version:** Node.js v22.x LTS (x64 Windows).
- **Format:** Portable standalone binary (`node.exe`).
- **Placement:** Placed at `$INSTDIR\node\node.exe`.
- **Integration with Supervisor:** `service/tauri/src-tauri/src/backend.rs` (lines 572–588) specifically searches for `exe_dir.join("node").join("node.exe")`. When placed in `$INSTDIR\node\node.exe`, `Phoenix.exe` detects and uses it immediately without inspecting system PATH.

### B. Production Service Bundle
- To keep the installer clean and under ~120 MB compressed:
  - **Included:** `phoenix.js`, `package.json`, `src/`, `public/v2/`, production `node_modules/`.
  - **Excluded:** `.git`, `.github`, `service/dashboard/src`, `service/dashboard/node_modules`, `service/src/__tests__`, `service/tauri/src-tauri/target`, `.bak` files, cache files.

---

## 5. Security & Privacy Review

1. **User-Space Isolation:**
   - Installing to `$LOCALAPPDATA\Phoenix` restricts access to the current Windows user profile.
   - Other local Windows accounts cannot read or tamper with Phoenix's database or keys.
2. **Database Key Protection:**
   - `%LOCALAPPDATA%\Phoenix\data\phoenix.key` and `phoenix.db` inherit user-only NTFS ACL permissions.
   - The installer does not export, log, or transmit encryption keys.
3. **Network Boundary:**
   - The packaging process introduces zero external telemetry, zero tracking scripts, and zero cloud update pings.
   - Loopback binding (`127.0.0.1:7777`) remains strict.

---

## 6. Database Impact

* **Database Migrations:** **NONE (0 schema changes, 0 new tables, 0 altered columns)**.
* **Storage Location:** `%LOCALAPPDATA%\Phoenix\data\phoenix.db`.
* **Preservation Rule:** The installer never touches `%LOCALAPPDATA%\Phoenix\data\` during install or upgrade.

---

## 7. Preservation of Prior Phases (1–6)

1. **Phase 1–2 (Readiness & Supervisor):**
   - `backend.rs` already supports the portable folder hierarchy.
2. **Phase 3 (Ollama & Local AI):**
   - Packaging does not bundle Ollama into Phoenix's directory. Ollama remains managed independently by the user in `%LOCALAPPDATA%\Programs\Ollama` with external PID preservation (`EXTERNAL_UNMANAGED`).
   - Strict local AI mode with zero silent cloud fallback is preserved.
3. **Phase 4 (Error Humanizer):**
   - `HumanErrorCard.svelte` and `error-humanizer.js` are packaged in production assets.
4. **Phase 5 (Help Center):**
   - Pre-compiled in `service/public/v2/help.html` and available offline in the installed app.
5. **Phase 6 (Consumer Settings):**
   - Redesigned 5 consumer tabs, `PrivacySensesCard.svelte`, and Developer Mode gating are pre-compiled into the installed package.

---

## 8. Audit Conclusion

* **Current Capability:** Phoenix has a compiled desktop shell (`Phoenix.exe`), a working service, and a built dashboard, but **lacks an offline, self-contained Windows installer package**.
* **Phase 7 Readiness:** The codebase, Tauri supervisor, and NSIS architecture are completely understood and primed for Phase 7 implementation once authorized.
