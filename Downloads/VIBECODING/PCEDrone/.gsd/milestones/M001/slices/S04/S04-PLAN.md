# S04: End-to-End Launch Proof & Hardening

**Goal:** Prove the assembled system works in real environment conditions and produce launch-ready operational evidence for the full submit→pay→confirm loop.
**Demo:** A real or controlled live participant flow is executed end-to-end with captured evidence, and preflight + operator checks pass without ambiguous confirmation behavior.

## Must-Haves

- Full S01/S02/S03 verifier chain passes immediately before live run.
- One real integrated scenario proves submit → webhook payment event → confirmed seat transition.
- One non-decisive scenario proves review-path behavior (no silent/ambiguous confirmation).
- Launch runbook and evidence artifact reflect actual observed runtime behavior.

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes
- Human/UAT required: yes

## Verification

- `bash scripts/preflight-m001.sh`
- `S04-EVIDENCE.md` contains timestamped live run results for success + non-decisive scenario

## Observability / Diagnostics

- Runtime signals: Apps Script execution logs, row-level status/notes transitions, webhook review log entries.
- Inspection surfaces: `Form Responses`, `Dashboard`, `Webhook Review`, preflight script output, evidence document.
- Failure visibility: explicit evidence capture for mismatch points (trigger, webhook auth, reconciliation, operator resolution).
- Redaction constraints: mask contact details and never include secrets in evidence notes.

## Integration Closure

- Upstream surfaces consumed: all M001 slice outputs (S01–S03).
- New wiring introduced in this slice: integrated acceptance execution protocol + evidence capture discipline.
- What remains before the milestone is truly usable end-to-end: nothing in M001 once live evidence is captured and accepted.

## Tasks

- [x] **T01: Build integrated acceptance checklist and evidence template** `est:40m`
  - Why: Live proof needs deterministic capture format, not ad-hoc notes.
  - Files: `.gsd/milestones/M001/slices/S04/S04-EVIDENCE.md`, `05_setup_playbook.md`
  - Do: Create evidence template with required scenarios, timestamps, expected/actual columns, and diagnostic capture instructions; update playbook with explicit S04 acceptance gate.
  - Verify: `test -f .gsd/milestones/M001/slices/S04/S04-EVIDENCE.md`
  - Done when: evidence file exists with complete acceptance sections for both success and non-decisive paths.

- [x] **T02: Add one-command preflight and launch hardening checks** `est:35m`
  - Why: Last-mile reliability depends on consistent preflight execution.
  - Files: `scripts/preflight-m001.sh`, `05_setup_playbook.md`
  - Do: Add executable preflight script chaining all S01/S02/S03 verifiers with fail-fast behavior and clear output; update playbook to use this script.
  - Verify: `bash scripts/preflight-m001.sh`
  - Done when: preflight script exits 0 locally and prints explicit pass summary.

- [ ] **T03: Execute live UAT and capture acceptance evidence** `est:60m`
  - Why: Milestone definition requires real runtime proof beyond fixtures.
  - Files: `.gsd/milestones/M001/slices/S04/S04-EVIDENCE.md`, `.gsd/milestones/M001/slices/S04/S04-UAT.md`
  - Do: Run guided live UAT in Google environment, record actual outcomes (including one non-decisive case), and document any divergences with remediation.
  - Verify: Evidence document includes completed run entries and clear pass/fail verdict for each acceptance scenario.
  - Done when: live evidence confirms end-to-end flow and non-decisive safeguard behavior.

## Files Likely Touched

- `.gsd/milestones/M001/slices/S04/S04-EVIDENCE.md`
- `.gsd/milestones/M001/slices/S04/S04-UAT.md`
- `scripts/preflight-m001.sh`
- `05_setup_playbook.md`
