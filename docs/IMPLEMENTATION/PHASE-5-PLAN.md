# Phoenix Phase 5: In-App Help Center — Implementation Plan

**Date:** 2026-09-08  
**Scope:** Specification and implementation plan for Phase 5 of the Phoenix Productization Roadmap.  
**Objective:** Provide a beautiful, searchable, interactive, plain-English In-App Help Center inside the Phoenix desktop dashboard based on `PHOENIX-EXPLAINED.md` and `PHOENIX-EXPLAINED-MINI.md`.

---

## 1. Roadmap Overview & Phase 5 Position

### Official 10-Phase Productization Sequence
1. **Phase 1:** Unified Desktop Runtime (Supervisor & Service Manager) — **COMPLETED & VERIFIED**
2. **Phase 2:** First-Run / Readiness System (Onboarding Wizard & State Machine) — **COMPLETED & VERIFIED**
3. **Phase 3:** AI / Ollama Manager (Detection, Guidance, SSE Model Pull) — **COMPLETED & VERIFIED**
4. **Phase 4:** Error & Recovery System (Human-Readable Error Translation Layer) — **COMPLETED & VERIFIED**
5. **Phase 5:** In-App Help Center (Searchable In-App Plain-English Knowledge) — **NEXT (PLANNING STAGE)**
6. **Phase 6:** Settings / Privacy / Permissions (Consumer-Grade UI) — Planned
7. **Phase 7:** Windows Packaging (NSIS Installer, Portable Node.js, Shortcut Generation) — Planned
8. **Phase 8:** Security Hardening (Localhost Lockdown, CSP, IPC Validation) — Planned
9. **Phase 9:** Backup / Data Flow / Privacy Validation (Backup & Restore Engine) — Planned
10. **Phase 10:** Updates + Release Validation (Update Checker & Acceptance Test) — Planned

### Current Status
- **Current Phase:** Phase 4 is 100% completed, verified with zero regressions, and compiled into `the final exe file\Phoenix.exe`.
- **Next Phase:** **Phase 5: In-App Help Center**
- **Phase 5 Status:** **WELL DEFINED — READY FOR IMPLEMENTATION**

---

## 2. Plain-English Objective of Phase 5

A completely non-technical user (including someone using an AI desktop assistant for the first time) should never feel lost, confused, or forced to open GitHub markdown files to understand Phoenix. 

When a user clicks the **Help** tab or asks *"How do I use this?"*, Phoenix must present a clean, friendly, searchable in-app guide explaining:
- What Phoenix is and how it differs from normal forgetful chatbots.
- How memory works (what is saved, how to recall it, how it stays private).
- How to switch between free local offline AI (Ollama) and cloud models.
- What sensors/permissions do (screen watching, desk presence) and why they exist.
- How to safeguard personal data and create backups.
- Step-by-step troubleshooting with direct one-click actions.

All search operations must execute **instantly on-device without internet access or cloud tracking**.

---

