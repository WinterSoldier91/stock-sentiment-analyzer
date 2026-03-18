# Apps Script Source (Canonical)

This directory contains the maintained Apps Script source for PCEDrone workshop operations.

## Primary file

- `Code.gs` — bound-script source for registration intake, seat assignment, webhook reconciliation, dashboard visibility, and operator tools.

## Expected sheet contract

The script expects a linked responses tab named:

- `Form Responses`

And these state headers in row 1:

- Column H: `Batch Assigned`
- Column I: `Payment Status`
- Column J: `Payment Link`
- Column K: `Status`
- Column L: `Notes`

It also creates/uses:

- `Dashboard` — operational summary view
- `Webhook Review` — reconciliation decision log for non-decisive or replayed events

## Deployment note

Copy `Code.gs` contents into the Google Sheet bound script project under **Extensions → Apps Script**.

## Required script property (S02+)

Set in Apps Script **Project Settings → Script properties**:

- `RAZORPAY_WEBHOOK_SECRET` — webhook secret configured in Razorpay dashboard.

## Operator actions (S03)

From the `🚀 Workshop Tools` menu:

- `Resolve Review → Confirm`
- `Resolve Review → Keep Pending`
- `Resolve Review → Cancel`

These actions only operate on rows currently in `REVIEW_REQUIRED`, and they append audit notes automatically.

## Local verification hooks

From repo root:

```bash
bash scripts/verify-s01-sheet-contract.sh
node scripts/verify-s01-seat-engine.mjs
bash scripts/verify-s02-security-contract.sh
node scripts/verify-s02-webhook-matching.mjs
```

## Current milestone boundary

- S01: intake contract + deterministic seat assignment.
- S02: authenticated, idempotent webhook reconciliation with invariant-safe transitions.
- S03: operator visibility and review-resolution workflow (in progress).
