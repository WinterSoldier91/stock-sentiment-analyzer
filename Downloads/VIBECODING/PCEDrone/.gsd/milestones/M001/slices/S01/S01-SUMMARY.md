---
id: S01
parent: M001
milestone: M001
provides:
  - Canonical Apps Script source with explicit intake contract checks
  - Deterministic seat assignment baseline with hard-cap + waitlist behavior
  - Local verification gate for sheet contract and seat-engine behavior
requires:
  - slice: none
    provides: First slice in milestone; no upstream slice dependencies
affects:
  - S02
  - S03
  - S04
key_files:
  - apps-script/Code.gs
  - scripts/verify-s01-sheet-contract.sh
  - scripts/verify-s01-seat-engine.mjs
  - fixtures/s01/intake-sequence.json
  - 05_setup_playbook.md
key_decisions:
  - Keep webhook reconciliation as placeholder in S01 and enforce payment authenticity/idempotency in S02
  - Use fixture-based verification to prove deterministic assignment before live integration slice
patterns_established:
  - Contract-first guard pattern before row mutation
  - Pre-launch gate pattern (static contract check + behavior simulation)
observability_surfaces:
  - bash scripts/verify-s01-sheet-contract.sh
  - node scripts/verify-s01-seat-engine.mjs
  - Logger JSON events in Code.gs (intake_processed, batch_assigned, waitlist_routed, intake_failed)
drill_down_paths:
  - .gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T03-SUMMARY.md
duration: 1h40m
verification_result: passed
completed_at: 2026-03-18T13:40:00Z
---

# S01: Registration Contract & Seat Engine

**Shipped a deterministic intake foundation with explicit sheet contracts, capacity-safe seat assignment, and executable S01 verification gates.**

## What Happened

S01 converted draft markdown logic into a maintained Apps Script code artifact (`apps-script/Code.gs`) and established a clear contract for the operational sheet shape and intake state columns. The assignment path now follows deterministic hard-cap behavior with explicit waitlist routing semantics and baseline diagnostics.

To make this slice mechanically checkable, two verification commands were added: one static contract verifier for required symbols/headers and one fixture-driven seat-engine verifier that checks assignment outcomes and capacity constraints. The setup playbook was updated to include these commands as launch blockers if they fail.

## Verification

- `bash scripts/verify-s01-sheet-contract.sh` passes and confirms required intake/schema symbols in canonical script source.
- `node scripts/verify-s01-seat-engine.mjs` passes across normal-fill and overflow scenarios with no over-capacity assignment.
- Combined run (`bash ... && node ...`) passes and is now documented in `05_setup_playbook.md`.

## Requirements Advanced

- R001 — codified deterministic seat assignment and validated no-overfill behavior via fixture scenarios.
- R006 — established reproducible setup checks and explicit pre-launch verification commands.
- R007 — advanced core integration foundation by versioning canonical Apps Script source contract.

## Requirements Validated

- none (full milestone-level live integration proof remains for S04).

## New Requirements Surfaced

- none.

## Requirements Invalidated or Re-scoped

- none.

## Deviations

None.

## Known Limitations

- S01 webhook path is intentionally placeholder-only; authenticity and idempotent reconciliation are deferred to S02.
- S01 verification is contract/fixture-level and does not prove live Google runtime execution yet.

## Follow-ups

- In S02, implement signature validation, idempotent webhook handling, and unambiguous confirmation transitions.
- In S04, run real integrated submit→pay→confirm acceptance flow in live environment.

## Files Created/Modified

- `apps-script/Code.gs` — canonical Apps Script source for intake contract and seat engine baseline.
- `apps-script/README.md` — deployment assumptions and verification references.
- `scripts/verify-s01-sheet-contract.sh` — static S01 schema/symbol verifier.
- `scripts/verify-s01-seat-engine.mjs` — fixture-driven assignment/state verifier.
- `fixtures/s01/intake-sequence.json` — scenario fixtures for deterministic behavior checks.
- `05_setup_playbook.md` — updated with pre-launch S01 contract checks.

## Forward Intelligence

### What the next slice should know
- `Code.gs` now has explicit status/note surfaces; S02 should reuse those paths for reconciliation failures instead of inventing new columns.
- Keep row-level state mutation centralized; ad hoc writes will break deterministic verification.

### What's fragile
- Webhook pathway is currently a non-enforcing placeholder — treating it as production-ready before S02 will cause false confidence.

### Authoritative diagnostics
- `node scripts/verify-s01-seat-engine.mjs` — fastest indicator that assignment logic still preserves capacity/waitlist invariants.
- `bash scripts/verify-s01-sheet-contract.sh` — fastest indicator that schema/symbol contract has not drifted.

### What assumptions changed
- Assumption: markdown playbook plus script snippet was enough for repeatable execution — Actual: explicit versioned source + executable verification was necessary to make the slice mechanically reliable.
