// ============================================================
// PCEDrone Workshop Ops — Canonical Apps Script Source
// Milestone: M001 / Slice: S01
// ============================================================

const CONFIG = {
  // Sheet names
  RESPONSES_SHEET: 'Form Responses',
  DASHBOARD_SHEET: 'Dashboard',

  // Column indices in Form Responses (1-based)
  COL: {
    TIMESTAMP: 1,
    NAME: 2,
    PHONE: 3,
    COLLEGE: 4,
    BATCH_PREF: 5,
    AGREEMENT: 6,
    REFERRAL: 7,
    // Auto-filled columns
    BATCH_ASSIGNED: 8,
    PAYMENT_STATUS: 9,
    PAYMENT_LINK: 10,
    STATUS: 11,
    NOTES: 12,
  },

  // Batch settings
  MAX_PER_BATCH: 20,
  TOTAL_BATCHES: 3,

  // Razorpay payment links
  PAYMENT_LINK_1200: 'https://rzp.io/l/YOUR_1200_LINK',
  PAYMENT_LINK_2500: 'https://rzp.io/l/YOUR_2500_LINK',
  DEFAULT_PAYMENT_LINK: 'https://rzp.io/l/YOUR_1200_LINK',

  // Email sender
  SENDER_NAME: 'PCE Drone Workshop',

  // Alerting
  URGENCY_THRESHOLD: 5,

  // Local observability
  MAX_NOTE_LENGTH: 500,
};

const STATUS = {
  REGISTERED: 'REGISTERED',
  WAITLISTED: 'WAITLISTED',
  CONFIRMED: 'CONFIRMED',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
  CANCELLED: 'CANCELLED',
  ERROR: 'ERROR',
};

const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
};

const REQUIRED_STATE_HEADERS = {
  8: 'Batch Assigned',
  9: 'Payment Status',
  10: 'Payment Link',
  11: 'Status',
  12: 'Notes',
};

const NOTE_CODES = {
  WAITLISTED_NO_PAYMENT_LINK: 'WAITLISTED_NO_PAYMENT_LINK',
  MANUAL_FOLLOWUP_REQUIRED: 'MANUAL_FOLLOWUP_REQUIRED',
  PAYMENT_LINK_EMAIL_SENT: 'PAYMENT_LINK_EMAIL_SENT',
  CONFIG_ERROR: 'CONFIG_ERROR',
  WEBHOOK_REJECTED_SIGNATURE: 'WEBHOOK_REJECTED_SIGNATURE',
  WEBHOOK_REVIEW_REQUIRED: 'WEBHOOK_REVIEW_REQUIRED',
  WEBHOOK_UNMATCHED: 'WEBHOOK_UNMATCHED',
  WEBHOOK_MATCHED: 'WEBHOOK_MATCHED',
  WEBHOOK_DUPLICATE_IGNORED: 'WEBHOOK_DUPLICATE_IGNORED',
  OPERATOR_REVIEW_RESOLVED: 'OPERATOR_REVIEW_RESOLVED',
  OPERATOR_INVALID_ACTION: 'OPERATOR_INVALID_ACTION',
};

const WEBHOOK = {
  SECRET_PROPERTY_KEY: 'RAZORPAY_WEBHOOK_SECRET',
  IDEMPOTENCY_PROPERTY_PREFIX: 'RAZORPAY_EVT_',
  REVIEW_SHEET_NAME: 'Webhook Review',
  SIGNATURE_PARAM_KEYS: [
    'x_razorpay_signature',
    'x-razorpay-signature',
    'razorpay_signature',
  ],
};

const RECONCILIATION_DECISION = {
  MATCHED: 'MATCHED',
  AMBIGUOUS: 'AMBIGUOUS',
  UNMATCHED: 'UNMATCHED',
  REPLAY: 'REPLAY',
  REJECTED: 'REJECTED',
};

// ============================================================
// 🚀 MAIN TRIGGER — Runs on every form submission
// ============================================================

function onFormSubmit(e) {
  let sheet = null;
  let row = null;

  try {
    sheet = getResponsesSheet_();
    row = getSubmittedRow_(sheet, e);

    assertResponsesSchema_(sheet);

    const registration = buildRegistrationContext_(sheet, row, e);
    const batchAssigned = assignBatch_(sheet, row);

    setInitialState_(sheet, row, batchAssigned);

    const paymentLink = pickPaymentLink_(registration);
    sheet.getRange(row, CONFIG.COL.PAYMENT_LINK).setValue(paymentLink);

    sendPaymentLink_(sheet, row, registration, batchAssigned, paymentLink);
    checkUrgency_(batchAssigned);
    refreshDashboard_();

    Logger.log(
      JSON.stringify({
        event: 'intake_processed',
        row,
        batchAssigned,
        phoneMasked: maskPhone_(registration.phoneNormalized),
      })
    );
  } catch (err) {
    recordIntakeFailure_(sheet, row, err);
    throw err;
  }
}

// ============================================================
// 🎯 BATCH ASSIGNMENT — deterministic seat control
// ============================================================

