---
estimated_steps: 8
estimated_files: 2
---

# T01: Extend dashboard with reconciliation and review visibility

**Slice:** S03 — Operator Dashboard & Exception Workflow
**Milestone:** M001

## Description

Add operator-centric dashboard blocks that expose review queue state and reconciliation outcomes so exception pressure is visible without scanning raw rows.

## Steps

1. Define dashboard summary metrics for `REVIEW_REQUIRED`, `CONFIRMED`, `WAITLISTED`, and unresolved webhook outcomes.
2. Add helper to aggregate decision counts from `Webhook Review` sheet.
3. Extend `refreshDashboard_` output with a dedicated review-health section.
4. Include recent review rows (masked contact) for quick triage context.
5. Ensure dashboard updates remain stable when review sheet is missing or empty.
6. Keep existing seat/batch metrics intact.
7. Create fixture data for dashboard output checks.
8. Run view verifier and adjust formatting/layout outputs.

## Must-Haves

- [ ] Dashboard includes explicit `REVIEW_REQUIRED` count.
- [ ] Dashboard includes reconciliation decision summary from `Webhook Review`.
- [ ] Dashboard remains resilient when no review events exist.
- [ ] Existing batch metrics remain correct after extension.

## Verification

- `node scripts/verify-s03-operator-views.mjs`
- Verify deterministic dashboard summary output against fixture expectations.

## Inputs

- `apps-script/Code.gs` — current dashboard and webhook review logging.
- `.gsd/milestones/M001/slices/S02/S02-SUMMARY.md` — decision/output contracts now produced by webhook flow.
- `.gsd/milestones/M001/slices/S03/S03-PLAN.md` — S03 visibility targets.

## Expected Output

- `apps-script/Code.gs` — extended dashboard summary for review workflow signals.
- `fixtures/s03/operator-workflow.json` — dashboard metric fixture seeds.