## 3. Architecture & Component Design

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           PHOENIX DASHBOARD                             │
│                                                                         │
│   [Sidebar Nav] ──> [❓ Help] ──> /v2/help                              │
│   [User Menu]   ──> [Help & Guide]                                      │
│   [Settings]    ──> [Visit Help Center]                                 │
│   [Error Card]  ──> [Troubleshooting Guide]                             │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 /v2/help (+page.svelte)                                 │
│                                                                         │
│  🔍 Search Bar: "How can we help you today?" (Instant local filter)     │
│                                                                         │
│  ┌───────────────────────── CATEGORIES ──────────────────────────────┐  │
│  │ 🚀 Getting Started   │ 🧠 Memory & Diary    │ ⚡ AI Engines       │  │
│  │ 🛡️ Privacy & Senses  │ 💾 Backup & Safety   │ 🔧 Troubleshooting  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────── ARTICLE VIEW ─────────────────────────────┐  │
│  │ • Plain-English Explanation (from PHOENIX-EXPLAINED.md)           │  │
│  │ • Real-World Examples (e.g. Sarah's History Paper)                │  │
│  │ • Copyable Sample Prompts                                         │  │
│  │ • [One-Click Action Button] (e.g. "Wake Up Local AI", "Settings") │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌────────────────────── QUICK FAQ ACCORDION ────────────────────────┐  │
│  │ Q: Do I need to know how to code?                                 │  │
│  │ Q: Does Phoenix work offline?                                     │  │
│  │ Q: Can someone steal my notes?                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Reads static local catalog
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│        service/dashboard/src/lib/help-catalog.js (100% Local)           │
│                                                                         │
│  • 6 Core Categories with Icons, Summaries, and Badges                  │
│  • 20+ Curated Plain-Language Topics with Multi-Term Search Index       │
│  • Direct Action Payloads (navigate / api_call)                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Planned Changes by Component

### A. Frontend Dashboard (`service/dashboard`)
1. **[NEW] `service/dashboard/src/lib/help-catalog.js`:**
   - Curated knowledge dataset compiled from `PHOENIX-EXPLAINED.md` and `PHOENIX-EXPLAINED-MINI.md`.
   - Topics structured into 6 categories:
     - `getting-started`: What is Phoenix, body vs brain, first steps, prompt cheatsheet.
     - `memory`: Episodic vs semantic vs procedural, memory search, encryption, recall.
     - `ai-engines`: Local Ollama vs cloud AI, recommended models, speed vs privacy, offline operation.
     - `privacy-senses`: Screen awareness, desk presence, Tailscale private network, local disk guarantees.
     - `backup-safety`: Encrypted export/import, encryption key (`phoenix.key`), zero data loss.
     - `troubleshooting`: Local AI sleeping, downloading models, database busy, port conflicts.
   - Built-in lightweight search index matching keywords, titles, summaries, and content.
2. **[NEW] `service/dashboard/src/routes/help/+page.svelte`:**
   - Full Help Center interface with:
     - Prominent search input with clear-button.
     - Category filter pills.
     - Responsive grid of category cards.
     - Interactive article cards with expandable details.
     - Embedded action buttons linking directly to `/v2/settings`, `/v2/terminal`, `/v2/setup`, or triggering `/api/v1/ollama/start`.
     - FAQ accordion section.
3. **[MODIFY] `service/dashboard/src/routes/+layout.svelte`:**
   - Add `{ label: 'Help', href: `${base}/help`, icon: '❓' }` to `allTabs`.
   - Add `<a href="{base}/help" class="dropdown-item" onclick={closeUserMenu}>Help & User Guide</a>` to the user profile dropdown.
4. **[MODIFY] `service/dashboard/src/routes/settings/+page.svelte`:**
   - Add a helpful footer banner: *"Need help or have questions? Explore the In-App Help Center"* linking to `/v2/help`.
5. **[BUILD] Compile Dashboard:**
   - Run `npm run build` in `service/dashboard` to generate `service/public/v2/help.html` and update the static app bundle.

### B. Automated Testing (`service/src/__tests__` & Acceptance Test)
1. **[NEW] `service/src/__tests__/help-catalog.test.js`:**
   - Verifies that all 6 required categories exist and contain valid topics.
   - Verifies search indexing: query tokens like `"ollama"`, `"memory"`, `"private"`, `"backup"`, `"offline"` return expected topics.
   - Verifies that all embedded action deep-links point to valid internal routes or recognized API actions.
2. **[NEW] `service/test-acceptance-phase5.js`:**
   - Acceptance script verifying:
     - Route availability and static HTML build output.
     - Category and topic count integrity.
     - Search match determinism across key user queries.
     - Phase 3 zero-regression (external Ollama PID preserved, strict local mode intact).
     - Phase 4 zero-regression (error humanizer and PII redactor functional).

### C. Desktop Release Binary (`service/tauri`)
- Recompile `Phoenix.exe` with cargo release profile to embed the updated dashboard assets into the production binary.
- Destination: `C:\Personal Coding\Projects\Phoenix\the final exe file\Phoenix.exe`.

---

## 5. Database & Data Safety

- **Database Changes:** **NONE (0 migrations, 0 tables affected)**.
- **Affected Tables:** None.
- **Data Integrity:** User facts, episodic memory, encryption keys (`phoenix.key`), and existing settings in SQLite are completely untouched.
- **Rollback Strategy:** Reverting dashboard frontend files cleanly restores prior state without any database cleanup required.

---

## 6. Security & Privacy Classification

- **Processing Classification:** **100% LOCAL**.
- **Network / Cloud Impact:** Zero external HTTP requests. No external analytics, tracking pixels, or cloud search queries.
- **PII / Sensitive Data:** Zero personal information collected or displayed. User queries remain in temporary browser memory.
- **API Keys & Credentials:** No credentials required to access the Help Center.

---

## 7. Regression Risk Assessment & Mitigations

| Risk Factor | Assessment | Mitigation Strategy |
|---|---|---|
| **Phase 3 Ollama Process Interruption** | **Zero Risk** | Help Center is purely educational UI with optional non-destructive `/api/v1/ollama/start` trigger. It never terminates or monitors external PIDs. |
| **Silent Cloud Fallback** | **Zero Risk** | Search operates strictly client-side using JavaScript string matching. No LLM prompts are executed during help searches. |
| **Phase 4 Error System Conflict** | **Zero Risk** | Does not alter error humanization logic; deep-links from error cards to help topics expand recovery options. |
| **Bundle Size Bloat** | **Low Risk** | Plain-text topic catalog is <60KB uncompressed, adding negligible footprint to the dashboard bundle. |

---

## 8. Test Plan

### A. Automated Unit Tests
Run `node --test src/__tests__/help-catalog.test.js`:
- Test 1: Category integrity (all 6 categories populated with valid metadata).
- Test 2: Search algorithm (checks substring and keyword match for local AI, privacy, and memory queries).
- Test 3: Action target validity (verifies internal routes start with `/v2/` or match known APIs).

### B. Full Test Suite Regression Check
Run `node --test src/__tests__/*.test.js`:
- Verify all existing test suites (platform, readiness, supervisor, screen buffer, Phase 3 Ollama, Phase 4 error humanizer) pass with 0 failures.

### C. Phase 3 & Phase 4 Acceptance Verification
- Run `node test-acceptance-phase3.js` (Ollama PID preservation, local chat, zero cloud fallback).
- Run `node test-acceptance-phase4.js` (Error humanization, recovery actions, PII scrubbing).

### D. Phase 5 Live Acceptance Test
Run `node test-acceptance-phase5.js`:
- Validate presence and contents of `service/public/v2/help.html`.
- Validate that all 6 categories and their topics render correctly.
- Validate instant search queries.

### E. Production Binary Verification
- Launch compiled `the final exe file\Phoenix.exe`.
- Verify `/v2/help` opens directly from sidebar navigation and user menu.
- Verify search bar responds instantly and action buttons function.

---

## 9. Concrete Acceptance Criteria

| Criterion | Requirement | Verification Method |
|---|---|---|
| **AC-1: Dedicated Help Route** | Navigating to `/v2/help` renders the In-App Help Center without 404 or redirect errors. | Verified via static build check and browser/HTTP check. |
| **AC-2: 6 Mandatory Categories** | The Help Center contains all 6 required categories: Getting Started, Memory, AI Engines, Privacy, Backup, and Troubleshooting. | Inspected programmatically via `help-catalog.test.js`. |
| **AC-3: Zero-Latency Local Search** | Typing a keyword (e.g. "ollama", "memory", "private") updates topic results in <50ms completely offline with zero external network requests. | Verified via search unit test and client-side performance test. |
| **AC-4: Interactive Deep-Links** | Help articles feature actionable buttons linking to `/v2/settings`, `/v2/terminal`, `/v2/setup`, or `/api/v1/ollama/start`. | Verified via action dispatcher test. |
| **AC-5: Navigation Visibility** | Sidebar navigation includes a prominent `Help` tab, and user menu includes `Help & User Guide`. | Verified in layout template and compiled UI. |
| **AC-6: Zero Database Impact** | No database tables, columns, or migration scripts created. | Schema verification against `service/src/db.js`. |
| **AC-7: Zero Phase 3 Regression** | External Ollama PID `31380` remains untouched (`EXTERNAL_UNMANAGED`), zero fake readiness, zero silent cloud fallback. | Verified via `test-acceptance-phase3.js`. |
| **AC-8: Zero Phase 4 Regression** | Error humanizer and PII redaction rules remain 100% active. | Verified via `test-acceptance-phase4.js`. |
| **AC-9: Compiled Executable Updated** | Final release binary at `the final exe file\Phoenix.exe` recompiled and updated with embedded Help Center assets. | Verified via file timestamp and size. |

---

## 10. Step-by-Step Implementation Sequence

Once explicitly authorized by the user, implementation will proceed strictly in this order:

1. **Step 1: Create Help Catalog Module**
   - Create `service/dashboard/src/lib/help-catalog.js` with all 6 categories, topics, and search keywords extracted from `PHOENIX-EXPLAINED.md`.
2. **Step 2: Create Help Catalog Unit Tests**
   - Create `service/src/__tests__/help-catalog.test.js` and verify catalog structure and search determinism.
3. **Step 3: Create Help Center Svelte Route**
   - Create `service/dashboard/src/routes/help/+page.svelte` with search input, category filters, expandable article cards, action buttons, and FAQ accordion.
4. **Step 4: Update Navigation Links**
   - Update `service/dashboard/src/routes/+layout.svelte` (add Help tab to `allTabs` and user menu).
   - Update `service/dashboard/src/routes/settings/+page.svelte` (add Help Center reference link).
5. **Step 5: Compile Frontend Dashboard**
   - Run `npm run build` in `service/dashboard` to output compiled `service/public/v2/help.html` and assets.
6. **Step 6: Write Phase 5 Acceptance Test**
   - Create and run `service/test-acceptance-phase5.js`.
7. **Step 7: Run Full Test Suite & Regression Checks**
   - Run `node --test src/__tests__/*.test.js`, `test-acceptance-phase3.js`, and `test-acceptance-phase4.js`.
8. **Step 8: Compile Production Binary**
   - Recompile `Phoenix.exe` with cargo release profile and copy to `the final exe file\Phoenix.exe`.
9. **Step 9: Update Walkthrough & Documentation**
   - Update `walkthrough.md` with verification logs and present completion results.

---

## 11. Authorization Gate

> [!IMPORTANT]
> **PHASE 5 IMPLEMENTATION HAS NOT STARTED.**  
> All work performed in this turn has been audit and planning only. No application source code has been modified, no database changes were made, and no binaries were compiled. Execution will begin only upon explicit user authorization.