function assignBatch_(sheet, currentRow) {
  const existingCount = Math.max(currentRow - 2, 0);
  const batchColumn = CONFIG.COL.BATCH_ASSIGNED;

  const existingBatches =
    existingCount > 0
      ? sheet
          .getRange(2, batchColumn, existingCount, 1)
          .getValues()
          .flat()
          .map(normalizeText_)
          .filter(Boolean)
      : [];

  for (let i = 1; i <= CONFIG.TOTAL_BATCHES; i += 1) {
    const batchName = `Batch ${i}`;
    const count = existingBatches.filter((b) => b === batchName).length;

    if (count < CONFIG.MAX_PER_BATCH) {
      sheet.getRange(currentRow, batchColumn).setValue(batchName);
      Logger.log(
        JSON.stringify({
          event: 'batch_assigned',
          row: currentRow,
          batch: batchName,
          countAfterAssign: count + 1,
          cap: CONFIG.MAX_PER_BATCH,
        })
      );
      return batchName;
    }
  }

  sheet.getRange(currentRow, batchColumn).setValue('Waitlist');
  Logger.log(
    JSON.stringify({
      event: 'waitlist_routed',
      row: currentRow,
      reason: 'all_batches_full',
    })
  );
  return 'Waitlist';
}

function setInitialState_(sheet, row, batchAssigned) {
  sheet.getRange(row, CONFIG.COL.PAYMENT_STATUS).setValue(PAYMENT_STATUS.PENDING);

  if (batchAssigned === 'Waitlist') {
    sheet.getRange(row, CONFIG.COL.STATUS).setValue(STATUS.WAITLISTED);
    appendNote_(sheet, row, NOTE_CODES.WAITLISTED_NO_PAYMENT_LINK);
    return;
  }

  sheet.getRange(row, CONFIG.COL.STATUS).setValue(STATUS.REGISTERED);
}

// ============================================================
// 💰 PAYMENT LINK — send by email if available
// ============================================================

function sendPaymentLink_(sheet, row, registration, batchAssigned, paymentLink) {
  if (batchAssigned === 'Waitlist') {
    sheet.getRange(row, CONFIG.COL.PAYMENT_LINK).setValue('');
    appendNote_(sheet, row, NOTE_CODES.WAITLISTED_NO_PAYMENT_LINK);
    return;
  }

  const email = registration.email;
  if (isValidEmail_(email)) {
    const subject = '🎯 PCE Drone Workshop — Seat Assigned!';
    const body = [
      `Hi ${registration.name || 'there'}! 👋`,
      '',
      `Great news — you've been assigned to ${batchAssigned}.`,
      '🪑 Your seat is reserved for 24 hours.',
      `💰 Complete payment to confirm: ${paymentLink}`,
      '',
      'Workshop Details:',
      '📍 Location: [YOUR VENUE]',
      '📅 Date: [YOUR DATE]',
      '⏰ Time: [YOUR TIME]',
      '',
      '⚡ Seats are filling fast — lock yours now!',
      '',
      '— PCE Drone Workshop Team',
    ].join('\n');

    MailApp.sendEmail({
      to: email,
      subject,
      body,
      name: CONFIG.SENDER_NAME,
    });

    appendNote_(sheet, row, NOTE_CODES.PAYMENT_LINK_EMAIL_SENT);
    return;
  }

  appendNote_(
    sheet,
    row,
    `${NOTE_CODES.MANUAL_FOLLOWUP_REQUIRED}: send payment link to ${registration.phoneRaw || 'unknown phone'}`
  );
}

// ============================================================
// ✅ Manual payment helpers (S01 baseline)
// ============================================================

function confirmPayment(row) {
  const sheet = getResponsesSheet_();
  assertResponsesSchema_(sheet);

  sheet.getRange(row, CONFIG.COL.PAYMENT_STATUS).setValue(PAYMENT_STATUS.PAID);
  sheet.getRange(row, CONFIG.COL.STATUS).setValue(STATUS.CONFIRMED);

  const name = normalizeText_(sheet.getRange(row, CONFIG.COL.NAME).getValue());
  const batch = normalizeText_(sheet.getRange(row, CONFIG.COL.BATCH_ASSIGNED).getValue());

  Logger.log(
    JSON.stringify({
      event: 'manual_payment_confirmed',
      row,
      name,
      batch,
    })
  );

  refreshDashboard_();
}

function bulkConfirm() {
  const sheet = getResponsesSheet_();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i += 1) {
    const payStatus = normalizeText_(data[i][CONFIG.COL.PAYMENT_STATUS - 1]);
    const status = normalizeText_(data[i][CONFIG.COL.STATUS - 1]);

    if (payStatus === PAYMENT_STATUS.PAID && status !== STATUS.CONFIRMED) {
      sheet.getRange(i + 1, CONFIG.COL.STATUS).setValue(STATUS.CONFIRMED);
    }
  }

  refreshDashboard_();
  Logger.log(JSON.stringify({ event: 'bulk_confirm_complete' }));
}

// ============================================================
// ⚡ URGENCY NOTIFICATIONS
// ============================================================

