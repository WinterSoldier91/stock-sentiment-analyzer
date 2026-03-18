---
estimated_steps: 8
estimated_files: 3
---

# T02: Implement deterministic seat assignment and intake state transitions

**Slice:** S01 — Registration Contract & Seat Engine
**Milestone:** M001

## Description

Implement deterministic batch assignment and intake state transitions in the Apps Script source, then prove behavior with fixture-driven verification that catches overfill and incorrect routing.

## Steps

1. Implement deterministic batch counting and assignment flow in `assignBatch_` using configured max-per-batch and total-batches.
2. Encode auto-shift behavior across batches and explicit waitlist fallback when all capacity is exhausted.
3. Implement intake writes in `onFormSubmit` for `Batch Assigned`, `Payment Status`, `Payment Link`, `Status`, and `Notes`.
4. Ensure waitlist rows get the correct non-payment path with explicit notes/status.
5. Add/adjust helper logic for payment link selection defaults used during intake.
6. Create `fixtures/s01/intake-sequence.json` with representative scenarios (normal fill, boundary fill, overflow).
7. Create/update `scripts/verify-s01-seat-engine.mjs` to replay fixture data and assert expected assignments and status writes.
8. Run verification and adjust logic until assertions pass.

## Must-Haves

- [ ] Seat assignment is deterministic and capacity-safe under fixture scenarios.
- [ ] Intake writes canonical initial states for non-waitlist rows.
- [ ] Overflow routes to waitlist without mutating capacity counts incorrectly.
- [ ] Fixture verifier covers at least one full-capacity + overflow case.

## Verification

- `node scripts/verify-s01-seat-engine.mjs`
- Verify output confirms no over-capacity assignments and expected waitlist transition behavior.

## Inputs

- `apps-script/Code.gs` — canonical script file produced in T01.
- `02_sheet_template.md` — state column definitions and accepted values.
- `.gsd/milestones/M001/M001-ROADMAP.md` — S01→S02 boundary contracts for assignment and intake state.

## Expected Output

- `apps-script/Code.gs` — deterministic seat and intake state implementation.
- `fixtures/s01/intake-sequence.json` — fixture scenarios for assignment verification.
- `scripts/verify-s01-seat-engine.mjs` — executable contract verification for assignment/state outputs.
