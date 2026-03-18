# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? |
|---|------|-------|----------|--------|-----------|------------|
| D001 | M001 | scope | Product shape for first milestone | One smooth workshop ops flow for a single upcoming launch, organizer-first | Immediate launch pressure and operational reliability are primary | Yes — if post-launch scope expands |
| D002 | M001 | convention | Confirmation invariant | No ambiguous confirmations; only clear seat + payment evidence can become `CONFIRMED` | Prevents operational trust failures and wrong participant commitments | No |
| D003 | M001 | integration | External boundary for M001 | Integrate Google Form + Sheet + Apps Script + Razorpay; keep WhatsApp manual | Focuses risk retirement on core payment certainty path | Yes — after M001 stability |
| D004 | M001 | pattern | Capacity behavior when preferred batch is full | Auto-shift to next available batch; waitlist only when all batches are full | Preserves conversion while keeping deterministic seat caps | Yes — if policy changes |
| D005 | M001 | verification | Milestone completion proof level | Require a real integrated submit→pay→confirm run, not docs-only proof | Live launch confidence requires real runtime evidence | No |
| D006 | M001 | scope | Early risk retirement order | Prioritize payment reconciliation risk before polish/automation expansion | Highest failure impact sits in payment-to-confirmation correctness | Yes — once risk is retired |
