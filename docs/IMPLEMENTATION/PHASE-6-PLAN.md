# Phoenix Phase 6: Settings, Privacy & Permissions Redesign — Implementation Plan

**Date:** 2026-09-08  
**Scope:** Specification and implementation plan for Phase 6 of the Phoenix Productization Roadmap.  
**Objective:** Redesign the Phoenix Settings interface from an 11-tab developer panel into a consumer-grade experience with 5 clean tabs, transparent WHAT/WHY/EXAMPLE privacy controls, and an opt-in Developer Mode toggle.

---

## 1. Objective

Convert the cluttered, developer-oriented Settings panel in `service/dashboard/src/routes/settings/+page.svelte` into an intuitive, consumer-grade settings interface suitable for a normal person (including a 15-year-old with no technical background).

The new interface must:
1. Provide **5 Clean Consumer Tabs**:
   - **Profile:** User name and appearance theme.
   - **AI Setup:** Local AI (Ollama) vs Cloud AI, model recommendations with human names, progress tracking, and masked API key inputs.
   - **Memory & Storage:** Transparent local PC storage reassurance, database statistics, and backup/restore controls.
   - **Privacy & Senses:** Screen watching, desk presence, and activity tracking explained in **WHAT / WHY / EXAMPLE / CONTROL** format.
   - **Devices:** Android companion, local PC status, Home Assistant smart lights, and Tailscale mesh.
2. Provide a **Developer Mode Toggle** in an **Advanced** tab:
   - When Developer Mode is **OFF** (default), all technical jargon (raw ports, PTY sessions, multi-tenant orgs, IMAP/SMTP raw fields, data staking) is hidden.
   - When Developer Mode is **ON**, the advanced developer controls become available in dedicated sub-panels.
3. Preserve 100% of Phase 1–5 functionality:
   - Zero termination of external Ollama processes (PID `31380`).
   - Zero silent cloud fallback in strict local mode.
   - Error humanizer cards (`HumanErrorCard.svelte`) displayed on settings errors.
   - Help Center links intact.

---

## 2. Current State vs. Target State

```text
┌───────────────────────────────────────┐       ┌───────────────────────────────────────┐
│       CURRENT SETTINGS (11 TABS)      │       │       TARGET CONSUMER SETTINGS        │
├───────────────────────────────────────┤       ├───────────────────────────────────────┤
│ • Appearance                          │       │ 👤 Profile                            │
│ • General (Port, Mode, Logs)          │       │ ⚡ AI Setup (Local vs Cloud)           │
│ • AI & Usage (Ollama, Keys, Chains)   │       │ 🧠 Memory & Storage (Local, Backup)   │
│ • Controls (Voice keys, screenshots)  │ ────> │ 🛡️ Privacy & Senses (WHAT/WHY/EXAMPLE) │
│ • Devices                             │       │ 📱 Devices (Phone, Smart Home, Mesh)  │
│ • Organizations (Multi-tenant)        │       ├───────────────────────────────────────┤
│ • Security (SQLCipher hex key)        │       │ ⚙️ Advanced (Developer Mode: OFF/ON)   │
│ • Authentication (OAuth client ID)    │       │    └─ Revealed only when toggled ON   │
│ • Remote Access (Public tunnel)       │       └───────────────────────────────────────┘
│ • Treasury (Data staking)             │
│ • Email (IMAP/SMTP raw parameters)    │
└───────────────────────────────────────┘
```

---

## 3. Missing Work Details

### A. Consumer Privacy & Senses Component (`service/dashboard/src/lib/components/PrivacySensesCard.svelte`)
Create a reusable Svelte 5 component for sensors and observations formatted strictly in the **WHAT / WHY / EXAMPLE / CONTROL** structure:
1. **Screen Watching:**
   - *What it does:* Reads the title of the active foreground window on your computer.
   - *Why Phoenix needs it:* Allows you to ask *"What was I working on before lunch?"* and summarize your day.
   - *Everyday example:* Remembers that you had "History Paper - Word" open at 2:15 PM.
   - *Control:* Toggle switch bound to `screen_enabled` in settings.
2. **Desk Presence (Webcam Glance):**
   - *What it does:* Checks if a human face is present in front of your webcam.
   - *Why Phoenix needs it:* Pauses pop-up notifications and reminders when you step away from your desk.
   - *Everyday example:* Holds your reminder until you sit back down in your chair.
   - *Control:* Toggle switch bound to `webcam_presence_enabled` in settings (clarifies that images are never saved to disk or sent anywhere).
