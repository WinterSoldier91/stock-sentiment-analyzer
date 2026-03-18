---
estimated_steps: 8
estimated_files: 2
---

# T02: Add operator resolution actions with audit notes

**Slice:** S03 — Operator Dashboard & Exception Workflow
**Milestone:** M001

## Description

Implement explicit operator actions for resolving review-required rows while enforcing state-transition guardrails and preserving auditability.

## Steps

1. Define allowed resolution actions (confirm, keep pending, cancel) and disallowed transitions.
2. Add Apps Script helper(s) for applying operator-selected resolutions to a row.
3. Require explicit audit note codes when applying manual resolution actions.
4. Add guard to prevent confirming rows that still violate reconciliation invariant context.
5. Add menu entries for operator review actions.
6. Add structured logs for resolution attempts and outcomes.
7. Document usage flow and cautions in `apps-script/README.md`.
8. Run workflow contract verifier and fix guardrail gaps.

## Must-Haves

- [ ] Resolution helpers exist with constrained transition set.
- [ ] Manual confirm path requires explicit operator action and audit note.
- [ ] Invalid transition attempts are blocked and logged.
- [ ] Menu entries surface review resolution actions.

## Verification

- `bash scripts/verify-s03-workflow-contract.sh`
- Verify required action helpers and guardrail literals are present.

## Inputs

- `apps-script/Code.gs` — reconciliation and review status model from S02.
- `apps-script/README.md` — operator guidance baseline.
- `.gsd/milestones/M001/slices/S03/S03-PLAN.md` — action/guard expectations.

## Expected Output

- `apps-script/Code.gs` — operator resolution action helpers and menu wiring.
- `apps-script/README.md` — operator resolution usage notes and constraints.
