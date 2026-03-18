---
estimated_steps: 8
estimated_files: 2
---

# T01: Add webhook authenticity and decision scaffolding

**Slice:** S02 — Payment Reconciliation & Confirmation Invariant
**Milestone:** M001

## Description

Introduce signature-verification and decision-model scaffolding in the webhook path so payment events are authenticated and normalized before any reconciliation mutates row state.

## Steps

1. Define webhook security config surface for secret retrieval (for example Script Properties key).
2. Add helper to compute HMAC-SHA256 signature over raw request body.
3. Add helper to compare provided signature and expected signature in constant-time style.
4. Add webhook payload parsing helper to normalize required payment-link fields.
5. Add reconciliation decision enum/shape to centralize `MATCHED`, `AMBIGUOUS`, `UNMATCHED`, `REPLAY`, `REJECTED` outcomes.
6. Wire `doPost` through authenticity + parsing + decision scaffolding (without full match engine yet).
7. Update `03_razorpay_setup.md` with explicit secret setup requirements.
8. Create/run security contract verifier.

## Must-Haves

- [ ] Webhook signature verification helper exists and consumes raw body string.
- [ ] `doPost` rejects unauthenticated requests before state mutation.
- [ ] Reconciliation decision scaffolding exists with explicit outcome categories.
- [ ] Setup docs include webhook secret configuration guidance.

## Verification

- `bash scripts/verify-s02-security-contract.sh`
- Command must exit 0 and confirm required security-path symbols.

## Inputs

- `apps-script/Code.gs` — S01 webhook placeholder and intake state model.
- `03_razorpay_setup.md` — webhook setup baseline to harden.
- `.gsd/milestones/M001/slices/S02/S02-PLAN.md` — S02 must-haves and verification contract.

## Expected Output

- `apps-script/Code.gs` — authenticated webhook scaffolding and decision model entrypoint.
- `scripts/verify-s02-security-contract.sh` — static verifier for S02 security contract symbols.
