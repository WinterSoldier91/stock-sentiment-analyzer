# S01: Registration Contract & Seat Engine — UAT

**Milestone:** M001
**Written:** 2026-03-18

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S01 is contract-level; live integration proof is intentionally deferred to later slices.

## Preconditions

- Repository checked out at latest S01 commit.
- Node.js available for local verifier command.
- Working directory is project root.

## Smoke Test

Run both verification commands and confirm both pass without errors.

## Test Cases

### 1. Sheet contract symbols and headers

1. Run: `bash scripts/verify-s01-sheet-contract.sh`
2. Observe output lines for required symbols and headers
3. **Expected:** command exits 0 and prints `S01 sheet contract verification passed.`

### 2. Deterministic seat assignment behavior

1. Run: `node scripts/verify-s01-seat-engine.mjs`
2. Confirm both fixture scenarios pass
3. **Expected:** command exits 0 and prints `S01 seat engine verification passed (...)`

## Edge Cases

### Overflow to waitlist

1. In `fixtures/s01/intake-sequence.json`, review `normal_fill_then_waitlist` scenario.
2. Run seat-engine verifier.
3. **Expected:** final participant routes to `Waitlist` with `status=WAITLISTED`, blank `paymentLink`, and no batch over-capacity.

## Failure Signals

- Contract verifier reports missing symbols/headers.
- Seat-engine verifier reports mismatch between expected and actual state.
- Verifier reports overfilled batch counts.

## Requirements Proved By This UAT

- R001 — deterministic capacity-safe assignment behavior at fixture/contract proof level.
- R006 — reproducible pre-launch verification checks exist and run.

## Not Proven By This UAT

- Live Google Form trigger execution in production-like runtime.
- Webhook signature validation, idempotency, and unambiguous payment reconciliation (S02 scope).
- End-to-end participant submit→pay→confirm path in real environment (S04 scope).

## Notes for Tester

This UAT intentionally validates contract/logic artifacts only. Treat it as a gate before live testing, not as final launch acceptance.
