# GSD State

**Active Milestone:** M001 — Launch-Ready Workshop Ops Core
**Active Slice:** S01 — Registration Contract & Seat Engine
**Active Task:** T02 — Implement deterministic seat assignment and intake state transitions
**Phase:** Executing

## Recent Decisions
- Expanded planning horizon from single milestone to a three-milestone sequence.
- S01 uses contract-first local verification, with live integration proof deferred to S04.
- Canonical Apps Script source is now versioned under `apps-script/Code.gs`.
- Webhook reconciliation remains intentionally deferred to S02 hardening.
- Preserved non-negotiable invariant: no ambiguous confirmations.

## Blockers
- None

## Next Action
Execute T02: add fixture-driven seat assignment verification (`fixtures/s01/intake-sequence.json`, `scripts/verify-s01-seat-engine.mjs`) and make sure `node scripts/verify-s01-seat-engine.mjs` passes.