3. **Activity & Idle Tracking:**
   - *What it does:* Measures keyboard and mouse activity to detect when you are actively working vs away.
   - *Why Phoenix needs it:* Automatically organizes your daily timeline into work sessions and breaks.
   - *Everyday example:* Pauses background timers after 5 minutes of inactivity.
   - *Control:* Toggle switch bound to `activity_tracking_enabled` in settings.
4. **Differential Privacy / Data Sharing:**
   - Plain-English explanation that notes never leave your computer unless you explicitly choose to stake anonymized research data. Bound to `privacy_enabled`.

### B. Consolidated Consumer Tabs in `settings/+page.svelte`
1. **Profile Tab:**
   - Display name input (`userName`) with instant save.
   - Theme cards with emoji previews (`Cool Guy`, `Dark`, `Nord`, etc.).
2. **AI Setup Tab:**
   - Toggle: `● On this computer (Local AI)` vs `☁️ Cloud AI`.
   - If Local AI selected:
     - Ollama status badge (`Running`, `External`, `Sleeping`).
     - Recommended model picker with human names:
       - `Llama 3.2 (1B)` — Fast & Lightweight (Recommended)
       - `Llama 3.2 (3B)` — High Quality Reasoning
       - `Qwen 2.5 (1.5B)` — Multilingual Alternative
     - Progress bar with Cancel button for downloads.
     - `[Test Local AI]` trigger.
   - If Cloud AI selected:
     - Masked API key inputs with visibility toggle (`👁️`).
     - Clear notice of which provider is active.
3. **Memory & Storage Tab:**
   - Visual card:
     ```text
     Memory Storage
     ● This Computer
       All your thoughts, facts, and chat history are stored in an encrypted database on this PC.
       Location: %LOCALAPPDATA%\Phoenix\data\phoenix.db
       Protection: AES-256 SQLCipher (Encrypted at Rest)

     Cloud Sync
       Coming soon
     ```
   - Memory statistics: Fact count, episodic events count, database file size.
   - Backup & Restore buttons (safeguard memory archive).
4. **Devices Tab:**
   - Android Companion Phone status (pairing instructions, QR code, app version).
   - Local Computer hostname and IP.
   - Smart Home (Home Assistant) connection card (URL + token with connection test).
   - Tailscale private mesh status.
5. **Advanced (Developer Mode) Tab:**
   - Prominent toggle: `Enable Developer Mode`.
   - Sub-sections unlocked when active:
     - Network & Ports (port 7777, carrier internal port).
     - System Logs (desktop log viewer).
     - Multi-tenant Organizations (`orgs`).
     - Treasury / Data Staking.
     - Email (IMAP/SMTP configuration).
     - Authentication & raw API credentials.

---

## 4. Exact Files Expected to Change / Be Created