function checkUrgency_(batchName) {
  if (batchName === 'Waitlist') return;

  const sheet = getResponsesSheet_();
  const rowCount = Math.max(sheet.getLastRow() - 1, 0);
  if (rowCount === 0) return;

  const allBatches = sheet
    .getRange(2, CONFIG.COL.BATCH_ASSIGNED, rowCount, 1)
    .getValues()
    .flat()
    .map(normalizeText_)
    .filter(Boolean);

  const count = allBatches.filter((b) => b === batchName).length;
  const remaining = CONFIG.MAX_PER_BATCH - count;

  if (remaining <= CONFIG.URGENCY_THRESHOLD && remaining > 0) {
    Logger.log(
      JSON.stringify({
        event: 'urgency_threshold_reached',
        batchName,
        seatsRemaining: remaining,
      })
    );

    MailApp.sendEmail({
      to: Session.getActiveUser().getEmail(),
      subject: `🔥 ${batchName}: Only ${remaining} seats left!`,
      body: `${batchName} has only ${remaining} seats remaining. Consider sending urgency messages to prospects.`,
      name: CONFIG.SENDER_NAME,
    });
  }
}

// ============================================================
// 📊 DASHBOARD — live seat tracking
// ============================================================

function refreshDashboard_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responses = getResponsesSheet_();
  let dashboard = ss.getSheetByName(CONFIG.DASHBOARD_SHEET);

  if (!dashboard) {
    dashboard = ss.insertSheet(CONFIG.DASHBOARD_SHEET);
  }

  const rowCount = Math.max(responses.getLastRow() - 1, 0);

  const allBatches =
    rowCount > 0
      ? responses
          .getRange(2, CONFIG.COL.BATCH_ASSIGNED, rowCount, 1)
          .getValues()
          .flat()
          .map(normalizeText_)
      : [];

  const allPayments =
    rowCount > 0
      ? responses
          .getRange(2, CONFIG.COL.PAYMENT_STATUS, rowCount, 1)
          .getValues()
          .flat()
          .map(normalizeText_)
      : [];

  const allStatuses =
    rowCount > 0
      ? responses
          .getRange(2, CONFIG.COL.STATUS, rowCount, 1)
          .getValues()
          .flat()
          .map(normalizeText_)
      : [];

  const decisionCounts = getWebhookDecisionCounts_();
  const recentReviews = getRecentWebhookReviewRows_(5);

  const dashData = [
    ['📊 LIVE DASHBOARD', '', '', ''],
    ['', '', '', ''],
    ['Batch', 'Registered', 'Confirmed (Paid)', 'Seats Left'],
  ];

  for (let i = 1; i <= CONFIG.TOTAL_BATCHES; i += 1) {
    const batchName = `Batch ${i}`;
    const registered = allBatches.filter((b) => b === batchName).length;
    const confirmed = allBatches.filter(
      (b, idx) => b === batchName && allPayments[idx] === PAYMENT_STATUS.PAID
    ).length;
    const seatsLeft = CONFIG.MAX_PER_BATCH - registered;

    dashData.push([
      batchName,
      registered,
      confirmed,
      seatsLeft > 0 ? seatsLeft : '🔴 FULL',
    ]);
  }

  const waitlisted = allBatches.filter((b) => b === 'Waitlist').length;
  const reviewRequired = allStatuses.filter((s) => s === STATUS.REVIEW_REQUIRED).length;

  dashData.push(['Waitlist', waitlisted, '—', '—']);
  dashData.push(['', '', '', '']);
  dashData.push(['Total Registrations', allBatches.filter(Boolean).length, '', '']);
  dashData.push([
    'Total Confirmed',
    allPayments.filter((p) => p === PAYMENT_STATUS.PAID).length,
    '',
    '',
  ]);

  dashData.push(['', '', '', '']);
  dashData.push(['🔎 Reconciliation Queue', 'Count', '', '']);
  dashData.push(['Review Required Rows', reviewRequired, '', '']);
  dashData.push(['Webhook Ambiguous', decisionCounts.AMBIGUOUS || 0, '', '']);
  dashData.push(['Webhook Unmatched', decisionCounts.UNMATCHED || 0, '', '']);
  dashData.push(['Webhook Replay', decisionCounts.REPLAY || 0, '', '']);
  dashData.push(['Webhook Rejected', decisionCounts.REJECTED || 0, '', '']);

  dashData.push(['', '', '', '']);
  dashData.push(['🧾 Recent Webhook Reviews', 'Decision', 'Reason', 'Contact']);

  if (recentReviews.length === 0) {
    dashData.push(['No review events yet', '—', '—', '—']);
  } else {
    recentReviews.forEach((review) => dashData.push(review));
  }

  dashboard.clearContents();
  dashboard.getRange(1, 1, dashData.length, 4).setValues(dashData);

  dashboard.getRange(1, 1).setFontSize(16).setFontWeight('bold');
  dashboard
    .getRange(3, 1, 1, 4)
    .setFontWeight('bold')
    .setBackground('#e8f0fe');

  const queueHeaderRow = dashData.findIndex((row) => row[0] === '🔎 Reconciliation Queue') + 1;
  if (queueHeaderRow > 0) {
    dashboard
      .getRange(queueHeaderRow, 1, 1, 4)
      .setFontWeight('bold')
      .setBackground('#fff3cd');
  }

  const reviewHeaderRow = dashData.findIndex((row) => row[0] === '🧾 Recent Webhook Reviews') + 1;
  if (reviewHeaderRow > 0) {
    dashboard
      .getRange(reviewHeaderRow, 1, 1, 4)
      .setFontWeight('bold')
      .setBackground('#f1f3f4');
  }

  dashboard.setColumnWidth(1, 220);
  dashboard.setColumnWidth(2, 150);
  dashboard.setColumnWidth(3, 220);
  dashboard.setColumnWidth(4, 180);
}

