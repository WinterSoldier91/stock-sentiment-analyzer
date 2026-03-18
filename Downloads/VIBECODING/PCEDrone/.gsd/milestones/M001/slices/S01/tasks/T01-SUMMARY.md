---
id: T01
parent: S01
milestone: M001
provides:
  - Canonical Apps Script source file under version control
  - Explicit sheet-state schema assertions for columns H–L
  - Input normalization helpers for intake path
  - Contract verification script for S01 symbols/headers
key_files:
  - apps-script/Code.gs
  - apps-script/README.md
  - scripts/verify-s01-sheet-contract.sh
key_decisions:
  - "Keep webhook reconciliation as a placeholder in S01; enforce authenticity/idempotency in S02"
  - "Make schema mismatch a hard failure with row-level ERROR note when row context exists"
patterns_established:
  - "Contract-first guard pattern: assert sheet schema before state mutation"
  - "Maintain Apps Script source in repo and copy to bound project, not markdown-only snippets"
observability_surfaces:
  - "Logger JSON events: intake_processed, batch_assigned, waitlist_routed, intake_failed"
  - "Row-level Status/Notes failure marking via CONFIG_ERROR"
duration: 45m
verification_result: passed
completed_at: 2026-03-18T13:00:00Z
blocker_discovered: false
---

# T01: Version Apps Script intake contract from source docs

**Created a canonical `apps-script/Code.gs` with explicit schema guards and local contract verification.**

## What Happened

I converted the markdown draft script into a maintained source file (`apps-script/Code.gs`) and added explicit contract helpers for the response tab and state columns. Intake now runs through shared helpers for row discovery, normalization, schema assertions, and failure recording. I also added a repository-level README for deployment context and verification paths, and introduced a contract verifier script (`scripts/verify-s01-sheet-contract.sh`) that checks required symbols and schema literals.

## Verification

Ran the S01 contract verification command against the new source. It confirmed required entrypoints, schema headers, and column mappings are present.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/verify-s01-sheet-contract.sh` | 0 | PASS | ~0.1s |

## Diagnostics

Use `bash scripts/verify-s01-sheet-contract.sh` for static contract checks. At runtime in Apps Script, inspect JSON log events plus `Status`/`Notes` columns for `CONFIG_ERROR` and intake lifecycle markers.

## Deviations

None.

## Known Issues

- `node scripts/verify-s01-seat-engine.mjs` is not created yet (planned for T02).
- Webhook path is intentionally a placeholder until S02 hardening.

## Files Created/Modified

- `apps-script/Code.gs` — canonical Apps Script source with S01 contract helpers and baseline intake flow.
- `apps-script/README.md` — deployment assumptions and verification command references.
- `scripts/verify-s01-sheet-contract.sh` — static verifier for S01 symbol/header contract.
