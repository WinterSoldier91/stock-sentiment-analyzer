# 💰 Razorpay Setup — Step by Step

---

## Step 1: Create Razorpay Account

1. Go to [razorpay.com](https://razorpay.com)
2. Sign up with your business email
3. Complete KYC (PAN, Bank Account, Business Proof)
4. **Timeline:** Activation takes 1–2 business days

> [!TIP]
> You can use **Test Mode** immediately while KYC is pending. Toggle **Test / Live** in the dashboard.

---

## Step 2: Create Payment Links

### Link 1 — ₹1,200 (Standard)

1. Login → **Payment Links** (left sidebar)
2. Click **+ Create Payment Link**
3. Fill:
   - **Amount:** ₹1,200
   - **Title:** PCE Drone Workshop — Standard
   - **Description:** Drone workshop registration fee (includes kit + certificate)
   - **Accept Partial:** ❌ No
   - **Expiry:** Leave blank (or set 7 days if you want urgency)
4. Click **Create Link**
5. Copy the link → paste into `CONFIG.PAYMENT_LINK_1200` in Apps Script

### Link 2 — ₹2,500 (Premium, if applicable)

Same steps, amount = ₹2,500.

> [!IMPORTANT]
> Keep these links **reusable** (not one-time). Multiple students will use the same link. Razorpay tracks each payment separately.

---

## Step 3: Customize Payment Page

1. Go to **Settings → Payment Pages**
2. Upload your logo
3. Set brand color
4. This makes the payment page look professional and builds trust

---

## Step 4: Webhook Setup (Required for payment reconciliation)

### 4a. Deploy Apps Script as Web App

1. In Google Apps Script editor, click **Deploy → New deployment**
2. Select type: **Web app**
3. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Copy the Web App URL (`https://script.google.com/macros/s/xxxx/exec`)

### 4b. Add Webhook in Razorpay

1. Go to **Settings → Webhooks**
2. Click **+ Add New Webhook**
3. **Webhook URL:** Paste your Web App URL
4. **Secret:** Create a strong random secret (required)
5. **Active Events:** select ✅ `payment_link.paid`
6. Click **Create Webhook**

### 4c. Save webhook secret in Apps Script (required)

In Apps Script editor:

1. Open **Project Settings**
2. Under **Script properties**, add:
   - Key: `RAZORPAY_WEBHOOK_SECRET`
   - Value: (same secret you set in Razorpay webhook)

> [!IMPORTANT]
> S02 signature verification reads `RAZORPAY_WEBHOOK_SECRET` from Script Properties. If missing or incorrect, webhook requests are rejected.

### 4d. Signature verification behavior

- Verification uses HMAC-SHA256 over the **raw request body**.
- If signature mismatches, event is rejected and no payment state mutation occurs.
- Do not parse/mutate body before verification.

### 4e. Test It (Test Mode)

1. Switch Razorpay to **Test Mode**
2. Open your payment link
3. Use test card: `4111 1111 1111 1111`, any future expiry, any CVV
4. Complete payment
5. Check Apps Script logs and sheet state transitions for webhook decision output

---

## Step 5: Go Live Checklist

- [ ] KYC approved and account activated
- [ ] Switch from Test Mode → **Live Mode**
- [ ] Create Live payment links (test links won't work in production)
- [ ] Update Apps Script `CONFIG` with Live payment link URLs
- [ ] Update webhook URL if redeployed
- [ ] Set live `RAZORPAY_WEBHOOK_SECRET` in Script Properties
- [ ] Test with a real ₹1 payment (temporary link)
- [ ] Delete the test ₹1 link after verification

---

## Fees

| Mode | Razorpay Fee |
|------|-------------|
| UPI | 0% (currently free) |
| Cards | ~2% + GST |
| Net Banking | ~2% + GST |

> [!TIP]
> Encourage students to pay via **UPI** to reduce transaction fees.
