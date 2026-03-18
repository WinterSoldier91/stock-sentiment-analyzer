# M001: Launch-Ready Workshop Ops Core

**Vision:** Deliver a launch-grade, organizer-first workshop registration system where seat assignment is deterministic, payment reconciliation is reliable, and confirmations are never ambiguous across the real Form → Sheet → Apps Script → Razorpay flow.

## Success Criteria

- Organizer can process registrations with deterministic seat assignment and clear status transitions.
- A participant can complete submit → pay → confirmed seat in a real integrated run.
- No registration is auto-confirmed when payment evidence is ambiguous.
- Exception states are visible and actionable without hidden failures.

## Key Risks / Unknowns

- Payment reconciliation mismatch risk — incorrect row matching can create false confirmations.
- Webhook retry/duplication behavior — duplicate events can corrupt status transitions without idempotency.
- Operational contract drift (sheet names/columns/config) — setup drift can silently break automation.

## Proof Strategy

- Payment reconciliation mismatch risk → retire in S02 by proving only deterministic matches can transition to confirmed and ambiguous matches are routed to review.
- Webhook retry/duplication behavior → retire in S02 by proving duplicate event handling is idempotent and does not produce double-confirms.
- Operational contract drift → retire in S01 and S04 by proving contract checks and a live runbook execution succeed with reproducible setup.

## Verification Classes

- Contract verification: Apps Script contract checks, sheet state assertions, and artifact-level validation of status/column/state transitions.
- Integration verification: Real Form submission plus Razorpay payment event flow updating linked sheet state.
- Operational verification: Trigger + webhook behavior under retries/duplicates and launch checklist repeatability.
- UAT / human verification: Organizer executes launch script and validates dashboard clarity for normal and exception cases.

## Milestone Definition of Done

This milestone is complete only when all are true:

- all slice deliverables are complete,
- shared components are actually wired together,
- the real entrypoint exists and is exercised,
- success criteria are re-checked against live behavior, not just artifacts,
- final integrated acceptance scenarios pass.

## Requirement Coverage

- Covers: R001, R002, R003, R004, R005, R006, R007
- Partially covers: none
- Leaves for later: R020, R021
- Orphan risks: none

## Slices

- [ ] **S01: Registration Contract & Seat Engine** `risk:high` `depends:[]`
  > After this: Form submissions deterministically populate state columns and assign seats with auto-shift and hard-cap waitlist behavior.

- [ ] **S02: Payment Reconciliation & Confirmation Invariant** `risk:high` `depends:[S01]`
  > After this: Payment events reconcile safely with signature/idempotency guardrails and only unambiguous paid registrations can become confirmed.

- [ ] **S03: Operator Dashboard & Exception Workflow** `risk:medium` `depends:[S01,S02]`
  > After this: Organizer can see pending/confirmed/waitlisted/review-required states and resolve exceptions with explicit note/status patterns.

- [ ] **S04: End-to-End Launch Proof & Hardening** `risk:medium` `depends:[S01,S02,S03]`
  > After this: A real integrated submit→pay→confirm run is executed and documented as repeatable launch evidence.

## Boundary Map

### S01 → S02

Produces:
- Stable sheet contract: `Form Responses` tab and state columns H–L (`Batch Assigned`, `Payment Status`, `Payment Link`, `Status`, `Notes`).
- Deterministic seat engine contract: `assignBatch_(sheet, row)` never exceeds `MAX_PER_BATCH`; full capacity routes to `Waitlist`.
- Intake state contract: `onFormSubmit` sets initial statuses (`PENDING`, `REGISTERED`) and stores payment-link pointer.

Consumes:
- nothing (first slice)

### S02 → S03

Produces:
- Payment-event authenticity contract: webhook signature verification against raw payload.
- Idempotency contract: duplicate webhook/event deliveries do not produce duplicate state transitions.
- Confirmation invariant contract: transition to `CONFIRMED` only when reconciliation is decisive; ambiguous cases transition to review state.

Consumes from S01:
- Response row schema and initial state fields.
- Batch assignment invariants for confirmed-seat semantics.

### S03 → S04

Produces:
- Dashboard truth model for registration lifecycle buckets (registered, paid, confirmed, waitlisted, review-required).
- Exception workflow contract: actionable notes/status conventions for manual operator resolution.
- Operator-facing visibility contract suitable for launch-day decision making.

Consumes from S02:
- Reconciled payment states and invariant-safe confirmation transitions.

### S01/S02/S03 → S04

Produces:
- Integrated acceptance evidence package for launch readiness.

Consumes:
- S01 intake + seat assignment contracts.
- S02 payment reconciliation and confirmation contracts.
- S03 visibility and exception-handling contracts.
