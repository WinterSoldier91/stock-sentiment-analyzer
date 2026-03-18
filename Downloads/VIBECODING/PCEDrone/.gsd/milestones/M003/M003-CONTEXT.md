---
depends_on: [M002]
---

# M003: Reusable Workshop Template & Multi-Run Enablement

**Gathered:** 2026-03-18
**Status:** Ready for planning

## Project Description

M003 turns the proven PCEDrone workflow into a reusable operational template so future workshops can be launched quickly with configuration changes instead of code rewrites, while preserving the same organizer-first reliability standards.

## Why This Milestone

After core flow reliability (M001) and communication automation (M002), the next leverage comes from repeatability. Without template-grade reuse, each new workshop risks setup drift and manual rework that can reintroduce ambiguity and failures.

## User-Visible Outcome

### When this milestone is complete, the user can:

- spin up a new workshop instance using a structured configuration process rather than manual copy/paste editing,
- run the same registration, payment, and communication lifecycle for new cohorts with predictable behavior and verification checks.

### Entry point / environment

- Entry point: project template assets + setup/runbook + configuration surfaces in sheet/script/forms
- Environment: Google Workspace + configured payment/messaging dependencies
- Live dependencies involved: Form/Sheet/App Script linkage, Razorpay setup inputs, messaging channel setup inputs

## Completion Class

- Contract complete means: configurable parameters, setup contracts, and rollout steps are explicitly defined and validated.
- Integration complete means: a second workshop configuration can be brought up and exercised without changing core logic.
- Operational complete means: handoff/runbook supports repeat launches with low drift and clear failure diagnostics.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- a fresh workshop configuration can be created and wired using template/handoff assets,
- a test registration in the new instance follows expected state transitions and operator visibility rules,
- setup verification catches contract drift before launch (sheet columns, triggers, webhook endpoints, message templates).

## Risks and Unknowns

- Configuration drift across form/sheet/script/payment/messaging assets — can silently break flows in copied setups.
- Hidden one-off assumptions in existing script/playbook — may block true reuse.
- Data separation and archival practices across cohorts — can affect operational clarity and reporting continuity.

## Existing Codebase / Prior Art

- `05_setup_playbook.md` — current one-workshop setup baseline.
- `.gsd/milestones/M001/M001-ROADMAP.md` — core integration and verification constraints.
- `.gsd/milestones/M002/M002-CONTEXT.md` — communication automation constraints for reusable rollout.

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R006 — reproducible launch setup
- R007 — external integration completeness
- R020 — communication automation should be portable to new runs
- R021 — reusable multi-workshop template capability

## Scope

### In Scope

- parameterized workshop configuration model,
- repeatable rollout/handoff process for new workshop instances,
- contract checks that validate critical wiring before go-live,
- operator-focused documentation for reliable reuse.

### Out of Scope / Non-Goals

- building a full multi-tenant SaaS product,
- replacing the Google Workspace operational model,
- adding unrelated feature breadth beyond reusable workflow rollout.

## Technical Constraints

- Apps Script project/template strategy must keep trigger/webhook behavior predictable across copies.
- Configuration must preserve M001 and M002 invariants (`no ambiguous confirmations`, state-driven communication).
- Reuse process should minimize manual editing hotspots that are error-prone.

## Integration Points

- Template configuration ↔ Form/Sheet tab and column contracts.
- Template configuration ↔ Razorpay link/webhook settings.
- Template configuration ↔ messaging provider credentials/templates.

## Open Questions

- What is the best packaging format for reproducible reuse (single config sheet, script constants, or hybrid)? — current direction: centralized config plus validation checks.
- How should historical workshop data be separated while retaining operational comparability? — current direction: per-workshop data isolation with normalized summary exports.
