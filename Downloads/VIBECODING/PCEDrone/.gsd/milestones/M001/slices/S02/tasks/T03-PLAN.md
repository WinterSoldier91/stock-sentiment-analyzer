---
estimated_steps: 8
estimated_files: 3
---

# T03: Add idempotency guard and reconciliation diagnostics

**Slice:** S02 — Payment Reconciliation & Confirmation Invariant
**Milestone:** M001

## Description

Protect reconciliation from webhook retries/replays and make decision paths fully inspectable for future operators and agents.

## Steps

1. Define idempotency key derivation strategy from webhook event/body fields.
2. Implement processed-event persistence and lookup (for example Script Properties cache).
3. Short-circuit duplicate events before state mutation and log replay decision.
4. Add structured reconciliation logs for decision, row target, and reason codes.
5. Add explicit note markers for replay/ambiguous/unmatched outcomes.
6. Extend fixture verifier with duplicate-event scenarios.
7. Extend security verifier for idempotency symbol presence.
8. Run combined verification commands and ensure both pass.

## Must-Haves

- [ ] Duplicate events are idempotently ignored.
- [ ] Replay handling is visible in logs/notes.
- [ ] Combined verification command passes in one run.
- [ ] No secret material is logged in diagnostics.

## Verification

- `bash scripts/verify-s02-security-contract.sh && node scripts/verify-s02-webhook-matching.mjs`
- Both commands must exit 0 and include duplicate/replay scenario coverage.

## Observability Impact

- Signals added/changed: reconciliation decision logs + replay markers.
- How a future agent inspects this: verifier commands, row-level notes/status, and Apps Script execution logs.
- Failure state exposed: ambiguous/unmatched/replay classes become explicit instead of silent failures.

## Inputs

- `apps-script/Code.gs` — reconciliation implementation from T01/T02.
- `scripts/verify-s02-webhook-matching.mjs` — scenario verification harness from T02.
- `.gsd/milestones/M001/slices/S02/S02-PLAN.md` — observability and verification requirements.

## Expected Output

- `apps-script/Code.gs` — idempotent webhook reconciliation with explicit diagnostics.
- `scripts/verify-s02-webhook-matching.mjs` — duplicate/replay scenario checks.
- `scripts/verify-s02-security-contract.sh` — extended security/idempotency contract checks.