// ============================================================
// 🔧 Setup & menu
// ============================================================

function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach((trigger) => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();

  Logger.log(JSON.stringify({ event: 'trigger_created', trigger: 'onFormSubmit' }));
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 Workshop Tools')
    .addItem('📊 Refresh Dashboard', 'refreshDashboard_')
    .addItem('✅ Bulk Confirm Payments', 'bulkConfirm')
    .addItem('⚙️ Setup Trigger', 'setupTrigger')
    .addSeparator()
    .addItem('🧪 Test with Last Row', 'testLastRow')
    .addSeparator()
    .addItem('🛠 Resolve Review → Confirm', 'resolveReviewRowToConfirmed')
    .addItem('🕒 Resolve Review → Keep Pending', 'resolveReviewRowToPending')
    .addItem('🛑 Resolve Review → Cancel', 'resolveReviewRowToCancelled')
    .addToUi();
}

function testLastRow() {
  onFormSubmit(null);
  SpreadsheetApp.getUi().alert('✅ Test complete — check the last row.');
}

function resolveReviewRowToConfirmed() {
  resolveReviewRowByPrompt_('confirm');
}

function resolveReviewRowToPending() {
  resolveReviewRowByPrompt_('pending');
}

function resolveReviewRowToCancelled() {
  resolveReviewRowByPrompt_('cancel');
}

function resolveReviewRowByPrompt_(action) {
  const ui = SpreadsheetApp.getUi();

  const rowPrompt = ui.prompt(
    'Resolve Review Row',
    'Enter the row number from Form Responses to resolve:',
    ui.ButtonSet.OK_CANCEL
  );

  if (rowPrompt.getSelectedButton() !== ui.Button.OK) return;

  const row = Number(normalizeText_(rowPrompt.getResponseText()));
  if (!Number.isInteger(row) || row < 2) {
    ui.alert('Invalid row number.');
    return;
  }

  const notePrompt = ui.prompt(
    'Resolution Note',
    'Add a short operator note (optional):',
    ui.ButtonSet.OK_CANCEL
  );

  if (notePrompt.getSelectedButton() !== ui.Button.OK) return;

  const operatorNote = normalizeText_(notePrompt.getResponseText());

  try {
    const result = applyReviewResolution_(row, action, operatorNote);
    refreshDashboard_();
    ui.alert(`✅ ${result}`);
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    ui.alert(`❌ ${message}`);
  }
}

function applyReviewResolution_(row, action, operatorNote) {
  const sheet = getResponsesSheet_();
  assertResponsesSchema_(sheet);

  const status = normalizeText_(sheet.getRange(row, CONFIG.COL.STATUS).getValue());
  const paymentStatus = normalizeText_(sheet.getRange(row, CONFIG.COL.PAYMENT_STATUS).getValue());
  const batchAssigned = normalizeText_(sheet.getRange(row, CONFIG.COL.BATCH_ASSIGNED).getValue());

  if (status !== STATUS.REVIEW_REQUIRED) {
    throw new Error(`Row ${row} is not REVIEW_REQUIRED (current: ${status || 'empty'})`);
  }

  if (action === 'confirm') {
    if (paymentStatus !== PAYMENT_STATUS.PAID) {
      appendNote_(sheet, row, `${NOTE_CODES.OPERATOR_INVALID_ACTION}: confirm_without_paid_status`);
      throw new Error(`Cannot confirm row ${row}: payment status is ${paymentStatus || 'empty'}`);
    }

    if (!batchAssigned || batchAssigned === 'Waitlist') {
      appendNote_(sheet, row, `${NOTE_CODES.OPERATOR_INVALID_ACTION}: confirm_without_assigned_seat`);
      throw new Error(`Cannot confirm row ${row}: batch assignment is ${batchAssigned || 'empty'}`);
    }

    sheet.getRange(row, CONFIG.COL.STATUS).setValue(STATUS.CONFIRMED);
  } else if (action === 'pending') {
    sheet.getRange(row, CONFIG.COL.STATUS).setValue(STATUS.REGISTERED);
  } else if (action === 'cancel') {
    sheet.getRange(row, CONFIG.COL.STATUS).setValue(STATUS.CANCELLED);
  } else {
    throw new Error(`Unsupported action: ${action}`);
  }

  const audit = `${NOTE_CODES.OPERATOR_REVIEW_RESOLVED}: ${action}${
    operatorNote ? ` (${operatorNote})` : ''
  }`;
  appendNote_(sheet, row, audit);

  Logger.log(
    JSON.stringify({
      event: 'review_resolution_applied',
      row,
      action,
      operatorNote,
    })
  );

  return `Row ${row} resolved as ${action.toUpperCase()}`;
}

// ============================================================
// 🌐 Razorpay webhook intake (S02 scaffolding)
// ============================================================

