# S01: Registration Contract & Seat Engine

**Goal:** Establish a deterministic registration intake contract that writes stable workflow state into the sheet and assigns seats without capacity drift.
**Demo:** Given fixture registrations, the seat engine assigns batches deterministically, enforces hard caps, and routes overflow to waitlist while writing canonical intake states.

## Must-Haves

- `Form Responses` sheet contract (tab + state columns H–L) is explicit and validated before row mutation.
- Intake flow writes canonical initial state (`Payment Status=PENDING`, `Status=REGISTERED`) for non-waitlist rows.
- Seat engine applies deterministic auto-shift behavior and never exceeds configured per-batch capacity.
- Waitlist behavior is explicit and traceable when all batches are full.

## Proof Level

- This slice proves: contract
- Real runtime required: no
- Human/UAT required: no

## Verification

- `bash scripts/verify-s01-sheet-contract.sh`
- `node scripts/verify-s01-seat-engine.mjs`

## Observability / Diagnostics

- Runtime signals: row-level `Status`, `Payment Status`, and `Notes` transitions; structured `Logger.log` lifecycle events for assignment and intake outcome.
- Inspection surfaces: `Form Responses` columns H–L; verification scripts; script execution logs.
- Failure visibility: explicit intake note/status tags for schema/config mismatch and waitlist routing.
- Redaction constraints: never log full payment credentials or secrets.

## Integration Closure

- Upstream surfaces consumed: `01_apps_script_code.md`, `02_sheet_template.md`, `05_setup_playbook.md`.
- New wiring introduced in this slice: versioned Apps Script source and local contract-verification scripts.
- What remains before the milestone is truly usable end-to-end: webhook reconciliation invariants (S02), operator exception workflow (S03), and real integrated run proof (S04).

## Tasks

- [x] **T01: Version Apps Script intake contract from source docs** `est:40m`
  - Why: Convert markdown-only draft logic into a canonical script artifact with explicit schema and config guardrails.
  - Files: `apps-script/Code.gs`, `apps-script/README.md`
  - Do: Create the maintained Apps Script file, centralize CONFIG, add sheet/column contract assertions, and add normalization helpers for registration input fields.
  - Verify: `bash scripts/verify-s01-sheet-contract.sh`
  - Done when: script source exists with explicit response-schema checks and verification script can assert required contract fields/functions.

- [x] **T02: Implement deterministic seat assignment and intake state transitions** `est:50m`
  - Why: Deliver the core behavior S02/S03 depend on: stable assignment and initial workflow state.
  - Files: `apps-script/Code.gs`, `fixtures/s01/intake-sequence.json`
  - Do: Implement deterministic `assignBatch_` logic (auto-shift, hard-cap, waitlist) and enforce initial state writes in `onFormSubmit`; persist payment-link pointer and intake notes.
  - Verify: `node scripts/verify-s01-seat-engine.mjs`
  - Done when: fixture-driven verification proves no batch overfill and expected assignment/status outputs for normal and overflow sequences.

- [x] **T03: Add diagnostics and setup-guard verification path** `est:35m`
  - Why: Ensure operators and future agents can identify configuration failures and state anomalies quickly.
  - Files: `apps-script/Code.gs`, `scripts/verify-s01-sheet-contract.sh`, `05_setup_playbook.md`
  - Do: Add high-signal intake diagnostics (status/note codes + logs), finalize contract verification scripts, and update setup playbook with pre-launch checks.
  - Verify: `bash scripts/verify-s01-sheet-contract.sh && node scripts/verify-s01-seat-engine.mjs`
  - Done when: diagnostics are encoded, verification commands are documented, and both commands pass locally.

## Files Likely Touched

- `apps-script/Code.gs`
- `apps-script/README.md`
- `scripts/verify-s01-sheet-contract.sh`
- `scripts/verify-s01-seat-engine.mjs`
- `fixtures/s01/intake-sequence.json`
- `05_setup_playbook.md`
