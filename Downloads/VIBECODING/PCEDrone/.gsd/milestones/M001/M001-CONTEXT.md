# M001: Launch-Ready Workshop Ops Core

**Gathered:** 2026-03-18
**Status:** Ready for planning

## Project Description

Build a **one smooth workshop ops flow** for PCEDrone that is explicitly organizer-first. The milestone must make registration, seat assignment, payment tracking, and final confirmation trustworthy in one operational path, with the core invariant that there are **no ambiguous confirmations**.

## Why This Milestone

There is an immediate upcoming launch. The existing docs and script draft describe the flow, but launch confidence depends on proving that the live workflow behaves deterministically under real conditions (capacity pressure, payment reconciliation, and webhook retries).

## User-Visible Outcome

### When this milestone is complete, the user can:

- run the workshop intake from Google Form and see deterministic seat assignment and status progression in the sheet/dashboard,
- accept a payment and see only unambiguous paid registrations become confirmed, while uncertain cases are surfaced for manual review.

### Entry point / environment

- Entry point: Google Form URL + linked Google Sheet + bound Apps Script + Razorpay payment links/webhooks
- Environment: local operator workflow inside Google Workspace + Razorpay dashboard/runtime
- Live dependencies involved: Google Forms, Google Sheets, Apps Script runtime, Razorpay webhooks/events

## Completion Class

- Contract complete means: registration state model, seat assignment rules, payment status transitions, and confirmation invariants are encoded and observable in sheet/script behavior.
- Integration complete means: end-to-end flow crosses real Form → Sheet → Script → Razorpay boundaries and returns to correct sheet state.
- Operational complete means: trigger/webhook lifecycle handles duplicate and mismatch events without silent incorrect confirmations.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- a real participant (or controlled live test participant) can submit the form, receive payment path, complete payment, and appear as `CONFIRMED` with clear evidence,
- when reconciliation is uncertain (for example, duplicate/mismatched identifying signals), the system does **not** auto-confirm and routes to explicit review state,
- the final acceptance cannot be satisfied by docs-only or static file checks; it must include a real integrated run.

## Risks and Unknowns

- Payment event-to-row reconciliation ambiguity — wrong mapping can create false confirmations.
- Webhook delivery behavior (duplicates/order variance) — can cause repeated or conflicting updates without idempotency guardrails.
- Setup drift across form/sheet/script names and columns — can silently break trigger logic if contracts are implicit.

## Existing Codebase / Prior Art

- `01_apps_script_code.md` — baseline Apps Script draft for trigger, assignment, dashboard, webhook handling.
- `02_sheet_template.md` — response and dashboard column contracts.
- `03_razorpay_setup.md` — payment links and webhook setup guidance.
- `04_form_copy.md` — form question and response-collection contract.
- `05_setup_playbook.md` — end-to-end setup sequence and launch checklist.

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R001 — deterministic seat assignment with hard capacity and auto-shift behavior
- R002 — no ambiguous confirmations invariant
- R003 — real end-to-end launch proof
- R004 — reconciliation-safe payment processing
- R005 — failure visibility and exception workflow
- R006 — reproducible setup
- R007 — core external integration completeness

## Scope

### In Scope

- deterministic registration state flow in Sheet + Apps Script,
- payment reconciliation and confirmation safety rules,
- operator-facing dashboard/notes for actionable exception handling,
- real integrated launch proof for the core stack.

### Out of Scope / Non-Goals

- full WhatsApp automation,
- multi-event generalized productization,
- intentional overbooking policies.

## Technical Constraints

- Google Apps Script bound-project runtime and trigger behavior govern execution model.
- Sheet/tab names and column mapping are hard contracts for automation correctness.
- Razorpay webhook verification must use raw body and signature checks; duplicate events are expected and must be handled idempotently.

## Integration Points

- Google Form → Google Sheet (`Form Responses`) — submission ingestion contract.
- Apps Script trigger/webhook → state columns (H–L) — workflow state transition contract.
- Razorpay Payment Links/Webhooks → payment status and confirmation transitions.

## Open Questions

- What is the final canonical reconciliation key for webhook-to-registration matching (phone-only versus richer reference strategy)? — current direction: move to stronger deterministic matching than phone-only.
- How should review-required cases be operationally closed (manual controls and audit note standard)? — current direction: explicit operator action path with note taxonomy.
