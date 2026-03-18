# 🚀 Setup Playbook — Launch in 1 Hour

Follow these steps in order. Total time: ~60 minutes.

---

## Phase 1: Google Form (15 min)

1. Create form → copy questions from `04_form_copy.md`
2. Link to new Google Sheet (name: `PCE Drone Workshop — Registrations`)
3. **Rename** the sheet tab from `Form Responses 1` → `Form Responses`

---

## Phase 2: Google Sheet (10 min)

1. Add headers in columns H–L as per `02_sheet_template.md`
2. Apply conditional formatting (green/yellow/red)
3. Add data validation dropdowns for Payment Status and Status columns

---

## Phase 3: Razorpay (15 min)

1. Create account + payment links → `03_razorpay_setup.md`
2. Copy your payment link URLs

---

## Phase 4: Apps Script (15 min)

1. Sheet → **Extensions → Apps Script**
2. Delete default code, paste canonical source from `apps-script/Code.gs`
3. Update `CONFIG` section:
   - Paste your Razorpay payment link URLs
   - Update sender name and workshop details
4. Set Script Property `RAZORPAY_WEBHOOK_SECRET` (Project Settings)
5. Run `setupTrigger()` → authorize permissions
6. Test: fill form → check sheet auto-populates columns H–L

---

## Phase 5: Webhook Wiring (5 min)

1. Deploy script as Web App
2. Add webhook URL in Razorpay dashboard
3. Ensure webhook secret matches `RAZORPAY_WEBHOOK_SECRET` in Script Properties
4. Test with Razorpay test-mode payment

---

## Phase 5.5: Local Verification Gates (3 min)

Run from repo root before go-live:

```bash
bash scripts/preflight-m001.sh
```

Expected result:
- script exits 0
- output ends with `✅ M001 preflight passed ...`

If preflight fails, **do not launch**. Fix contract/invariant mismatch first.

---

## Phase 6: Operator Review Workflow Check (3 min)

1. Open **Dashboard** sheet and confirm reconciliation queue block appears.
2. Confirm `Webhook Review` sheet exists and logs non-decisive outcomes.
3. In menu `🚀 Workshop Tools`, verify review actions exist:
   - `Resolve Review → Confirm`
   - `Resolve Review → Keep Pending`
   - `Resolve Review → Cancel`
4. Resolve one test `REVIEW_REQUIRED` row and confirm audit note is appended in `Notes`.

---

## 📱 WhatsApp Message Templates

### After Registration (send manually or via API):
```
🎯 Hi [NAME]!

You're assigned to *[BATCH]* for the PCE Drone Workshop! 🚁

💰 Complete payment to lock your seat:
👉 [PAYMENT_LINK]

⚡ Only [X] seats left — don't miss out!
```

### After Payment Confirmed:
```
✅ *Seat Confirmed!*

Hey [NAME], your booking is locked in! 🎉

📋 Details:
🪑 Batch: [BATCH]
📅 Date: [DATE]
⏰ Time: [TIME]
📍 Location: [VENUE]

What to bring:
• Laptop (optional)
• Enthusiasm 🔥

See you there! 🚀
```

### Urgency Message (when <5 seats):
```
🔥 *Almost Full!*

Only [X] seats left in [BATCH]!

If you've registered but not paid yet — now is the time.

👉 Pay here: [PAYMENT_LINK]

Once full, you'll be moved to the next batch.
```

---

## ✅ Launch Day Checklist

- [ ] Form tested with 2–3 dummy entries
- [ ] Apps Script trigger fires correctly
- [ ] Batch auto-assignment works
- [ ] S01/S02/S03 local verification gates pass
- [ ] Dashboard shows reconciliation queue and review metrics
- [ ] Razorpay webhook reaches script and logs decisions
- [ ] Review actions in menu work with audit notes
- [ ] WhatsApp message templates saved in Notes
- [ ] Poster/social media posts ready with form link
- [ ] Delete test entries from sheet before going live

---

> **Go live.** Share the form link. Watch the seats fill. 🚀
