---
estimated_steps: 6
estimated_files: 2
---

# T01: Build integrated acceptance checklist and evidence template

**Slice:** S04 — End-to-End Launch Proof & Hardening
**Milestone:** M001

## Description

Create a structured evidence artifact for real runtime acceptance so milestone completion can be judged on recorded outcomes rather than memory.

## Steps

1. Create `.gsd/milestones/M001/slices/S04/S04-EVIDENCE.md`.
2. Add sections for success-path and non-decisive-path evidence capture.
3. Include required fields: timestamp, actor, action, expected, actual, evidence source.
4. Add failure-capture section with root-cause and remediation notes.
5. Add final acceptance verdict block for milestone-level decision.
6. Update playbook references to evidence file usage.

## Must-Haves

- [ ] Evidence template includes both success and non-decisive scenarios.
- [ ] Template has explicit expected vs actual fields.
- [ ] Failure diagnostics capture structure is present.
- [ ] Template references redaction rules for sensitive data.

## Verification

- `test -f .gsd/milestones/M001/slices/S04/S04-EVIDENCE.md`
- Open file and confirm required sections exist.

## Inputs

- `.gsd/milestones/M001/M001-ROADMAP.md` — final integrated acceptance requirements.
- `05_setup_playbook.md` — current execution flow.

## Expected Output

- `.gsd/milestones/M001/slices/S04/S04-EVIDENCE.md` — structured acceptance evidence template.
- `05_setup_playbook.md` — updated reference to evidence-capture workflow.