### A. New Files to Create:
1. `[NEW]` [`service/dashboard/src/lib/components/PrivacySensesCard.svelte`](file:///c:/Personal%20Coding/Projects/Phoenix/service/dashboard/src/lib/components/PrivacySensesCard.svelte):
   - Structured WHAT/WHY/EXAMPLE/CONTROL cards for screen, webcam, activity, and differential privacy.
2. `[NEW]` [`service/src/__tests__/settings-consumer.test.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/src/__tests__/settings-consumer.test.js):
   - Unit tests verifying consumer settings persistence (`developer_mode`, `screen_enabled`, `webcam_presence_enabled`, `activity_tracking_enabled`, `ai_choice`).
3. `[NEW]` [`service/test-acceptance-phase6.js`](file:///c:/Personal%20Coding/Projects/Phoenix/service/test-acceptance-phase6.js):
   - End-to-end acceptance script verifying consumer settings structure, developer mode toggling, sensor state synchronization with `readiness.js`, and Phase 3/4/5 zero-regression checks.

### B. Existing Files to Modify:
1. `[MODIFY]` [`service/dashboard/src/routes/settings/+page.svelte`](file:///c:/Personal%20Coding/Projects/Phoenix/service/dashboard/src/routes/settings/+page.svelte):
   - Reorganize tabs into 5 consumer tabs + Advanced.
   - Integrate `PrivacySensesCard.svelte`.
   - Add Developer Mode toggle state.
2. `[BUILD]` `service/public/v2/*`:
   - Static dashboard build recompiled via `npm run build` in `service/dashboard`.
3. `[REBUILD]` [`the final exe file\Phoenix.exe`](file:///c:/Personal%20Coding/Projects/Phoenix/the%20final%20exe%20file/Phoenix.exe):
   - Production Tauri binary recompiled with embedded updated settings UI.

---

## 5. Explicit List of Out-of-Scope Items

To prevent scope creep and maintain strict project boundaries, the following are **EXPLICITLY OUT OF SCOPE** for Phase 6:
- **No Database Schema Migrations:** No altering SQL tables, adding new tables, or dropping existing columns.
- **No Changes to Windows Packaging:** NSIS installer creation and portable node.exe bundling belongs strictly to **Phase 7**.
- **No Localhost Lockdown / CSP Changes:** Content Security Policy tightening belongs strictly to **Phase 8**.
- **No New Backup Compression Engine:** Creating zip archives or backup files on disk belongs to **Phase 9**.
- **No Cloud Updates Checking:** GitHub release version polling belongs to **Phase 10**.
- **No Removal of Developer Capabilities:** Developer features (orgs, ports, email, treasury) are **NOT deleted**; they are cleanly gated behind the `Developer Mode` toggle.

---

## 6. Database & Data Safety

- **Database Changes:** **NONE (0 migrations, 0 tables modified)**.
- **Persistence Mechanism:** Settings keys are saved via existing `PUT /api/v1/settings` which performs `INSERT OR REPLACE INTO settings (key, value, updated_at)`.
- **Existing Keys Preserved:** `screen_enabled`, `voice_enabled`, `activity_tracking_enabled`, `ai_choice`, `ai_engine_choice`, `user_name`, `theme`.
- **New Key Added to settings table:** `developer_mode` (`'0'` or `'1'`).
- **Data Safety:** 100% safe. No user facts, memories, or database encryption keys are modified or deleted.

---

## 7. Security & Privacy Impact

- **Classification:** **100% LOCAL**.
- **Zero Cloud Leaks:** Toggling sensors or switching settings does NOT send telemetry to cloud services.
- **Secret Redaction:** API keys entered in settings continue to be redacted across API responses by `secrets.js`.
- **Privacy Transparency:** Non-technical users receive explicit, unambiguous explanations of what data is collected by each sensor and can disable all sensors with a single click.

---

## 8. Regression Risk Assessment & Mitigations

| Risk Factor | Assessment | Mitigation Strategy |
|---|---|---|
| **Phase 3 Ollama Process Interruption** | **Zero Risk** | Settings UI calls existing `/api/v1/ollama/*` routes. External Ollama PID `31380` (`EXTERNAL_UNMANAGED`) remains untouched. |
| **Strict Local Mode Regression** | **Zero Risk** | Selecting Local AI continues to enforce `ai_choice = 'local'` without silent cloud fallback. |
| **Phase 4 Error Recovery** | **Zero Risk** | Settings form errors continue to display `HumanErrorCard` with plain-English fixes. |
| **Phase 5 Help Center Links** | **Zero Risk** | Settings sidebar retains the `❓ Help Center ↗` link created in Phase 5. |
| **Readiness State Disconnect** | **Zero Risk** | Sensor toggles update `screen_enabled`, `voice_enabled`, and `activity_tracking_enabled`, directly aligning with `service/src/readiness.js`. |

---

## 9. Test Plan

### A. Automated Unit Tests
Run `node --test src/__tests__/settings-consumer.test.js`:
- Test 1: Settings persistence for consumer keys (`developer_mode`, `screen_enabled`, `activity_tracking_enabled`).
- Test 2: Secret redaction verification (keys saved in DB are never exposed plaintext in `GET /api/v1/settings`).
- Test 3: Sensor toggle synchronization with readiness state machine.

### B. Full Test Suite Regression
Run `node --test src/__tests__/*.test.js`:
- Verify all 16 test suites (help catalog, error humanizer, ollama manager, platform, readiness, supervisor, screen buffer) pass with 0 failures.

### C. Acceptance Verification (`service/test-acceptance-phase6.js`)
- Verify `/v2/settings.html` static compilation.
- Verify that default settings render 5 consumer tabs with Developer Mode OFF.
- Verify that toggling Developer Mode ON reveals advanced technical panels.
- Verify Phase 3 zero-regression (`test-acceptance-phase3.js`).
- Verify Phase 4 zero-regression (`test-acceptance-phase4.js`).
- Verify Phase 5 zero-regression (`test-acceptance-phase5.js`).

### D. Real Binary Verification
- Launch `the final exe file\Phoenix.exe`.
- Verify Settings opens with clean 5 consumer tabs.
- Verify Developer Mode toggle works interactively.

---

## 10. Concrete Acceptance Criteria

| ID | Requirement | Verification Method |
|---|---|---|
| **AC-1: 5 Consumer Tabs** | Settings navigation displays 5 clear consumer tabs: Profile, AI Setup, Memory & Storage, Privacy & Senses, and Devices. | Verified via DOM / static build inspection. |
| **AC-2: Developer Mode Toggle** | An Advanced tab provides a Developer Mode toggle. When OFF, developer technical sections are hidden; when ON, they are revealed. | Verified via UI state test and unit test. |
| **AC-3: WHAT/WHY/EXAMPLE Format** | Privacy & Senses explains Screen Watching, Desk Presence, and Activity Tracking with WHAT, WHY, and EXAMPLE text before each toggle. | Inspected programmatically in `PrivacySensesCard.svelte`. |
| **AC-4: Readiness Synchronization** | Toggling sensors in Settings immediately updates the status in `GET /api/v1/readiness`. | Verified via readiness test script. |
| **AC-5: Local Memory Reassurance** | Memory & Storage displays explicit "● This Computer" storage assurance with database path and stats. | Verified in settings template. |
| **AC-6: Zero Database Migrations** | No database tables, columns, or migration scripts created. | Schema verification against `service/src/db.js`. |
| **AC-7: Zero Phase 3 Regression** | External Ollama PID `31380` untouched (`EXTERNAL_UNMANAGED`), zero fake readiness, zero silent cloud fallback. | Verified via `test-acceptance-phase3.js`. |
| **AC-8: Zero Phase 4 Regression** | Error humanizer and PII redactor remain 100% active. | Verified via `test-acceptance-phase4.js`. |
| **AC-9: Zero Phase 5 Regression** | Help Center at `/v2/help` remains fully functional and accessible. | Verified via `test-acceptance-phase5.js`. |
| **AC-10: Production Binary Updated** | `the final exe file\Phoenix.exe` recompiled with updated release build. | Verified via file timestamp and size. |

---

## 11. Step-by-Step Implementation Sequence

Once explicitly authorized by the user, implementation will proceed strictly in this order:

1. **Step 1: Create `PrivacySensesCard.svelte` Component**
   - Implement consumer WHAT/WHY/EXAMPLE/CONTROL cards for screen, webcam, activity, and differential privacy.
2. **Step 2: Create Settings Consumer Unit Tests**
   - Implement `service/src/__tests__/settings-consumer.test.js` and verify settings persistence and readiness synchronization.
3. **Step 3: Redesign `settings/+page.svelte` Layout & Tabs**
   - Consolidate the 11 tabs into 5 consumer tabs: Profile, AI Setup, Memory & Storage, Privacy & Senses, Devices.
   - Embed the Developer Mode toggle in the Advanced tab, gating technical sections cleanly.
4. **Step 4: Compile Frontend Dashboard**
   - Run `npm run build` in `service/dashboard` to generate `service/public/v2/settings.html`.
5. **Step 5: Create and Run Phase 6 Acceptance Test**
   - Implement and execute `service/test-acceptance-phase6.js`.
6. **Step 6: Run Full Test Suite & Regression Checks**
   - Run `node --test src/__tests__/*.test.js`, `test-acceptance-phase3.js`, `test-acceptance-phase4.js`, and `test-acceptance-phase5.js`.
7. **Step 7: Recompile Production Release Binary**
   - Run `cargo build --release` in `service/tauri/src-tauri` and copy to `the final exe file\Phoenix.exe`.
8. **Step 8: Update Walkthrough Documentation**
   - Update `walkthrough.md` with Phase 6 verification evidence.

---

## 12. Authorization Gate

> [!IMPORTANT]
> **PHASE 6 IMPLEMENTATION HAS NOT STARTED.**  
> All work performed in this turn has been audit and planning only. No application source code has been modified, no database changes were made, and no binaries were compiled. Execution will begin only upon explicit user authorization.
