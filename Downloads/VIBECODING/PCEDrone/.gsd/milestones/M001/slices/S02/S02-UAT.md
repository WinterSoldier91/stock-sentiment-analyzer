# S02: Payment Reconciliation & Confirmation Invariant — UAT

**Milestone:** M001
**Written:** 2026-03-18

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S02 objective is correctness of webhook decision and state transition logic; live runtime assembly is proven in S04.

## Preconditions

- Repository at latest S02 commit.
- Node.js installed.
- Working directory at project root.

## Smoke Test

Run both S02 verification commands and confirm all scenarios pass.

## Test Cases

### 1. Security scaffold + idempotency contract

1. Run: `bash scripts/verify-s02-security-contract.sh`
2. Confirm required symbols are found
3. **Expected:** exits 0 and prints `S02 webhook security contract verification passed.`

### 2. Reconciliation decisions and invariant behavior

1. Run: `node scripts/verify-s02-webhook-matching.mjs`
2. Confirm all fixture scenarios pass
3. **Expected:** exits 0 and prints `S02 webhook reconciliation verification passed (...)`

## Edge Cases

### Duplicate delivery replay

1. In `fixtures/s02/webhook-events.json`, review `duplicate_event_replay_ignored`.
2. Run the S02 webhook verifier.
3. **Expected:** first event processes as `MATCHED`; second run returns `REPLAY` without additional state mutation.

## Failure Signals

- Security verifier reports missing signature/idempotency helper symbols.
- Reconciliation verifier reports ambiguous case incorrectly confirming a row.
- Replay scenario does not return `REPLAY` on second processing.

## Requirements Proved By This UAT

- R002 — no ambiguous confirmations at fixture/contract level.
- R004 — signature verification and idempotent replay handling at fixture/contract level.
- R005 — explicit non-decisive outcome surfacing via review paths.

## Not Proven By This UAT

- Live Google runtime webhook delivery behavior against Razorpay production/test endpoints.
- End-to-end submit→pay→confirm run in real environment (S04).

## Notes for Tester

This UAT is a deterministic preflight for reconciliation safety. Use it before live webhook testing to avoid debugging invariants in production flow.
