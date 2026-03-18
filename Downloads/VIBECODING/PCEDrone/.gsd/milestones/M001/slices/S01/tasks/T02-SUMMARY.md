---
id: T02
parent: S01
milestone: M001
provides:
  - Deterministic seat-assignment fixture scenarios
  - Executable seat-engine verifier for capacity and waitlist behavior
  - Verified intake state expectations for REGISTERED/WAITLISTED + payment-link assignment
key_files:
  - fixtures/s01/intake-sequence.json
  - scripts/verify-s01-seat-engine.mjs
  - apps-script/Code.gs
key_decisions:
  - "Use fixture-driven contract verification for S01 since live Google runtime proof is reserved for S04"
  - "Treat waitlisted rows as PENDING + WAITLISTED with blank payment link to prevent accidental payment prompts"
patterns_established:
  - "Deterministic simulation pattern: scenario fixtures + pure verifier script"
  - "Boundary-safe state model: seat assignment drives status and payment-link eligibility"
observability_surfaces:
  - "node scripts/verify-s01-seat-engine.mjs"
  - "Code.gs logs: batch_assigned, waitlist_routed"
duration: 35m
verification_result: passed
completed_at: 2026-03-18T13:20:00Z
blocker_discovered: false
---

# T02: Implement deterministic seat assignment and intake state transitions

**Added fixture-backed verification for deterministic assignment, waitlist routing, and intake state outputs.**

## What Happened

I created `fixtures/s01/intake-sequence.json` with two representative scenarios: normal filling with overflow to waitlist, and premium-preference behavior with capacity overflow. I added `scripts/verify-s01-seat-engine.mjs` to replay these scenarios and assert row-level outputs (`batchAssigned`, `status`, `paymentStatus`, `paymentLink`) plus no-overfill guarantees for each batch. The existing `Code.gs` intake/assignment behavior aligns with these fixture expectations.

## Verification

Ran the seat-engine verifier and confirmed all scenarios pass with expected outputs and capacity safety checks.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node scripts/verify-s01-seat-engine.mjs` | 0 | PASS | ~0.1s |

## Diagnostics

Future agents can run `node scripts/verify-s01-seat-engine.mjs` to catch assignment regressions quickly. Runtime behavior can be correlated via Apps Script logs (`batch_assigned`, `waitlist_routed`) and row states in columns H–L.

## Deviations

None.

## Known Issues

- Verifier currently checks logic via fixtures, not live trigger execution in Google runtime.

## Files Created/Modified

- `fixtures/s01/intake-sequence.json` — deterministic scenario definitions for assignment/state checks.
- `scripts/verify-s01-seat-engine.mjs` — executable verifier for S01 seat engine behavior.
- `apps-script/Code.gs` — consumed by contract; no additional functional changes required after verifier alignment.
