# Project

## What This Is

PCEDrone is an organizer-first workshop registration operations system that runs on Google Form + Google Sheet + Apps Script + Razorpay, with a phased plan to add communication automation and reusable rollout for future workshops.

## Core Value

No ambiguous confirmations: a participant is confirmed only when seat assignment and payment evidence are both clear and auditable.

## Current State

The project has baseline implementation/playbook markdown artifacts (`01_apps_script_code.md` to `05_setup_playbook.md`) and now has multi-milestone GSD planning artifacts in place. M001 is roadmap-defined; M002 and M003 are context-defined for downstream planning.

## Architecture / Key Patterns

- Google Form submissions feed `Form Responses` in Google Sheets.
- Apps Script is the workflow engine for seat assignment, status transitions, dashboard refresh, and webhook handling.
- Razorpay events provide payment evidence that gates confirmation status.
- State columns (H–L) are the operational contract for lifecycle visibility.
- Milestone strategy is phased:
  - M001: correctness and launch proof,
  - M002: automated participant communication with operator controls,
  - M003: reusable workshop template and repeatable rollout.

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [ ] M001: Launch-Ready Workshop Ops Core — Prove a real registration → payment → confirmed-seat flow with deterministic capacity and no ambiguous confirmations.
- [ ] M002: Communication Automation & Operator Controls — Automate participant messaging from real workflow state with delivery/failure visibility and safe retries.
- [ ] M003: Reusable Workshop Template & Multi-Run Enablement — Package the proven workflow into a repeatable configuration-driven launch process for future workshops.
