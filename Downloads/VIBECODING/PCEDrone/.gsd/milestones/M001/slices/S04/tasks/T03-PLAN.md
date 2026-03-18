---
estimated_steps: 7
estimated_files: 2
---

# T03: Execute live UAT and capture acceptance evidence

**Slice:** S04 — End-to-End Launch Proof & Hardening
**Milestone:** M001

## Description

Run the real environment acceptance flow and capture evidence that the integrated system behaves correctly for both decisive and non-decisive payment outcomes.

## Steps

1. Prepare a controlled live test participant flow in Google Form + Razorpay test/live mode as applicable.
2. Execute success-path scenario: submit → pay → confirm.
3. Execute non-decisive scenario: webhook/event path that should route to review instead of confirm.
4. Record expected/actual outcomes in `S04-EVIDENCE.md` with timestamps.
5. Attach diagnostic references (sheet rows, dashboard sections, log snippets).
6. Write `S04-UAT.md` with executed steps and observed results.
7. Declare pass/fail for each final acceptance criterion.

## Must-Haves

- [ ] Success-path evidence captured with clear state transitions.
- [ ] Non-decisive-path evidence captured with no ambiguous confirmation.
- [ ] Evidence file includes final milestone acceptance verdict.
- [ ] UAT file reflects actual executed runtime checks.

## Verification

- Evidence document contains filled scenario sections and pass/fail verdicts.
- `.gsd/milestones/M001/slices/S04/S04-UAT.md` exists with executed test log.

## Inputs

- `scripts/preflight-m001.sh` output (must pass before live run).
- `Dashboard`, `Form Responses`, `Webhook Review` runtime surfaces.

## Expected Output

- `.gsd/milestones/M001/slices/S04/S04-EVIDENCE.md` — completed live evidence record.
- `.gsd/milestones/M001/slices/S04/S04-UAT.md` — executed UAT report.
