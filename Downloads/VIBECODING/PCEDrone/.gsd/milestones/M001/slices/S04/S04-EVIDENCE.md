# S04: Integrated Acceptance Evidence (M001)

**Milestone:** M001
**Slice:** S04
**Prepared:** 2026-03-18

> Redaction rule: mask phone/email in this document and never include webhook secrets or credentials.

---

## Preflight Gate

| Item | Command | Result | Timestamp | Notes |
|---|---|---|---|---|
| S01/S02/S03 verifier chain | `bash scripts/preflight-m001.sh` | _pending_ | _pending_ | Must pass before any live run |

---

## Scenario A — Success Path (submit → pay → confirm)

### Run Metadata

- Operator:
- Environment (test/live):
- Form URL used:
- Payment link used:
- Start time:

### Expected Outcome

- Registration row appears with assigned batch.
- Payment event is reconciled decisively.
- Row transitions to `Payment Status=PAID` and `Status=CONFIRMED`.
- Dashboard reflects updated confirmed count.

### Observed Outcome

| Step | Expected | Actual | Verdict | Evidence Source |
|---|---|---|---|---|
| Form submission | Row created with intake defaults | _pending_ | _pending_ | `Form Responses` row __ |
| Payment completion | Webhook processed as MATCHED | _pending_ | _pending_ | `Webhook Review` / logs |
| Final state | `PAID` + `CONFIRMED` | _pending_ | _pending_ | `Form Responses` row __ |
| Dashboard | Confirmed count increments | _pending_ | _pending_ | `Dashboard` snapshot |

---

## Scenario B — Non-Decisive Path (must NOT auto-confirm)

### Run Metadata

- Operator:
- Scenario type (ambiguous / unmatched / replay):
- Start time:

### Expected Outcome

- Event does not auto-confirm any ambiguous row.
- A review signal is visible (`REVIEW_REQUIRED` and/or `Webhook Review` entry).

### Observed Outcome

| Step | Expected | Actual | Verdict | Evidence Source |
|---|---|---|---|---|
| Trigger event | Non-decisive decision class | _pending_ | _pending_ | `Webhook Review` decision |
| Row state safety | No incorrect `CONFIRMED` mutation | _pending_ | _pending_ | `Form Responses` before/after |
| Operator visibility | Review queue signal visible | _pending_ | _pending_ | Dashboard queue + review sheet |

---

## Failure Diagnostics (if any scenario fails)

| Symptom | Where observed | Probable layer | Immediate remediation | Retest timestamp |
|---|---|---|---|---|
| _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |

---

## Final Integrated Acceptance Verdict

- Scenario A (success path): ☐ PASS ☐ FAIL
- Scenario B (non-decisive safety): ☐ PASS ☐ FAIL
- Preflight gate passed before runtime: ☐ YES ☐ NO

**Milestone M001 integrated acceptance:** ☐ PASS ☐ FAIL

### Sign-off

- Operator:
- Completed at:
- Notes:
