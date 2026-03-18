# S02: Payment Reconciliation & Confirmation Invariant

**Goal:** Enforce payment-event authenticity, idempotent processing, and unambiguous confirmation transitions so webhook traffic cannot create false confirms.
**Demo:** Given webhook fixture events, only deterministic matches move rows to `CONFIRMED`; duplicate or ambiguous events are routed to review/error states with explicit diagnostics.

## Must-Haves

- Webhook processing verifies authenticity using configured secret before mutating payment state.
- Confirmation transition is invariant-safe: `CONFIRMED` only when match is decisive.
- Duplicate webhook deliveries do not produce repeated state transitions.
- Ambiguous or unmatched payment events are explicitly surfaced as review-required states/notes.

## Proof Level

- This slice proves: contract
- Real runtime required: no
- Human/UAT required: no

## Verification

- `bash scripts/verify-s02-security-contract.sh`
- `node scripts/verify-s02-webhook-matching.mjs`

## Observability / Diagnostics

- Runtime signals: webhook decision logs (`verified`, `duplicate`, `ambiguous`, `matched`, `rejected`).
- Inspection surfaces: `Status`/`Payment Status`/`Notes` in `Form Responses`; idempotency key store; local fixture verifiers.
- Failure visibility: review-required note codes with rejection reason and matching context.
- Redaction constraints: never log webhook secrets or full payment payloads.

## Integration Closure

- Upstream surfaces consumed: `apps-script/Code.gs`, S01 state columns H–L, S01 assignment/status patterns.
- New wiring introduced in this slice: webhook authenticity check, deterministic reconciliation decision engine, idempotency persistence.
- What remains before the milestone is truly usable end-to-end: operator exception UX polish (S03) and live integrated run proof (S04).

## Tasks

- [x] **T01: Add webhook authenticity and decision scaffolding** `est:50m`
  - Why: Reconciliation cannot be trusted without authenticity checks and explicit decision model.
  - Files: `apps-script/Code.gs`, `03_razorpay_setup.md`
  - Do: Add webhook secret configuration strategy, raw-body signature verification helper, normalized webhook event parsing, and explicit decision enum scaffolding for match outcomes.
  - Verify: `bash scripts/verify-s02-security-contract.sh`
  - Done when: code includes signature verification helper path and verifier confirms required security contract symbols.

- [x] **T02: Implement deterministic reconciliation and invariant-safe transitions** `est:60m`
  - Why: Core risk in M001 is false confirmations from ambiguous payment matching.
  - Files: `apps-script/Code.gs`, `fixtures/s02/webhook-events.json`
  - Do: Implement match engine (decisive/ambiguous/unmatched), apply state transitions (`PAID` + `CONFIRMED` only for decisive match), and route non-decisive events to review notes/status.
  - Verify: `node scripts/verify-s02-webhook-matching.mjs`
  - Done when: fixture scenarios prove no ambiguous case can auto-confirm.

- [x] **T03: Add idempotency guard and reconciliation diagnostics** `est:45m`
  - Why: Webhook retries/duplicates are expected; repeated processing must be harmless and inspectable.
  - Files: `apps-script/Code.gs`, `scripts/verify-s02-webhook-matching.mjs`, `scripts/verify-s02-security-contract.sh`
  - Do: Add deterministic idempotency key computation and persistence strategy, emit high-signal reconciliation logs/notes, and finalize verifier coverage for duplicates and replay safety.
  - Verify: `bash scripts/verify-s02-security-contract.sh && node scripts/verify-s02-webhook-matching.mjs`
  - Done when: duplicate fixture events are ignored safely and diagnostics make decision path explicit.

## Files Likely Touched

- `apps-script/Code.gs`
- `fixtures/s02/webhook-events.json`
- `scripts/verify-s02-webhook-matching.mjs`
- `scripts/verify-s02-security-contract.sh`
- `03_razorpay_setup.md`
