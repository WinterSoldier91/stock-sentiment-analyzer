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
| D007 | M001 | scope | Planning horizon | Expand from single milestone bootstrap to full multi-milestone plan now | User explicitly requested doing all milestones in current planning pass | Yes — if priorities change |
| D008 | M001 | arch | Milestone dependency chain | M001 establishes correctness, M002 adds automation controls, M003 adds reusable rollout | Preserves invariant-first sequencing and avoids scaling unstable foundations | No |
| D009 | M001 | convention | Context dependency encoding | Add `depends_on` frontmatter to downstream milestone contexts | Auto-mode execution order depends on this field for sequencing safety | No |
| D010 | M001/S01 | pattern | Canonical script source ownership | Maintain executable Apps Script in `apps-script/Code.gs` and treat markdown snippets as reference only | Prevents drift between docs and runnable automation source | Yes — if deployment model changes |
| D011 | M001/S01 | verification | Slice-level proof strategy | Use dual local gates (`verify-s01-sheet-contract` + `verify-s01-seat-engine`) for S01 contract proof; reserve live proof for S04 | Enables deterministic verification now without falsely claiming full runtime integration | No |
| D012 | M001/S02 | security | Webhook secret storage | Store Razorpay webhook secret in Script Properties as `RAZORPAY_WEBHOOK_SECRET` | Keeps secret out of source and supports environment-specific rotation | No |
| D013 | M001/S02 | pattern | Ambiguity handling in payment reconciliation | Route non-decisive matches to `REVIEW_REQUIRED` + `Webhook Review` log instead of auto-picking a row | Protects confirmation trust boundary and makes manual resolution explicit | No |
| D014 | M001/S02 | operability | Duplicate webhook handling | Compute deterministic idempotency key from normalized event identity fields and persist in Script Properties | Prevents replay-driven double mutation while keeping decision trail inspectable | Yes — if storage strategy needs pruning/TTL |
| D015 | M001/S03 | pattern | Exception visibility surface | Add reconciliation queue metrics and recent review rows directly to Dashboard | Operators need triage at a glance, not raw-sheet inspection | Yes — if a dedicated UI replaces sheet dashboard |
| D016 | M001/S03 | convention | Manual review resolution guardrails | Allow manual confirm only for `REVIEW_REQUIRED` rows with `PAID` status and assigned non-waitlist seat | Preserves confirmation invariant even during manual intervention | No |
