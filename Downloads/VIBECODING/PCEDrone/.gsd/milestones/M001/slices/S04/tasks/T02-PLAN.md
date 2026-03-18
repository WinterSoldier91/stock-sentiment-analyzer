---
estimated_steps: 5
estimated_files: 2
---

# T02: Add one-command preflight and launch hardening checks

**Slice:** S04 — End-to-End Launch Proof & Hardening
**Milestone:** M001

## Description

Package all local verifier gates into a single fail-fast preflight script so launch readiness can be checked with one command.

## Steps

1. Create `scripts/preflight-m001.sh` with strict shell flags (`set -euo pipefail`).
2. Chain S01/S02/S03 verifier commands in deterministic order.
3. Add clear sectioned output and final pass summary.
4. Update `05_setup_playbook.md` to use the preflight script as the default gate.
5. Run the script and capture output.

## Must-Haves

- [ ] Preflight script runs all relevant verifier commands.
- [ ] Script fails fast on first failing gate.
- [ ] Script prints explicit pass summary on success.
- [ ] Playbook references script as required pre-launch step.

## Verification

- `bash scripts/preflight-m001.sh`

## Inputs

- Existing verifier scripts in `scripts/`.
- S03-updated setup playbook.

## Expected Output

- `scripts/preflight-m001.sh` — launch preflight automation.
- `05_setup_playbook.md` — preflight invocation integrated into launch flow.
