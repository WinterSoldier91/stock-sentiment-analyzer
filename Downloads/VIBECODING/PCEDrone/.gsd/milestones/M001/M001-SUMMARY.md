---
id: M001
provides:
  - Deterministic intake + seat assignment contract
  - Authenticated, idempotent payment reconciliation with explicit decision classes
  - Operator-facing exception visibility and guarded review-resolution workflow
key_decisions:
  - Keep no-ambiguous-confirmations invariant as hard boundary across auto and manual paths
  - Persist webhook secret/idempotency in Script Properties rather than source
  - Expose reconciliation pressure through dashboard + review log surfaces
patterns_established:
  - Versioned Apps Script source pattern (`apps-script/Code.gs`)
  - Layered verifier pattern (S01 intake, S02 security/reconciliation, S03 workflow)
  - Decision-first webhook and operator-resolution guardrail patterns
observability_surfaces:
  - bash scripts/verify-s01-sheet-contract.sh
  - node scripts/verify-s01-seat-engine.mjs
  - bash scripts/verify-s02-security-contract.sh
  - node scripts/verify-s02-webhook-matching.mjs
  - bash scripts/verify-s03-workflow-contract.sh
  - node scripts/verify-s03-operator-views.mjs
  - Dashboard queue sections + Webhook Review sheet
requirement_outcomes:
  - id: R001
    from_status: active
    to_status: active
    proof: S01 fixture checks prove deterministic assignment and no-overfill behavior
  - id: R002
    from_status: active
    to_status: active
    proof: S02/S03 block ambiguous auto/manual confirms via deterministic decisions and guardrails
  - id: R004
    from_status: active
    to_status: active
    proof: Signature verification and replay handling implemented with fixture coverage
  - id: R005
    from_status: active
    to_status: active
    proof: Dashboard/review queue visibility and operator resolution actions implemented
  - id: R006
    from_status: active
    to_status: active
    proof: Playbook now includes full S01/S02/S03 preflight command chain
duration: 6h00m (S01+S02+S03)
verification_result: passed
completed_at: 2026-03-18T16:00:00Z
---

# M001: Launch-Ready Workshop Ops Core

**Progress so far: S01–S03 now provide deterministic intake, safe payment reconciliation, and actionable operator exception handling; only final live integration proof remains (S04).**

## What Happened

M001 execution has completed three slices in sequence:

- **S01** established the core intake contract, deterministic seat assignment, and local contract checks.
- **S02** hardened payment edge handling with webhook signature validation, deterministic match decisions, and replay-safe idempotency.
- **S03** translated reconciliation outcomes into operator workflow via dashboard queue metrics and guarded manual resolution actions.

Together, these slices converted a playbook-only baseline into an executable, inspectable system with explicit failure visibility and invariant protection.

## Cross-Slice Verification

- `bash scripts/verify-s01-sheet-contract.sh` — pass.
- `node scripts/verify-s01-seat-engine.mjs` — pass.
- `bash scripts/verify-s02-security-contract.sh` — pass.
- `node scripts/verify-s02-webhook-matching.mjs` — pass (including replay case).
- `bash scripts/verify-s03-workflow-contract.sh` — pass.
- `node scripts/verify-s03-operator-views.mjs` — pass.
- Full combined preflight chain passes end-to-end.

## Requirement Changes

- R001: active → active — deterministic assignment and overflow behavior proven at fixture level.
- R002: active → active — ambiguous confirmation prevented in both auto and manual pathways.
- R004: active → active — authenticated, idempotent webhook handling in place.
- R005: active → active — operator-visible queue and review resolution workflow implemented.
- R006: active → active — reproducible multi-layer preflight checks now documented and executable.

## Forward Intelligence

### What the next milestone should know
- S04 should treat current verifier chain as hard preflight before live run.
- `Webhook Review` and dashboard queue are now canonical exception surfaces and should be exercised in live acceptance.

### What's fragile
- Idempotency key retention has no TTL/cleanup yet.
- Manual resolution uses row-number prompt UX (serviceable but error-prone under high throughput).

### Authoritative diagnostics
- `node scripts/verify-s02-webhook-matching.mjs` — strongest local proof for reconciliation invariant.
- `bash scripts/verify-s03-workflow-contract.sh` — strongest local guardrail check for operator actions.
- `Webhook Review` sheet — persistent runtime trail for non-decisive/replay outcomes.

### What assumptions changed
- Assumption: launch confidence mostly depended on payment-edge correctness — Actual: operator clarity and guarded manual workflows were equally necessary.

## Files Created/Modified

- `apps-script/Code.gs` — intake, reconciliation, idempotency, dashboard, and operator-action logic.
- `apps-script/README.md` — deployment, secret, operator, and verifier guidance.
- `scripts/verify-s01-sheet-contract.sh` — S01 contract gate.
- `scripts/verify-s01-seat-engine.mjs` — S01 behavior gate.
- `scripts/verify-s02-security-contract.sh` — S02 security/idempotency gate.
- `scripts/verify-s02-webhook-matching.mjs` — S02 reconciliation/replay gate.
- `scripts/verify-s03-workflow-contract.sh` — S03 operator guardrail gate.
- `scripts/verify-s03-operator-views.mjs` — S03 dashboard visibility gate.
- `fixtures/s01/intake-sequence.json` — S01 fixtures.
- `fixtures/s02/webhook-events.json` — S02 fixtures.
- `fixtures/s03/operator-workflow.json` — S03 fixtures.
- `03_razorpay_setup.md` — webhook secret/signature setup guidance.
- `05_setup_playbook.md` — full preflight + operator workflow check sequence.
