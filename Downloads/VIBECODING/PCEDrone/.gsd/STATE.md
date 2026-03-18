# GSD State

**Active Milestone:** M001 — Launch-Ready Workshop Ops Core
**Active Slice:** S01 — Registration Contract & Seat Engine
**Active Task:** T01 — Version Apps Script intake contract from source docs
**Phase:** Executing

## Recent Decisions
- Expanded planning horizon from single milestone to a three-milestone sequence.
- M001 remains active; downstream milestones stay queued behind dependency chain.
- S01 decomposed into T01–T03 with contract-first verification commands.
- S01 verification strategy is fixture/contract-level locally, with full real integration deferred to S04.
- Preserved non-negotiable invariant: no ambiguous confirmations.

## Blockers
- None

## Next Action
Execute T01: create `apps-script/Code.gs` and `apps-script/README.md`, then run `bash scripts/verify-s01-sheet-contract.sh`.
