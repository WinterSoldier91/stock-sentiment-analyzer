---
id: T01
parent: S02
milestone: M001
provides:
  - Webhook signature verification scaffolding in `doPost`
  - Reconciliation decision model enum and parsing helpers
  - Security contract verification script for S02
  - Script-property based webhook secret setup guidance
key_files:
  - apps-script/Code.gs
  - scripts/verify-s02-security-contract.sh
  - 03_razorpay_setup.md
key_decisions:
  - "Read webhook secret from Script Properties (`RAZORPAY_WEBHOOK_SECRET`) instead of hardcoding"
  - "Reject unauthenticated webhooks before any state mutation"
patterns_established:
  - "Authenticated-first webhook pattern: verify raw-body signature, then parse/decide"
observability_surfaces:
  - "Logger events: webhook_authenticated, webhook_rejected, webhook_failed"
  - "bash scripts/verify-s02-security-contract.sh"
duration: 45m
verification_result: passed
completed_at: 2026-03-18T14:05:00Z
blocker_discovered: false
---

# T01: Add webhook authenticity and decision scaffolding

**Added authenticated webhook intake scaffolding with explicit reconciliation decision classes and security contract checks.**

## What Happened

I replaced the S01 placeholder webhook with an authenticated intake flow. `doPost` now reads raw request body, retrieves webhook secret from Script Properties, validates HMAC-SHA256 signature, and only then builds a normalized webhook event object. I added a reconciliation decision scaffold (`MATCHED`, `AMBIGUOUS`, `UNMATCHED`, `REPLAY`, `REJECTED`) so T02 can plug in deterministic row matching without redesigning webhook plumbing.

I also added the S02 security verifier script and updated Razorpay setup documentation with required secret setup (`RAZORPAY_WEBHOOK_SECRET`) and raw-body verification behavior.

## Verification

Ran S02 security contract verification command and confirmed all required webhook-auth symbols are present.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/verify-s02-security-contract.sh` | 0 | PASS | ~0.1s |

## Diagnostics

Use `bash scripts/verify-s02-security-contract.sh` for static scaffolding validation. At runtime, inspect Apps Script logs for `webhook_authenticated`, `webhook_rejected`, and `webhook_failed` events.

## Deviations

None.

## Known Issues

- Row-level reconciliation and state mutation rules are not implemented yet (T02/T03).
- Duplicate/replay handling is not active yet (T03).

## Files Created/Modified

- `apps-script/Code.gs` — webhook authentication/parsing/decision scaffolding.
- `scripts/verify-s02-security-contract.sh` — static S02 security contract verifier.
- `03_razorpay_setup.md` — webhook secret setup and signature verification guidance.
