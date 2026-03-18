---
depends_on: [M001]
---

# M002: Communication Automation & Operator Controls

**Gathered:** 2026-03-18
**Status:** Ready for planning

## Project Description

M002 extends the launch-proven core flow by automating participant communication while preserving the same trust boundary: communication must reflect real state, and the system must still enforce **no ambiguous confirmations**.

## Why This Milestone

M001 prioritizes transaction correctness and keeps WhatsApp manual to reduce launch risk. Once the core path is stable, manual messaging becomes the main operational bottleneck. This milestone reduces operator load and response lag without weakening confirmation correctness.

## User-Visible Outcome

### When this milestone is complete, the user can:

- have participants receive automated stage-appropriate messages (registration acknowledgement, payment reminder, confirmation) from real workflow state,
- see communication delivery outcomes and failures clearly so unresolved participants are actionable.

### Entry point / environment

- Entry point: existing Google Form/Sheet/Apps Script workflow plus configured messaging channel adapter
- Environment: Google Workspace operational flow + messaging provider runtime
- Live dependencies involved: Google Apps Script triggers/webhooks, sheet state, external messaging API/provider

## Completion Class

- Contract complete means: message types, send rules, retry rules, and safety constraints are defined against workflow states.
- Integration complete means: real messages are sent from live state changes and failures are surfaced in operator-facing status fields/logs.
- Operational complete means: duplicate events and retries do not spam users or contradict true payment/confirmation state.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- a real registration moves through state transitions and receives the correct message sequence automatically,
- no message path can claim confirmation unless the registration satisfies the same paid-and-assigned confirmation invariant,
- delivery failures and retry exhaustion are visible for manual intervention, not silently dropped.

## Risks and Unknowns

- Messaging provider constraints/approvals (for example template approvals) — can delay or shape automation capability.
- Duplicate trigger and webhook interactions — can cause double sends without message idempotency keys.
- Channel reliability variance — requires explicit failure visibility and fallback workflow.

## Existing Codebase / Prior Art

- `01_apps_script_code.md` — current script baseline with manual-first communications.
- `.gsd/milestones/M001/M001-ROADMAP.md` — confirmed state model and reconciliation invariants.
- `.gsd/REQUIREMENTS.md` — capability contract including communication automation requirement.

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R002 — preserve unambiguous confirmation invariant in all outward communications
- R005 — keep failure visibility actionable for operators
- R007 — maintain coherent cross-system integration
- R020 — automate WhatsApp communication flow

## Scope

### In Scope

- automated participant messaging tied to explicit workflow state transitions,
- channel-aware idempotency and duplicate-send protection,
- operator visibility for sent/failed/pending communication states,
- safe fallback path for unresolved delivery failures.

### Out of Scope / Non-Goals

- broad CRM or marketing campaign system,
- generalized multi-event orchestration,
- replacing core registration/payment invariants from M001.

## Technical Constraints

- Messaging integration must conform to provider policy and approval constraints.
- Apps Script quotas/runtime limits must be respected for automated sends/retries.
- Communication triggers must derive from canonical state transitions, not ad hoc manual flags.

## Integration Points

- Sheet status engine from M001 — source of truth for communication eligibility.
- Payment reconciliation outputs — gate for confirmation messaging.
- External messaging provider API — outbound communication transport and delivery outcomes.

## Open Questions

- Which provider path is best for deployment speed versus delivery observability? — current direction: choose the fastest compliant path with clear delivery status hooks.
- What retry/fallback cadence best balances participant clarity and spam risk? — current direction: bounded retries plus explicit manual queue.
