# S03: Operator Dashboard & Exception Workflow

**Goal:** Make non-decisive payment outcomes operationally manageable by surfacing review queues clearly and providing safe operator resolution paths.
**Demo:** Operator can identify pending review cases, inspect reasons, resolve a selected case intentionally, and see dashboard counts update accordingly without violating confirmation invariants.

## Must-Haves

- Dashboard exposes `REVIEW_REQUIRED` and reconciliation queue metrics distinctly from normal registration flow.
- Operator has explicit, auditable actions to resolve review-required rows (confirm, keep pending, cancel).
- Review resolution actions cannot bypass confirmation invariant silently.
- Exception signals are visible in both sheet rows and review logs.

## Proof Level

- This slice proves: contract
- Real runtime required: no
- Human/UAT required: yes

## Verification

- `bash scripts/verify-s03-workflow-contract.sh`
- `node scripts/verify-s03-operator-views.mjs`

## Observability / Diagnostics

- Runtime signals: review-queue counts, operator action logs, row-level resolution notes.
- Inspection surfaces: Dashboard sheet blocks, `Webhook Review` sheet, menu-driven operator actions.
- Failure visibility: unresolved queue growth, invalid action attempts, and invariant-blocked operations are explicit.
- Redaction constraints: keep customer contact masked in dashboard-level summaries.

## Integration Closure

- Upstream surfaces consumed: S01 status model, S02 reconciliation decisions, `Webhook Review` log.
- New wiring introduced in this slice: dashboard summary panes + operator resolution actions.
- What remains before the milestone is truly usable end-to-end: real integrated submit→pay→confirm run and final launch hardening in S04.

## Tasks

- [x] **T01: Extend dashboard with reconciliation and review visibility** `est:50m`
  - Why: Operators need at-a-glance queue health, not raw row scanning.
  - Files: `apps-script/Code.gs`, `02_sheet_template.md`
  - Do: Add dashboard sections for review-required count, unmatched/replay/rejected tallies, and recent review entries from `Webhook Review`.
  - Verify: `node scripts/verify-s03-operator-views.mjs`
  - Done when: dashboard output includes explicit review metrics and sample review rows in deterministic fixture checks.

- [x] **T02: Add operator resolution actions with audit notes** `est:60m`
  - Why: Exception queues are only useful if operators can close them safely.
  - Files: `apps-script/Code.gs`, `apps-script/README.md`
  - Do: Add menu/action helpers to resolve `REVIEW_REQUIRED` rows with constrained transitions and mandatory note codes; prevent silent confirm bypass.
  - Verify: `bash scripts/verify-s03-workflow-contract.sh`
  - Done when: contract verifier confirms required resolution functions and guardrails.

- [x] **T03: Add workflow verification fixtures and runbook updates** `est:45m`
  - Why: Operator workflow needs repeatable validation before S04 live proof.
  - Files: `fixtures/s03/operator-workflow.json`, `scripts/verify-s03-operator-views.mjs`, `05_setup_playbook.md`
  - Do: Add fixture scenarios for queue visibility and resolution actions; wire verifier script; update playbook with operator-review test sequence.
  - Verify: `bash scripts/verify-s03-workflow-contract.sh && node scripts/verify-s03-operator-views.mjs`
  - Done when: workflow verifiers pass and playbook includes explicit S03 review-handling checks.

## Files Likely Touched

- `apps-script/Code.gs`
- `apps-script/README.md`
- `scripts/verify-s03-workflow-contract.sh`
- `scripts/verify-s03-operator-views.mjs`
- `fixtures/s03/operator-workflow.json`
- `02_sheet_template.md`
- `05_setup_playbook.md`
