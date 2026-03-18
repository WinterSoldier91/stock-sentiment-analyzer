# S03: Operator Dashboard & Exception Workflow — UAT

**Milestone:** M001
**Written:** 2026-03-18

## UAT Type

- UAT mode: mixed
- Why this mode is sufficient: contract/fixture verifiers validate logic; operator workflow quality needs human execution in sheet UI.

## Preconditions

- Apps Script code deployed from current `apps-script/Code.gs`.
- At least one `REVIEW_REQUIRED` row exists in `Form Responses`.
- `Webhook Review` sheet exists with at least one event row.

## Smoke Test

Open Dashboard and confirm the `🔎 Reconciliation Queue` block appears with non-empty metrics.

## Test Cases

### 1. Review queue visibility

1. Open `Dashboard` sheet.
2. Verify rows for `Review Required Rows`, `Webhook Ambiguous`, `Webhook Unmatched`, `Webhook Replay`, `Webhook Rejected`.
3. **Expected:** counts are visible and non-negative; recent review rows section is present.

### 2. Resolve review to pending/cancel safely

1. From menu `🚀 Workshop Tools`, choose `Resolve Review → Keep Pending`.
2. Enter a valid `REVIEW_REQUIRED` row number.
3. **Expected:** row status changes to `REGISTERED`; notes include `OPERATOR_REVIEW_RESOLVED: pending`.

4. Repeat with `Resolve Review → Cancel`.
5. **Expected:** row status changes to `CANCELLED`; notes include `OPERATOR_REVIEW_RESOLVED: cancel`.

## Edge Cases

### Invalid manual confirm attempt

1. Pick a `REVIEW_REQUIRED` row where `Payment Status` is not `PAID`.
2. Run `Resolve Review → Confirm`.
3. **Expected:** action is blocked, alert shown, and note includes `OPERATOR_INVALID_ACTION: confirm_without_paid_status`.

## Failure Signals

- Dashboard missing reconciliation queue block.
- Review actions available but no status/note mutation occurs.
- Invalid confirm succeeds when payment is not `PAID`.

## Requirements Proved By This UAT

- R005 — operator can see and act on review queue state.
- R002 — manual pathways still enforce confirm guardrails.

## Not Proven By This UAT

- Full live submit→pay→confirm path under real webhook delivery ordering/retries (S04).

## Notes for Tester

Use test rows first. Keep one unresolved `REVIEW_REQUIRED` row to verify dashboard queue visibility after each action.
