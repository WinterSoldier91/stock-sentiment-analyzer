# Apps Script Source (Canonical)

This directory contains the maintained Apps Script source for PCEDrone workshop operations.

## Primary file

- `Code.gs` — bound-script source for registration intake, seat assignment baseline, dashboard refresh, and setup helpers.

## Expected sheet contract

The script expects a linked responses tab named:

- `Form Responses`

And these state headers in row 1:

- Column H: `Batch Assigned`
- Column I: `Payment Status`
- Column J: `Payment Link`
- Column K: `Status`
- Column L: `Notes`

## Deployment note

Copy `Code.gs` contents into the Google Sheet bound script project under **Extensions → Apps Script**.

## Local verification hooks (S01)

From the repo root, run:

```bash
bash scripts/verify-s01-sheet-contract.sh
node scripts/verify-s01-seat-engine.mjs
```

The first command validates symbol/schema contract presence in `Code.gs`.
The second command validates deterministic seat assignment behavior using fixture data.

## Current milestone boundary

- S01 covers intake contract + deterministic seat assignment.
- Webhook signature verification and idempotent reconciliation are deferred to S02.
