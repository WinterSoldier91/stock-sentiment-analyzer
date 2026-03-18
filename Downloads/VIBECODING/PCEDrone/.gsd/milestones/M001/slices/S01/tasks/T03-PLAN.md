---
estimated_steps: 6
estimated_files: 3
---

# T03: Add diagnostics and setup-guard verification path

**Slice:** S01 — Registration Contract & Seat Engine
**Milestone:** M001

## Description

Make S01 operationally inspectable by adding high-signal intake diagnostics, finalizing contract verification scripts, and updating the setup playbook with pre-launch checks.

## Steps

1. Add clear diagnostic note/status markers in intake flow for schema mismatch, waitlist routing, and manual-followup cases.
2. Ensure log messages include row-level context without leaking sensitive values.
3. Create or refine `scripts/verify-s01-sheet-contract.sh` to assert required sheet contract symbols and constants.
4. Re-run both S01 verification commands and stabilize output for repeatability.
5. Update `05_setup_playbook.md` with explicit S01 pre-launch verification commands and expected success signals.
6. Perform a final pass ensuring diagnostics and verification align with S01 must-haves and boundary outputs.

## Must-Haves

- [ ] Intake path emits actionable diagnostics for config/contract failures and routing outcomes.
- [ ] Contract verifier and seat-engine verifier both pass in a clean local run.
- [ ] Setup playbook includes explicit verification run and expected result guidance.
- [ ] No diagnostic path logs secrets or payment credentials.

## Verification

- `bash scripts/verify-s01-sheet-contract.sh && node scripts/verify-s01-seat-engine.mjs`
- Confirm both commands exit 0 and playbook instructions match actual command paths/output.

## Observability Impact

- Signals added/changed: intake status/note markers and structured assignment lifecycle logs.
- How a future agent inspects this: run S01 verification scripts and inspect `Form Responses` state columns/log output.
- Failure state exposed: contract mismatch, overflow routing, and manual-followup conditions become explicit and searchable.

## Inputs

- `apps-script/Code.gs` — intake and assignment implementation from T01/T02.
- `05_setup_playbook.md` — launch runbook to update with S01 checks.
- `.gsd/milestones/M001/slices/S01/S01-PLAN.md` — observability expectations for this slice.

## Expected Output

- `scripts/verify-s01-sheet-contract.sh` — repeatable contract verification command.
- `apps-script/Code.gs` — enhanced diagnostics/notes/logging for intake observability.
- `05_setup_playbook.md` — updated with S01 pre-launch verification checklist.
