---
id: T03
parent: S01
milestone: M001
provides:
  - Local pre-launch verification gate documented in setup playbook
  - Repeatable dual-command S01 diagnostic check path
  - Explicit guidance that webhook reconciliation remains deferred to S02
key_files:
  - 05_setup_playbook.md
  - scripts/verify-s01-sheet-contract.sh
  - scripts/verify-s01-seat-engine.mjs
key_decisions:
  - "Treat failing local S01 verification as launch blocker"
  - "Mark webhook behavior as S01 placeholder to avoid false confidence"
patterns_established:
  - "Pre-launch gate pattern: run contract verifier + behavior verifier before operational go-live"
observability_surfaces:
  - "bash scripts/verify-s01-sheet-contract.sh"
  - "node scripts/verify-s01-seat-engine.mjs"
duration: 20m
verification_result: passed
completed_at: 2026-03-18T13:35:00Z
blocker_discovered: false
---

# T03: Add diagnostics and setup-guard verification path

**Added explicit S01 launch gate checks and updated runbook guidance for verification-first go-live.**

## What Happened

I updated `05_setup_playbook.md` so the canonical source path points to `apps-script/Code.gs`, added a dedicated “Phase 4.5” for local S01 contract checks, and made the expected success outputs explicit. I also marked S01 webhook handling as placeholder-only to prevent accidental assumptions that reconciliation safety is complete before S02.

## Verification

Ran both S01 verification commands together and confirmed they pass in sequence.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/verify-s01-sheet-contract.sh && node scripts/verify-s01-seat-engine.mjs` | 0 | PASS | ~0.2s |

## Diagnostics

Use the two S01 verification commands as the primary pre-launch diagnostics surface. If either fails, treat launch as blocked until contract or assignment behavior is fixed.

## Deviations

None.

## Known Issues

- Live trigger/webhook runtime proof is still pending later slices (S02/S04).

## Files Created/Modified

- `05_setup_playbook.md` — updated with canonical source reference and explicit S01 verification gate.
- `scripts/verify-s01-sheet-contract.sh` — used as required static contract gate.
- `scripts/verify-s01-seat-engine.mjs` — used as deterministic behavior gate.
