---
id: T02
parent: S02
milestone: M001
provides:
  - Deterministic webhook-to-row reconciliation engine
  - Invariant-safe state transitions (only decisive matches confirm)
  - Fixture suite for matched/ambiguous/unmatched/rejected scenarios
key_files:
  - apps-script/Code.gs
  - fixtures/s02/webhook-events.json
  - scripts/verify-s02-webhook-matching.mjs
key_decisions:
  - "Exclude waitlisted rows from auto-confirm eligibility"
  - "Route ambiguous candidates to REVIEW_REQUIRED instead of choosing one heuristically"
patterns_established:
  - "Decision-first reconciliation pattern: scaffold decision -> row reconciliation -> transition application"
observability_surfaces:
  - "node scripts/verify-s02-webhook-matching.mjs"
  - "Webhook Review sheet append log"
duration: 55m
verification_result: passed
completed_at: 2026-03-18T14:30:00Z
blocker_discovered: false
---

# T02: Implement deterministic reconciliation and invariant-safe transitions

**Implemented webhook reconciliation decisions that confirm only decisive matches and surface ambiguity explicitly.**

## What Happened

I extended `doPost` from authenticated scaffolding into deterministic reconciliation. After signature verification and payload normalization, webhook events now pass through decision scaffolding and a row-reconciliation engine. Eligible candidates are constrained to non-waitlist, non-confirmed rows; if reconciliation is decisive, the row transitions to `PAID` + `CONFIRMED`. If multiple candidates remain or no candidate exists, the system records non-confirming outcomes (`AMBIGUOUS`/`UNMATCHED`) and surfaces them via `REVIEW_REQUIRED` markers and a `Webhook Review` sheet.

To prove invariant behavior, I added `fixtures/s02/webhook-events.json` and `scripts/verify-s02-webhook-matching.mjs` covering matched, ambiguous, unmatched, waitlist-not-confirmable, and unsupported-event paths.

## Verification

Ran fixture reconciliation verifier and re-ran security contract verifier to ensure webhook auth scaffolding remained intact.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node scripts/verify-s02-webhook-matching.mjs` | 0 | PASS | ~0.2s |
| 2 | `bash scripts/verify-s02-security-contract.sh` | 0 | PASS | ~0.1s |

## Diagnostics

Inspect `Webhook Review` sheet for reconciliation outcomes and candidate context. Use `node scripts/verify-s02-webhook-matching.mjs` to catch regressions in confirmation-invariant behavior.

## Deviations

None.

## Known Issues

- Duplicate/replay idempotency is not enforced yet (T03).

## Files Created/Modified

- `apps-script/Code.gs` — reconciliation engine and transition application logic.
- `fixtures/s02/webhook-events.json` — webhook decision scenarios.
- `scripts/verify-s02-webhook-matching.mjs` — deterministic reconciliation verifier.
