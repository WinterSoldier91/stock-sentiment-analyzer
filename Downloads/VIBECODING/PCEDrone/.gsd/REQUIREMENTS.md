# Requirements

This file is the explicit capability and coverage contract for the project.

Use it to track what is actively in scope, what has been validated by completed work, what is intentionally deferred, and what is explicitly out of scope.

Guidelines:
- Keep requirements capability-oriented, not a giant feature wishlist.
- Requirements should be atomic, testable, and stated in plain language.
- Every **Active** requirement should be mapped to a slice, deferred, blocked with reason, or moved out of scope.
- Each requirement should have one accountable primary owner and may have supporting slices.
- Research may suggest requirements, but research does not silently make them binding.
- Validation means the requirement was actually proven by completed work and verification, not just discussed.

## Active

### R001 — Deterministic batch seat assignment
- Class: primary-user-loop
- Status: active
- Description: Every new registration is assigned to a valid batch without exceeding configured capacity; when a preferred batch is full, assignment moves to the next available batch, and only full system capacity creates waitlist.
- Why it matters: Capacity control is the backbone of workshop operations and prevents oversubscription mistakes.
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: M001/S03
- Validation: partial
- Notes: S01 established deterministic fixture verification and no-overfill checks; live runtime proof remains for S04.

### R002 — Unambiguous confirmation invariant
- Class: constraint
- Status: active
- Description: A participant is marked `CONFIRMED` only when both seat assignment and payment evidence are unambiguous; uncertain matches are never auto-confirmed.
- Why it matters: This is the core trust boundary for organizer decisions and participant commitments.
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: M001/S03, M001/S04
- Validation: partial
- Notes: S02 implemented decisive-match confirmation and explicit ambiguous/review routing; full live integrated proof remains for S04.

### R003 — Real end-to-end launch flow
- Class: launchability
- Status: active
- Description: At least one real flow is proven from form submission through payment and final confirmed seat status in the live operational stack.
- Why it matters: Playbook-only readiness is insufficient for launch.
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: M001/S01, M001/S02, M001/S03
- Validation: mapped
- Notes: Proof must use real integration boundaries, not only static checks.

### R004 — Reconciliation-safe payment processing
- Class: compliance/security
- Status: active
- Description: Payment event processing validates authenticity, handles duplicate deliveries idempotently, and routes mismatch cases into explicit review states.
- Why it matters: Payment mismatches are the highest identified risk for incorrect confirmations.
- Source: research
- Primary owning slice: M001/S02
- Supporting slices: M001/S03
- Validation: partial
- Notes: S02 added signature verification, deterministic reconciliation, and replay guardrails with fixture coverage; live endpoint proof remains for S04.

### R005 — Operator failure visibility and exception handling
- Class: failure-visibility
- Status: active
- Description: Organizer can clearly see pending, confirmed, waitlisted, and review-required states with actionable notes to resolve exceptions.
- Why it matters: Operations must be able to act fast during launch without hidden failure states.
- Source: inferred
- Primary owning slice: M001/S03
- Supporting slices: M001/S04
- Validation: partial
- Notes: S02+S03 added review-required status surfaces, `Webhook Review`, dashboard queue metrics, and guarded operator resolution flow; live runtime proof remains for S04.

### R006 — Reproducible launch setup
- Class: operability
- Status: active
- Description: The setup process for form, sheet, script trigger, and payment integration is reproducible from project artifacts and verification checkpoints.
- Why it matters: Reliable setup reduces launch-day operational risk.
- Source: inferred
- Primary owning slice: M001/S01
- Supporting slices: M001/S04
- Validation: partial
- Notes: S01 added reproducible local pre-launch checks; full integrated launch proof remains for S04.

### R007 — Core external integration completeness
- Class: integration
- Status: active
- Description: The project must integrate Google Form, Google Sheet, Google Apps Script, and Razorpay as one coherent workflow.
- Why it matters: The promised organizer experience depends on these systems working together.
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: M001/S01, M001/S02, M001/S03
- Validation: mapped
- Notes: Communication automation and reusability layers build on this base.

### R020 — Automated participant communication
- Class: integration
- Status: active
- Description: Registration acknowledgements, payment reminders, urgency nudges, and confirmation messages are sent automatically based on canonical workflow state.
- Why it matters: Reduces manual operator load and response lag while preserving participant clarity.
- Source: user
- Primary owning slice: M002/S01 (provisional)
- Supporting slices: M002/S02 (provisional), M003/S01 (provisional)
- Validation: mapped
- Notes: Messaging must never violate R002; delivery failures must be visible to operators.

### R021 — Reusable multi-workshop rollout template
- Class: differentiator
- Status: active
- Description: A new workshop can be launched via configuration-driven setup using the same validated workflow contracts.
- Why it matters: Improves repeatability and prevents drift when scaling beyond a single workshop run.
- Source: inferred
- Primary owning slice: M003/S01 (provisional)
- Supporting slices: M003/S02 (provisional)
- Validation: mapped
- Notes: Focus is reusable rollout, not full multi-tenant SaaS productization.

## Validated

None yet.

## Deferred

None currently.

## Out of Scope

### R030 — Multi-event organizer platform in current planning horizon
- Class: anti-feature
- Status: out-of-scope
- Description: Building a generalized multi-event SaaS with broad organizer abstractions and tenant-level product complexity.
- Why it matters: Prevents scope drift away from operationally grounded phased delivery.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Can be revisited only after template-driven reuse is proven in practice.

### R031 — Controlled overbooking
- Class: anti-feature
- Status: out-of-scope
- Description: Allowing intentional over-capacity seat booking in primary batches.
- Why it matters: Conflicts with deterministic seat-capacity promise and creates confirmation ambiguity.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Explicitly excluded.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | primary-user-loop | active | M001/S01 | M001/S03 | partial |
| R002 | constraint | active | M001/S02 | M001/S03, M001/S04 | partial |
| R003 | launchability | active | M001/S04 | M001/S01, M001/S02, M001/S03 | mapped |
| R004 | compliance/security | active | M001/S02 | M001/S03 | partial |
| R005 | failure-visibility | active | M001/S03 | M001/S04 | partial |
| R006 | operability | active | M001/S01 | M001/S04 | partial |
| R007 | integration | active | M001/S04 | M001/S01, M001/S02, M001/S03 | mapped |
| R020 | integration | active | M002/S01 (provisional) | M002/S02 (provisional), M003/S01 (provisional) | mapped |
| R021 | differentiator | active | M003/S01 (provisional) | M003/S02 (provisional) | mapped |
| R030 | anti-feature | out-of-scope | none | none | n/a |
| R031 | anti-feature | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 9
- Mapped to slices: 9
- Validated: 0
- Unmapped active requirements: 0