function doPost(e) {
  try {
    const rawBody = getRawBody_(e);
    const payload = JSON.parse(rawBody);
    const webhookEvent = parseWebhookEvent_(payload);

    const providedSignature = getWebhookSignature_(e, payload);
    const webhookSecret = getWebhookSecret_();

    if (!verifyWebhookSignature_(rawBody, providedSignature, webhookSecret)) {
      const rejectedDecision = {
        decision: RECONCILIATION_DECISION.REJECTED,
        reason: 'signature_mismatch',
      };

      appendWebhookReview_(rejectedDecision, webhookEvent);

      Logger.log(
        JSON.stringify({
          event: 'webhook_rejected',
          reason: rejectedDecision.reason,
          eventName: webhookEvent.eventName,
          paymentLinkId: webhookEvent.paymentLinkId || '',
        })
      );

      return jsonResponse_(403, {
        status: 'rejected',
        decision: rejectedDecision.decision,
        reason: rejectedDecision.reason,
      });
    }

    const idempotencyKey = buildWebhookIdempotencyKey_(webhookEvent);
    if (isWebhookReplay_(idempotencyKey)) {
      const replayDecision = {
        decision: RECONCILIATION_DECISION.REPLAY,
        reason: 'duplicate_event',
        idempotencyKey,
        candidateRows: [],
      };

      appendWebhookReview_(replayDecision, webhookEvent);

      Logger.log(
        JSON.stringify({
          event: 'webhook_replay_ignored',
          idempotencyKey,
          eventName: webhookEvent.eventName,
          paymentLinkId: webhookEvent.paymentLinkId || '',
        })
      );

      return jsonResponse_(200, {
        status: 'accepted',
        decision: replayDecision.decision,
        reason: replayDecision.reason,
      });
    }

    const sheet = getResponsesSheet_();
    assertResponsesSchema_(sheet);

    const scaffoldDecision = buildWebhookDecisionScaffold_(webhookEvent);
    const finalDecision =
      scaffoldDecision.decision === RECONCILIATION_DECISION.UNMATCHED &&
      scaffoldDecision.reason === 'ready_for_row_reconciliation'
        ? reconcileWebhookEvent_(sheet, webhookEvent)
        : scaffoldDecision;

    finalDecision.idempotencyKey = idempotencyKey;

    applyReconciliationDecision_(sheet, finalDecision, webhookEvent);
    markWebhookProcessed_(idempotencyKey);

    if (finalDecision.decision === RECONCILIATION_DECISION.MATCHED) {
      refreshDashboard_();
    }

    Logger.log(
      JSON.stringify({
        event: 'webhook_processed',
        decision: finalDecision.decision,
        reason: finalDecision.reason,
        row: finalDecision.row || null,
        candidates: finalDecision.candidateRows || [],
        eventName: webhookEvent.eventName,
        paymentLinkId: webhookEvent.paymentLinkId || '',
        idempotencyKey,
      })
    );

    return jsonResponse_(200, {
      status: 'accepted',
      decision: finalDecision.decision,
      reason: finalDecision.reason,
      row: finalDecision.row || null,
      candidates: finalDecision.candidateRows || [],
    });
  } catch (err) {
    const shortMessage = String(err && err.message ? err.message : err).slice(0, 200);

    Logger.log(
      JSON.stringify({
        event: 'webhook_failed',
        reason: shortMessage,
      })
    );

    return jsonResponse_(400, {
      status: 'error',
      decision: RECONCILIATION_DECISION.REJECTED,
      reason: shortMessage,
    });
  }
}

// ============================================================
// Helpers
// ============================================================

function getResponsesSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.RESPONSES_SHEET);
  if (!sheet) {
    throw new Error(`Missing sheet: ${CONFIG.RESPONSES_SHEET}`);
  }
  return sheet;
}

function getSubmittedRow_(sheet, e) {
  if (e && e.range && e.range.getRow) {
    const row = e.range.getRow();
    if (row >= 2) return row;
  }

  const row = sheet.getLastRow();
  if (row < 2) {
    throw new Error('No submission row available in responses sheet.');
  }
  return row;
}

function assertResponsesSchema_(sheet) {
  const headerRow = sheet.getRange(1, 1, 1, CONFIG.COL.NOTES).getValues()[0];

  Object.keys(REQUIRED_STATE_HEADERS).forEach((colKey) => {
    const col = Number(colKey);
    const expected = REQUIRED_STATE_HEADERS[col];
    const actual = normalizeText_(headerRow[col - 1]);

    if (actual !== expected) {
      throw new Error(
        `Schema mismatch at column ${col}: expected "${expected}", found "${actual || '(empty)'}"`
      );
    }
  });
}

function buildRegistrationContext_(sheet, row, e) {
  const name = normalizeText_(sheet.getRange(row, CONFIG.COL.NAME).getValue());
  const phoneRaw = normalizeText_(sheet.getRange(row, CONFIG.COL.PHONE).getValue());
  const phoneNormalized = normalizePhone_(phoneRaw);
  const batchPreference = normalizeText_(
    sheet.getRange(row, CONFIG.COL.BATCH_PREF).getValue()
  );

  return {
    name,
    phoneRaw,
    phoneNormalized,
    batchPreference,
    email: resolveEmail_(e),
  };
}

