# S04: End-to-End Launch Proof & Hardening — UAT

**Milestone:** M001
**Written:** 2026-03-18

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: final milestone acceptance requires real Form/Sheet/Apps Script/Razorpay wiring in runtime.

## Preconditions

- `bash scripts/preflight-m001.sh` passes.
- Form, Sheet, Apps Script deployment, and Razorpay webhook are configured.
- `RAZORPAY_WEBHOOK_SECRET` is set in Script Properties.

## Smoke Test

Submit one form response and confirm row is created with intake defaults (`PENDING`, assigned batch/status).

## Test Cases

### 1. Success path — submit to confirmed

1. Submit a real/test participant via form.
2. Complete payment using configured payment link.
3. Observe webhook processing and row state.
4. **Expected:** row ends with `Payment Status=PAID` and `Status=CONFIRMED`.

### 2. Non-decisive safety path

1. Trigger a scenario that should not reconcile decisively (ambiguous or unmatched).
2. Observe webhook decision and row behavior.
3. **Expected:** no incorrect `CONFIRMED`; review signal appears in dashboard/review sheet.

## Edge Cases

### Replay event handling

1. Re-send same webhook payload (or re-trigger duplicate delivery).
2. **Expected:** decision class is `REPLAY`; no additional row mutation occurs.

## Failure Signals

- Signature mismatch rejects legitimate webhook due secret/config mismatch.
- Ambiguous event incorrectly confirms a row.
- Replay event mutates row state again.

## Requirements Proved By This UAT

- R002 — no ambiguous confirmations in live runtime behavior.
- R003 — real end-to-end flow proven in live environment.
- R004 — authenticated + idempotent webhook handling observed in runtime.
- R005 — review-path visibility and operator resolution workflow observed.

## Not Proven By This UAT

- M002 communication automation capabilities.
- M003 reusable multi-workshop templating.

## Notes for Tester

Record all observed outcomes in `S04-EVIDENCE.md` immediately after each step (expected vs actual + evidence source).
