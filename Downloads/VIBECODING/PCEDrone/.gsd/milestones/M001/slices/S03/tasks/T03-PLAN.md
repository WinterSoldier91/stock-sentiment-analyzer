---
estimated_steps: 7
estimated_files: 3
---

# T03: Add workflow verification fixtures and runbook updates

**Slice:** S03 — Operator Dashboard & Exception Workflow
**Milestone:** M001

## Description

Add deterministic verification fixtures for operator visibility/resolution flow and update launch playbook with explicit review-handling checks.

## Steps

1. Finalize fixture schema for review queue and operator resolution scenarios.
2. Implement `scripts/verify-s03-operator-views.mjs` to assert dashboard/review outputs.
3. Implement/extend workflow contract verifier for operator action guardrails.
4. Add fixture cases for invalid-action blocking.
5. Run both verification commands and resolve gaps.
6. Update `05_setup_playbook.md` with S03 review-handling preflight checks.
7. Ensure verifier commands and playbook steps are aligned and reproducible.

## Must-Haves

- [ ] S03 verification scripts pass together.
- [ ] Fixture coverage includes review queue and resolution outcomes.
- [ ] Playbook includes review-handling checks before live run.
- [ ] Invalid operator actions are asserted as blocked in verification.

## Verification

- `bash scripts/verify-s03-workflow-contract.sh && node scripts/verify-s03-operator-views.mjs`
- Both commands must exit 0 with explicit pass output.

## Observability Impact

- Signals added/changed: review workflow command-level diagnostics.
- How a future agent inspects this: run S03 verifier commands and inspect dashboard/review sheet outputs.
- Failure state exposed: missing review metrics, invalid transition guard failures, and unresolved queue handling gaps.

## Inputs

- `apps-script/Code.gs` — S03 dashboard + operator action implementation from T01/T02.
- `05_setup_playbook.md` — launch flow docs requiring review-workflow additions.
- `.gsd/milestones/M001/slices/S03/S03-PLAN.md` — S03 verification and UAT expectations.

## Expected Output

- `fixtures/s03/operator-workflow.json` — S03 review workflow fixture scenarios.
- `scripts/verify-s03-operator-views.mjs` — dashboard/review output verifier.
- `scripts/verify-s03-workflow-contract.sh` — operator-action guardrail verifier.
- `05_setup_playbook.md` — updated S03 preflight checks.