function getRawBody_(e) {
  const rawBody = e && e.postData && e.postData.contents;
  if (!rawBody) {
    throw new Error('Missing webhook request body');
  }
  return rawBody;
}

function getWebhookSignature_(e, payload) {
  const params = (e && e.parameter) || {};

  for (let i = 0; i < WEBHOOK.SIGNATURE_PARAM_KEYS.length; i += 1) {
    const key = WEBHOOK.SIGNATURE_PARAM_KEYS[i];
    if (params[key]) return normalizeText_(params[key]);
  }

  // Optional fallback for test harness payloads.
  const payloadSignature = payload && payload.razorpay_signature;
  return normalizeText_(payloadSignature);
}

function getWebhookSecret_() {
  const scriptProps = PropertiesService.getScriptProperties();
  const secret = normalizeText_(scriptProps.getProperty(WEBHOOK.SECRET_PROPERTY_KEY));

  if (!secret) {
    throw new Error(
      `Missing webhook secret. Set Script Property ${WEBHOOK.SECRET_PROPERTY_KEY}.`
    );
  }

  return secret;
}

function verifyWebhookSignature_(rawBody, providedSignature, webhookSecret) {
  const signature = normalizeText_(providedSignature).toLowerCase();
  if (!signature) return false;

  const expected = computeHmacSha256Hex_(rawBody, webhookSecret).toLowerCase();
  return safeEqual_(expected, signature);
}

function computeHmacSha256Hex_(message, secret) {
  const signatureBytes = Utilities.computeHmacSha256Signature(message, secret);
  return signatureBytes
    .map((byte) => {
      const normalized = byte < 0 ? byte + 256 : byte;
      return (`0${normalized.toString(16)}`).slice(-2);
    })
    .join('');
}

function safeEqual_(left, right) {
  if (left.length !== right.length) return false;

  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }

  return mismatch === 0;
}

function buildWebhookIdempotencyKey_(webhookEvent) {
  const parts = [
    normalizeText_(webhookEvent.eventName),
    normalizeText_(webhookEvent.paymentId),
    normalizeText_(webhookEvent.paymentLinkId),
    normalizeText_(webhookEvent.paymentLinkShortUrl),
    normalizeText_(webhookEvent.customerContactNormalized),
    normalizeText_(webhookEvent.customerEmailNormalized),
    String(webhookEvent.amountRupees || 0),
  ];

  const rawKey = parts.join('|');
  const digestBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, rawKey);

  const digestHex = digestBytes
    .map((byte) => {
      const normalized = byte < 0 ? byte + 256 : byte;
      return (`0${normalized.toString(16)}`).slice(-2);
    })
    .join('');

  return `${WEBHOOK.IDEMPOTENCY_PROPERTY_PREFIX}${digestHex}`;
}

function isWebhookReplay_(idempotencyKey) {
  const scriptProps = PropertiesService.getScriptProperties();
  return Boolean(scriptProps.getProperty(idempotencyKey));
}

function markWebhookProcessed_(idempotencyKey) {
  const scriptProps = PropertiesService.getScriptProperties();
  scriptProps.setProperty(idempotencyKey, new Date().toISOString());
}

function parseWebhookEvent_(payload) {
  const eventName = normalizeText_(payload && payload.event);
  const paymentLinkEntity =
    (payload && payload.payload && payload.payload.payment_link && payload.payload.payment_link.entity) ||
    {};
  const paymentEntity =
    (payload && payload.payload && payload.payload.payment && payload.payload.payment.entity) || {};

  const customer = paymentLinkEntity.customer || paymentEntity || {};

  return {
    eventName,
    paymentLinkId: normalizeText_(paymentLinkEntity.id),
    paymentLinkShortUrl: normalizeText_(paymentLinkEntity.short_url || paymentLinkEntity.shortUrl),
    paymentId: normalizeText_(paymentEntity.id),
    customerContactRaw: normalizeText_(customer.contact),
    customerContactNormalized: normalizePhone_(customer.contact),
    customerEmailNormalized: normalizeText_(customer.email).toLowerCase(),
    amountRupees:
      Number(paymentLinkEntity.amount || paymentEntity.amount || 0) > 0
        ? Number(paymentLinkEntity.amount || paymentEntity.amount || 0) / 100
        : 0,
  };
}

function buildWebhookDecisionScaffold_(webhookEvent) {
  if (webhookEvent.eventName !== 'payment_link.paid') {
    return {
      decision: RECONCILIATION_DECISION.REJECTED,
      reason: 'unsupported_event',
    };
  }

  if (!webhookEvent.paymentLinkId && !webhookEvent.paymentLinkShortUrl) {
    return {
      decision: RECONCILIATION_DECISION.REJECTED,
      reason: 'missing_payment_link_identifier',
    };
  }

  if (!webhookEvent.customerContactNormalized && !webhookEvent.customerEmailNormalized) {
    return {
      decision: RECONCILIATION_DECISION.AMBIGUOUS,
      reason: 'missing_customer_identifiers',
      candidateRows: [],
    };
  }

  return {
    decision: RECONCILIATION_DECISION.UNMATCHED,
    reason: 'ready_for_row_reconciliation',
  };
}

