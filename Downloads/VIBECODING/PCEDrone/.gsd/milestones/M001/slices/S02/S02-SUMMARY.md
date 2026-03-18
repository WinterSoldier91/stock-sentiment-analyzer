---
id: S02
parent: M001
milestone: M001
provides:
  - Authenticated webhook intake with signature verification
  - Deterministic reconciliation engine enforcing no-ambiguous-confirmations invariant
  - Idempotent replay guard for duplicate webhook deliveries
requires:
  - slice: S01
    provides: Canonical intake contract, state columns H–L, and status/note diagnostics surfaces
affects:
  - S03
  - S04
key_files:
  - apps-script/Code.gs
  - scripts/verify-s02-security-contract.sh
  - scripts/verify-s02-webhook-matching.mjs
  - fixtures/s02/webhook-events.json
  - 03_razorpay_setup.md
key_decisions:
  - Read webhook secret from Script Properties (`RAZORPAY_WEBHOOK_SECRET`)
  - Exclude waitlisted rows from auto-confirm eligibility
  - Treat duplicate webhook deliveries as replay with no state mutation
patterns_established:
  - Authenticated-first webhook processing pattern
  - Decision-first reconciliation pattern with explicit outcome classes
observability_surfaces:
  - Logger events: webhook_processed, webhook_rejected, webhook_replay_ignored, webhook_failed
  - Webhook Review sheet with idempotency and candidate-row context
  - `bash scripts/verify-s02-security-contract.sh`
  - `node scripts/verify-s02-webhook-matching.mjs`
drill_down_paths:
  - .gsd/milestones/M001/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S02/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S02/tasks/T03-SUMMARY.md
duration: 2h20m
verification_result: passed
completed_at: 2026-03-18T15:00:00Z
---

# S02: Payment Reconciliation & Confirmation Invariant

**Shipped authenticated, idempotent webhook reconciliation that only confirms decisively matched registrations and surfaces non-decisive events for review.**

## What Happened

S02 hardened the webhook boundary from a placeholder into a deterministic reconciliation flow. Incoming webhook requests are now signature-verified using a script property secret before any state mutation is allowed. Events are normalized and routed through explicit decision classes (`MATCHED`, `AMBIGUOUS`, `UNMATCHED`, `REPLAY`, `REJECTED`).

Reconciliation now confirms only decisive matches and explicitly blocks ambiguous confirmations by moving candidates to `REVIEW_REQUIRED` with traceable notes. Unmatched and rejected events are written to a dedicated `Webhook Review` sheet. Duplicate deliveries are idempotently short-circuited by event-key replay detection and logged without mutating registration state.

## Verification

- Security contract verification passed: `bash scripts/verify-s02-security-contract.sh`.
- Reconciliation/invariant verification passed: `node scripts/verify-s02-webhook-matching.mjs`.
- Combined command passed with replay scenario coverage.

## Requirements Advanced

- R002 — implemented invariant-safe confirmation path that never auto-confirms ambiguous matches.
- R004 — added signature verification, deterministic reconciliation decisions, and replay/idempotency guard.
- R005 — surfaced explicit webhook decision diagnostics and review queue records.

## Requirements Validated

- none (full live integrated acceptance remains in S04).

## New Requirements Surfaced

- none.

## Requirements Invalidated or Re-scoped

- none.

## Deviations

None.

## Known Limitations

- Replay key storage in Script Properties has no retention cleanup yet.
- Verification remains fixture/contract-level; live webhook runtime proof remains for S04.

## Follow-ups

- In S03, tighten operator-facing exception workflow and dashboard clarity for review queue handling.
- In S04, execute real submit→pay→confirm flow and prove live behavior end-to-end.

## Files Created/Modified

- `apps-script/Code.gs` — authenticated, idempotent webhook reconciliation logic.
- `scripts/verify-s02-security-contract.sh` — security/idempotency contract gate.
- `scripts/verify-s02-webhook-matching.mjs` — reconciliation and replay scenario verifier.
- `fixtures/s02/webhook-events.json` — reconciliation fixture scenarios.
- `03_razorpay_setup.md` — webhook secret and verification setup guidance.

## Forward Intelligence

### What the next slice should know
- `Webhook Review` sheet is now the canonical place for non-decisive webhook outcomes.
- `REVIEW_REQUIRED` is a real operational status now; S03 should expose and operationalize it clearly.

### What's fragile
- Idempotency keys accumulate in Script Properties without rotation — acceptable for now, but needs lifecycle strategy if event volume increases.

### Authoritative diagnostics
- `node scripts/verify-s02-webhook-matching.mjs` — fastest indicator that confirmation invariant and replay rules still hold.
- `Webhook Review` sheet — durable trail of unresolved/ignored webhook outcomes.

### What assumptions changed
- Assumption: phone-based webhook matching could be made safe with small tweaks — Actual: explicit decision classes and review routing were required to keep confirmation trust intact.
