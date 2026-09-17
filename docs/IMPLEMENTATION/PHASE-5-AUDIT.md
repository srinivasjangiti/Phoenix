# Phoenix Phase 5: In-App Help Center — Codebase Audit

**Date:** 2026-09-08  
**Scope:** Repository-wide audit of user documentation, in-app guidance, navigation architecture, search capabilities, and user onboarding pathways across the Phoenix codebase (`service/dashboard`, `service/src`, `documentation/`, `docs/IMPLEMENTATION/`).  
**Objective:** Ground Phase 5 in verified repository reality to provide an in-app, searchable, plain-English Help Center for non-technical Windows users without introducing regressions, cloud leaks, or database migrations.

---

## 1. Official Phase 5 Definition & Roadmap Determination

### A. Repository Roadmap Search Evidence
A systematic search across all repository documentation confirms the exact productization roadmap:
1. **Primary Roadmap Document:** [`docs/IMPLEMENTATION/PHOENIX-PRODUCTIZATION-PLAN.md`](file:///c:/Personal%20Coding/Projects/Phoenix/docs/IMPLEMENTATION/PHOENIX-PRODUCTIZATION-PLAN.md) (Lines 65–87):
   ```text
   ## Implementation Sequence (Approved 10-Phase Roadmap)

   1. Unified Desktop Runtime (Supervisor & Service Manager)
           ↓
   2. First-Run / Readiness System (Onboarding Wizard & State Machine)
           ↓
   3. AI / Ollama Manager (Detection, Guidance, SSE Model Pull)
           ↓
   4. Error & Recovery (Human-Readable Error Translation Layer)
           ↓
   5. Help Center (Searchable In-App Plain-English Knowledge)
           ↓
   6. Settings / Privacy / Permissions (Consumer-Grade UI)
           ↓
   7. Packaging (NSIS Installer, Portable Node.js, Shortcut Generation)
           ↓
   8. Security Hardening (Localhost Lockdown, CSP, IPC Validation)
           ↓
   9. Backup / Data Flow / Privacy Validation (Backup & Restore Engine)
           ↓
   10. Updates + Release Validation (Update Checker & Acceptance Test)
   ```
2. **Phase 5 Specific Section:** [`docs/IMPLEMENTATION/PHOENIX-PRODUCTIZATION-PLAN.md`](file:///c:/Personal%20Coding/Projects/Phoenix/docs/IMPLEMENTATION/PHOENIX-PRODUCTIZATION-PLAN.md) (Lines 176–187):
   ```text
   ### Phase 5: In-App Help Center

   #### [NEW] `service/dashboard/src/routes/help/+page.svelte`
   - Built-in, searchable user guide based on `PHOENIX-EXPLAINED.md` and `PHOENIX-EXPLAINED-MINI.md`.
   - Categorized into:
     - Getting Started: What is Phoenix, first steps, asking questions.
     - Memory: How memory works, searching memory, what is stored.
     - AI Engines: Local vs Cloud, changing models.
     - Privacy: Senses, permissions, what leaves your computer.
     - Backup & Restore: How to safeguard your data.
     - Troubleshooting: Resolving common issues with one click.
   ```
3. **Cross-Phase Confirmation:** [`docs/IMPLEMENTATION/PHASE-4-AUDIT.md`](file:///c:/Personal%20Coding/Projects/Phoenix/docs/IMPLEMENTATION/PHASE-4-AUDIT.md) (Line 15):
   > "Preceded by Phase 1 (Single Executable & Desktop Supervisor), Phase 2 (First-Run & Readiness System), and Phase 3 (AI / Ollama Manager). Followed by Phase 5 (In-App Help Center) through Phase 10."
4. **Audit Priority Matrix:** [`docs/IMPLEMENTATION/PHOENIX-PRODUCTIZATION-AUDIT.md`](file:///c:/Personal%20Coding/Projects/Phoenix/docs/IMPLEMENTATION/PHOENIX-PRODUCTIZATION-AUDIT.md) (Lines 244–249, 408):
   > "Blocker 4: No In-App Help — All documentation lives in GitHub markdown files... There is no in-app help, tutorial, or FAQ."
   > "In-app Help center: P1, Medium priority."

### B. Roadmap Status Summary
- **Total Number of Phases:** Exactly **10 Phases** (explicitly documented and approved).
- **Completed Phases:**
  - Phase 1: Unified Desktop Runtime (Supervisor & Service Manager) — Completed & Verified
  - Phase 2: First-Run & Readiness System (Onboarding Wizard & State Machine) — Completed & Verified
  - Phase 3: AI / Ollama Manager (Detection, Guidance, SSE Model Pull) — Completed & Verified
  - Phase 4: Error & Recovery (Human-Readable Error Translation Layer) — Completed & Verified
- **Current Next Phase:**
  - **Phase 5: In-App Help Center** (Searchable In-App Plain-English Knowledge)
- **Phase 5 Definition Status:**
  - **WELL DEFINED — READY FOR IMPLEMENTATION**

---

## 2. Current State of User Help & Documentation

### A. Existing Documentation Assets on Disk
The repository already contains high-quality, pre-written, plain-language educational material created specifically for normal users:
1. [`documentation/PHOENIX-EXPLAINED.md`](file:///c:/Personal%20Coding/Projects/Phoenix/documentation/PHOENIX-EXPLAINED.md) (39,281 bytes, 16 distinct sections):
   - Comprehensive explanation of Phoenix's purpose, difference from amnesiac chatbots, body vs brain concept.
   - 3 types of memory (Episodic, Semantic, Procedural).
   - Local vs Cloud processing.
   - Step-by-step real-world use cases (e.g. Sarah's history paper, school club logo).
   - Component map, common FAQs, and realistic boundaries of today's functionality vs future concepts.
2. [`documentation/PHOENIX-EXPLAINED-MINI.md`](file:///c:/Personal%20Coding/Projects/Phoenix/documentation/PHOENIX-EXPLAINED-MINI.md) (8,407 bytes):
   - Fast 2-minute overview with 30-second summary table, memory drawers, everyday prompt cheatsheet, and quick FAQs.

### B. Current In-App Deficiencies
1. **Zero In-App Route:** Navigating to `/v2/help` currently falls back to `index.html` (SPA fallback) because no `service/dashboard/src/routes/help/+page.svelte` exists.
2. **Missing Navigation Link:** The sidebar navigation in [`service/dashboard/src/routes/+layout.svelte`](file:///c:/Personal%20Coding/Projects/Phoenix/service/dashboard/src/routes/+layout.svelte) defines tabs for `Terminal`, `Automation`, `Projects`, `Sensors`, `Data`, and `Settings`. There is no `Help` or `Guide` entry.
3. **No Header/User Menu Help Link:** The user profile dropdown menu only offers `Settings` and `Sign Out`.
4. **Isolated Documentation:** Non-technical desktop users who download and run `Phoenix.exe` have no access to the repository's GitHub markdown files unless they inspect project source code, leaving them without guidance on how to ask questions, manage memory, or troubleshoot local AI.

---

## 3. Missing Work Analysis for Phase 5

To turn the existing static documentation into an engaging, consumer-grade Help Center, the following components must be built:

1. **Dedicated Help Route (`service/dashboard/src/routes/help/+page.svelte`):**
   - Clean, modern layout matching Phoenix's dark aesthetic (`#0e0e16`, `#1e1e2e`).
   - Prominent, instant-search input bar: *"How can we help you today?"*.
   - Filter chips by category.
   - Responsive grid of 6 core category cards.
   - Article reader / expander with copyable prompt snippets and highlighted takeaways.
   - Quick FAQ accordion for fast answers to common questions.

2. **Structured Knowledge Base Catalog (`service/dashboard/src/lib/help-catalog.js`):**
   - Pure client-side data structure derived from `PHOENIX-EXPLAINED.md` and `PHOENIX-EXPLAINED-MINI.md`.
   - Topics mapped into 6 mandatory categories:
     - **Getting Started:** What is Phoenix, normal chatbot vs Phoenix, first steps, prompt examples.
     - **Memory & Diary:** How memory works (Episodic, Semantic, Procedural), memory search, encryption, recall examples.
     - **AI Engines:** Local Ollama vs Cloud AI, downloading models, speed vs privacy, offline capability.
     - **Privacy & Senses:** Screen watching, desk presence, Tailscale networking, local PC residency guarantees.
     - **Backup & Safeguarding:** Data location, encryption keys (`phoenix.key`), backup export, safety.
     - **Troubleshooting & Fixes:** Waking sleeping local AI, model downloads, database lock handling, port conflicts.
   - Each topic includes: `id`, `category`, `title`, `summary`, `keywords` (for search indexing), `content` (plain-English markdown/html), and `action` (interactive deep-link).

3. **Instantaneous Client-Side Search Engine:**
   - Multi-field keyword matching (title, summary, keywords, and body text).
   - Zero-latency (<5ms) interactive search updating results as the user types.
   - 100% on-device (zero queries sent to cloud search engines or external APIs).

4. **Actionable Deep-Links:**
   - Help articles provide direct one-click action buttons into relevant app areas:
     - *"Local AI is Sleeping"* → `[Wake Up Local AI]` (calls `/api/v1/ollama/start`)
     - *"Where are my settings?"* → `[Open Settings]` (`/v2/settings`)
     - *"Check System Health"* → `[View System Status]` (`/v2/setup`)
     - *"Try Prompt in Terminal"* → `[Open Chat]` (`/v2/terminal`)

5. **Navigation Entry Points:**
   - Add `{ label: 'Help', href: `${base}/help`, icon: '❓' }` to `allTabs` in `+layout.svelte`.
   - Add `"Help & User Guide"` to the user avatar dropdown menu in `+layout.svelte`.
   - Add a `"Need Help? Open the Help Center"` link at the bottom of `settings/+page.svelte`.

---

## 4. Reusable Components & Synergies

- **Content Source:** 100% of the textual content and examples already exist in `documentation/PHOENIX-EXPLAINED.md` and `documentation/PHOENIX-EXPLAINED-MINI.md`.
- **UI Design Language:** Reuses existing Svelte 5 runes, CSS variables, card styles, and iconography from `setup/+page.svelte`, `settings/+page.svelte`, and `HumanErrorCard.svelte`.
- **Phase 4 Error System Synergy:** Error cards from Phase 4 can link directly into specific Help Center troubleshooting topics (e.g. `href="/v2/help?topic=ollama-offline"`).
- **Static Compilation Pipeline:** SvelteKit's `@sveltejs/adapter-static` compiles `routes/help/+page.svelte` into `service/public/v2/help.html` seamlessly during `npm run build`.

---

## 5. Architectural & Regression Safety Review

### A. Phase 3 (Ollama & Local AI) Safety
- **No Process Interference:** The Help Center is a presentation and guidance layer. It never invokes process termination or touches existing Ollama daemons.
- **External Ollama Preservation:** External Ollama running on port 11434 (`EXTERNAL_UNMANAGED`) remains completely untouched.
- **Strict Local Mode & Zero Cloud Fallback:** Help search is executed 100% client-side in the browser. Zero prompt or query data is transmitted to cloud LLMs.

### B. Phase 4 (Error Humanizer & Recovery) Safety
- **Non-Invasive:** Does not alter existing `humanizeError()` logic or API error payloads.
- **Enhancement:** Gives `HumanErrorCard` a persistent knowledge base to point users to when they need deeper troubleshooting.

### C. Database & Data Safety
- **Zero Schema Migrations:** Help topics and categories are bundled statically in the dashboard application bundle.
- **Zero SQL Writes:** The Help Center does not write to `phoenix.db` or create any new tables.
- **Zero Data Risk:** Existing user memories, settings, and encryption keys are untouched.

### D. Security & Privacy
- **Classification:** **100% LOCAL**.
- **No Telemetry / No Network Egress:** User search queries are never sent across the network.
- **No Credentials / Keys Required:** The Help Center operates without requiring any API keys or authentication tokens.

---

## 6. Audit Verdict

| Category | Status |
|---|---|
| **Phase 5 Definition** | **WELL DEFINED — READY FOR IMPLEMENTATION** |
| **Total Roadmap Count** | **10 Phases** (Explicitly confirmed in `PHOENIX-PRODUCTIZATION-PLAN.md`) |
| **Current Position** | Phases 1–4 Completed; Phase 5 Next |
| **Database Impact** | **None (0 migrations, 0 tables)** |
| **Network / Cloud Impact** | **None (100% local client-side)** |
| **Regression Risk** | **Zero Risk** to Phase 3 Ollama or Phase 4 Errors |