function reconcileWebhookEvent_(sheet, webhookEvent) {
  const rows = getAllResponseRows_(sheet);

  const eligibleRows = rows.filter(
    (row) =>
      row.batchAssigned &&
      row.batchAssigned !== 'Waitlist' &&
      row.status !== STATUS.CONFIRMED
  );

  let candidates = [];

  if (webhookEvent.customerContactNormalized) {
    candidates = eligibleRows.filter(
      (row) => row.phoneNormalized === webhookEvent.customerContactNormalized
    );
  }

  if (candidates.length === 0 && webhookEvent.paymentLinkShortUrl) {
    candidates = eligibleRows.filter(
      (row) => normalizeText_(row.paymentLink) === webhookEvent.paymentLinkShortUrl
    );
  }

  if (candidates.length === 1) {
    return {
      decision: RECONCILIATION_DECISION.MATCHED,
      reason: 'single_candidate_match',
      row: candidates[0].row,
      candidateRows: [candidates[0].row],
    };
  }

  if (candidates.length > 1 && webhookEvent.paymentLinkShortUrl) {
    const narrowed = candidates.filter(
      (row) => normalizeText_(row.paymentLink) === webhookEvent.paymentLinkShortUrl
    );

    if (narrowed.length === 1) {
      return {
        decision: RECONCILIATION_DECISION.MATCHED,
        reason: 'narrowed_by_payment_link',
        row: narrowed[0].row,
        candidateRows: [narrowed[0].row],
      };
    }

    if (narrowed.length > 1) {
      return {
        decision: RECONCILIATION_DECISION.AMBIGUOUS,
        reason: 'multiple_rows_share_phone_and_payment_link',
        candidateRows: narrowed.map((row) => row.row),
      };
    }
  }

  if (candidates.length > 1) {
    return {
      decision: RECONCILIATION_DECISION.AMBIGUOUS,
      reason: 'multiple_rows_share_identifier',
      candidateRows: candidates.map((row) => row.row),
    };
  }

  return {
    decision: RECONCILIATION_DECISION.UNMATCHED,
    reason: 'no_matching_row',
    candidateRows: [],
  };
}

function applyReconciliationDecision_(sheet, decision, webhookEvent) {
  switch (decision.decision) {
    case RECONCILIATION_DECISION.MATCHED:
      markRowConfirmedFromWebhook_(sheet, decision.row, webhookEvent);
      appendWebhookReview_(decision, webhookEvent);
      return;

    case RECONCILIATION_DECISION.AMBIGUOUS:
      markRowsReviewRequired_(sheet, decision.candidateRows || [], decision.reason, webhookEvent);
      appendWebhookReview_(decision, webhookEvent);
      return;

    case RECONCILIATION_DECISION.UNMATCHED:
    case RECONCILIATION_DECISION.REJECTED:
    case RECONCILIATION_DECISION.REPLAY:
    default:
      appendWebhookReview_(decision, webhookEvent);
  }
}

function markRowConfirmedFromWebhook_(sheet, row, webhookEvent) {
  if (!row || row < 2) return;

  sheet.getRange(row, CONFIG.COL.PAYMENT_STATUS).setValue(PAYMENT_STATUS.PAID);
  sheet.getRange(row, CONFIG.COL.STATUS).setValue(STATUS.CONFIRMED);

  const ref = webhookEvent.paymentId || webhookEvent.paymentLinkId || 'unknown_ref';
  appendNote_(sheet, row, `${NOTE_CODES.WEBHOOK_MATCHED}: ${ref}`);
}

function markRowsReviewRequired_(sheet, rows, reason, webhookEvent) {
  if (!Array.isArray(rows) || rows.length === 0) return;

  const ref = webhookEvent.paymentId || webhookEvent.paymentLinkId || 'unknown_ref';

  rows.forEach((row) => {
    if (!row || row < 2) return;

    const currentStatus = normalizeText_(sheet.getRange(row, CONFIG.COL.STATUS).getValue());
    if (currentStatus !== STATUS.CONFIRMED) {
      sheet.getRange(row, CONFIG.COL.STATUS).setValue(STATUS.REVIEW_REQUIRED);
    }

    appendNote_(
      sheet,
      row,
      `${NOTE_CODES.WEBHOOK_REVIEW_REQUIRED}: ${reason} (${ref})`
    );
  });
}

function appendWebhookReview_(decision, webhookEvent) {
  const sheet = getOrCreateWebhookReviewSheet_();
  const candidateRows = Array.isArray(decision.candidateRows)
    ? decision.candidateRows.join(',')
    : '';

  sheet.appendRow([
    new Date(),
    decision.decision || '',
    decision.reason || '',
    webhookEvent.eventName || '',
    webhookEvent.paymentLinkId || '',
    webhookEvent.paymentLinkShortUrl || '',
    webhookEvent.paymentId || '',
    maskPhone_(webhookEvent.customerContactNormalized || webhookEvent.customerContactRaw),
    webhookEvent.customerEmailNormalized || '',
    webhookEvent.amountRupees || 0,
    decision.idempotencyKey || '',
    decision.row || '',
    candidateRows,
  ]);
}

function getOrCreateWebhookReviewSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = WEBHOOK.REVIEW_SHEET_NAME;

  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp',
      'Decision',
      'Reason',
      'Event',
      'Payment Link ID',
      'Payment Link URL',
      'Payment ID',
      'Contact (masked)',
      'Email',
      'Amount (INR)',
      'Idempotency Key',
      'Matched Row',
      'Candidate Rows',
    ]);
  }

  return sheet;
}

function getWebhookDecisionCounts_() {
  const sheet = getOrCreateWebhookReviewSheet_();
  const rowCount = Math.max(sheet.getLastRow() - 1, 0);
  if (rowCount === 0) return {};

  const values = sheet.getRange(2, 2, rowCount, 1).getValues().flat().map(normalizeText_);

  return values.reduce((acc, decision) => {
    if (!decision) return acc;
    acc[decision] = (acc[decision] || 0) + 1;
    return acc;
  }, {});
}

function getRecentWebhookReviewRows_(limit) {
  const sheet = getOrCreateWebhookReviewSheet_();
  const rowCount = Math.max(sheet.getLastRow() - 1, 0);
  if (rowCount === 0) return [];

  const safeLimit = Math.max(Number(limit || 5), 1);
  const take = Math.min(safeLimit, rowCount);
  const startRow = sheet.getLastRow() - take + 1;

  const values = sheet.getRange(startRow, 1, take, 13).getValues();

  return values
    .reverse()
    .map((row) => {
      const timestamp = row[0] instanceof Date ? row[0].toLocaleString() : normalizeText_(row[0]);
      const decision = normalizeText_(row[1]);
      const reason = normalizeText_(row[2]);
      const contact = normalizeText_(row[7]);
      return [timestamp || '—', decision || '—', reason || '—', contact || '—'];
    });
}

function getAllResponseRows_(sheet) {
  const rowCount = Math.max(sheet.getLastRow() - 1, 0);
  if (rowCount === 0) return [];

  const values = sheet.getRange(2, 1, rowCount, CONFIG.COL.NOTES).getValues();

  return values.map((rowValues, index) => ({
    row: index + 2,
    phoneNormalized: normalizePhone_(rowValues[CONFIG.COL.PHONE - 1]),
    paymentLink: normalizeText_(rowValues[CONFIG.COL.PAYMENT_LINK - 1]),
    paymentStatus: normalizeText_(rowValues[CONFIG.COL.PAYMENT_STATUS - 1]),
    status: normalizeText_(rowValues[CONFIG.COL.STATUS - 1]),
    batchAssigned: normalizeText_(rowValues[CONFIG.COL.BATCH_ASSIGNED - 1]),
  }));
}

function jsonResponse_(statusCode, payload) {
  return ContentService.createTextOutput(
    JSON.stringify({
      httpStatus: statusCode,
      ...payload,
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function resolveEmail_(e) {
  if (!e || !e.namedValues) return '';

  const keys = ['Email', 'E-mail', 'Email Address'];
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (!Object.prototype.hasOwnProperty.call(e.namedValues, key)) continue;

    const value = e.namedValues[key];
    if (Array.isArray(value)) return normalizeText_(value[0]);
    return normalizeText_(value);
  }

  return '';
}

function pickPaymentLink_(registration) {
  const pref = normalizeText_(registration.batchPreference).toLowerCase();
  if (pref.includes('premium') || pref.includes('2500')) {
    return CONFIG.PAYMENT_LINK_2500 || CONFIG.DEFAULT_PAYMENT_LINK;
  }
  return CONFIG.DEFAULT_PAYMENT_LINK;
}

function appendNote_(sheet, row, nextNote) {
  const noteText = normalizeText_(nextNote);
  if (!noteText) return;

  const cell = sheet.getRange(row, CONFIG.COL.NOTES);
  const current = normalizeText_(cell.getValue());

  const merged = current ? `${current} | ${noteText}` : noteText;
  cell.setValue(merged.slice(0, CONFIG.MAX_NOTE_LENGTH));
}

function recordIntakeFailure_(sheet, row, err) {
  const message = err && err.message ? err.message : String(err);
  const shortMessage = message.slice(0, 200);

  Logger.log(
    JSON.stringify({
      event: 'intake_failed',
      row,
      error: shortMessage,
    })
  );

  if (!sheet || !row || row < 2) return;

  try {
    sheet.getRange(row, CONFIG.COL.STATUS).setValue(STATUS.ERROR);
    appendNote_(sheet, row, `${NOTE_CODES.CONFIG_ERROR}: ${shortMessage}`);
  } catch (recordErr) {
    Logger.log(
      JSON.stringify({
        event: 'intake_failure_recording_failed',
        row,
        error: String(recordErr && recordErr.message ? recordErr.message : recordErr),
      })
    );
  }
}

function normalizePhone_(phone) {
  const text = normalizeText_(phone);
  if (!text) return '';

  const digits = text.replace(/\D/g, '');
  if (!digits) return '';

  // Keep last 10 digits for Indian numbers, fallback to full digits when shorter.
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function maskPhone_(phone) {
  const p = normalizePhone_(phone);
  if (!p) return '';
  if (p.length <= 4) return `**${p}`;
  return `${p.slice(0, 2)}******${p.slice(-2)}`;
}

function normalizeText_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function isValidEmail_(value) {
  const email = normalizeText_(value);
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
