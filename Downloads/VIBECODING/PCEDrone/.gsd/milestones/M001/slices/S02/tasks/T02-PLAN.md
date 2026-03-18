---
estimated_steps: 9
estimated_files: 3
---

# T02: Implement deterministic reconciliation and invariant-safe transitions

**Slice:** S02 — Payment Reconciliation & Confirmation Invariant
**Milestone:** M001

## Description

Build the webhook match engine that maps payment events to registrations with deterministic outcomes and enforces the no-ambiguous-confirmations invariant.

## Steps

1. Define reconciliation key extraction from webhook payload (phone/email/reference where available).
2. Implement candidate row lookup from `Form Responses` using normalized fields.
3. Add deterministic decision logic for `MATCHED`, `AMBIGUOUS`, and `UNMATCHED` outcomes.
4. Implement state transition function that only sets `PAID` + `CONFIRMED` for decisive matches.
5. Route ambiguous/unmatched events to explicit review markers in `Status`/`Notes`.
6. Create fixture scenarios covering matched, unmatched, and ambiguous cases.
7. Build verifier to replay fixture events and assert decision/state outputs.
8. Ensure no fixture path allows ambiguous auto-confirm transition.
9. Re-run verifier until all scenarios pass.

## Must-Haves

- [ ] Decisive match path updates row state to `PAID` + `CONFIRMED`.
- [ ] Ambiguous match path never sets `CONFIRMED`.
- [ ] Unmatched events are visible and actionable through explicit notes/status.
- [ ] Fixture scenarios cover all three decision classes.

## Verification

- `node scripts/verify-s02-webhook-matching.mjs`
- Verify command confirms all scenarios and invariant checks pass.

## Inputs

- `apps-script/Code.gs` — webhook scaffolding from T01.
- `.gsd/milestones/M001/M001-ROADMAP.md` — S02 boundary map contracts.
- `.gsd/milestones/M001/slices/S01/S01-SUMMARY.md` — established state conventions and diagnostics.

## Expected Output

- `apps-script/Code.gs` — deterministic reconciliation engine and invariant-safe state transitions.
- `fixtures/s02/webhook-events.json` — reconciliation scenario fixtures.
- `scripts/verify-s02-webhook-matching.mjs` — executable invariant verifier.
