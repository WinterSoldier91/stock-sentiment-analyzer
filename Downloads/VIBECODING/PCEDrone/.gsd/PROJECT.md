# Project

## What This Is

PCEDrone is an organizer-first workshop registration operations system for an upcoming live workshop. It uses Google Form, linked Google Sheet, Google Apps Script automation, and Razorpay payment links/webhooks to manage registrations, seat assignment, payment tracking, and confirmation state.

## Core Value

No ambiguous confirmations: a participant should be marked confirmed only when seat assignment and payment evidence are both clear.

## Current State

The project currently has implementation drafts and launch playbooks in markdown (`01_apps_script_code.md` through `05_setup_playbook.md`). The flow is documented, but milestone-level planning and capability contract were not yet formalized before this bootstrap.

## Architecture / Key Patterns

- Google Form feeds a linked Google Sheet (`Form Responses`) as the operational source of truth.
- Additional response columns (H–L) hold system state: assigned batch, payment status, payment link, workflow status, and notes.
- Apps Script handles automation:
  - `onFormSubmit` for intake processing, seat assignment, and payment-link dispatch.
  - `refreshDashboard_` for live seat and confirmation visibility.
  - `doPost` (webhook) for payment-event driven reconciliation and confirmation.
- Razorpay is the payment rail; webhook events drive payment certainty.
- WhatsApp remains manual in M001 to keep launch risk focused on core transaction correctness.

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [ ] M001: Launch-Ready Workshop Ops Core — Prove a real registration → payment → confirmed-seat flow with deterministic capacity and no ambiguous confirmations.
