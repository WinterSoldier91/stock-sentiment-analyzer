---
estimated_steps: 7
estimated_files: 2
---

# T01: Version Apps Script intake contract from source docs

**Slice:** S01 — Registration Contract & Seat Engine
**Milestone:** M001

## Description

Create a maintained Apps Script code artifact from the existing markdown draft, with explicit sheet schema guards and normalized input helpers so downstream tasks have a stable executable contract.

## Steps

1. Create `apps-script/` as the code location for maintained Apps Script source.
2. Create `apps-script/Code.gs` and migrate the baseline config and trigger entrypoints from `01_apps_script_code.md`.
3. Add explicit helpers for sheet lookup and schema assertions (required tab and H–L headers).
4. Add lightweight normalization helpers for participant inputs (phone/text hygiene) used by intake logic.
5. Add defensive early-fail behavior for schema mismatch with actionable log messages.
6. Create `apps-script/README.md` describing deployment target, required sheet contracts, and where S01 verification scripts fit.
7. Run contract verification command and fix any mismatch in function/contract names.

## Must-Haves

- [ ] `apps-script/Code.gs` exists with CONFIG and intake entrypoint structure.
- [ ] Schema assertion helper(s) enforce `Form Responses` + state column contract.
- [ ] Input normalization helper(s) are present and used by intake path.
- [ ] `apps-script/README.md` explains setup assumptions and verification hooks.

## Verification

- `bash scripts/verify-s01-sheet-contract.sh`
- Confirm command exits 0 and reports all required S01 contract symbols found.

## Inputs

- `01_apps_script_code.md` — baseline script logic to migrate into versioned source.
- `02_sheet_template.md` — authoritative response column contract.
- `.gsd/milestones/M001/slices/S01/S01-PLAN.md` — slice-level must-haves and boundaries.

## Expected Output

- `apps-script/Code.gs` — canonical Apps Script source with explicit intake contract helpers.
- `apps-script/README.md` — deployment/context notes for this code artifact.
