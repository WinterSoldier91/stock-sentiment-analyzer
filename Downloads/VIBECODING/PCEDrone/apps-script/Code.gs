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
  dashData.push(['Waitlist', waitlisted, '—', '—']);
  dashData.push(['', '', '', '']);
  dashData.push(['Total Registrations', allBatches.filter(Boolean).length, '', '']);
  dashData.push([
    'Total Confirmed',
    allPayments.filter((p) => p === PAYMENT_STATUS.PAID).length,
    '',
    '',
  ]);

  dashboard.clearContents();
  dashboard.getRange(1, 1, dashData.length, 4).setValues(dashData);

  dashboard.getRange(1, 1).setFontSize(16).setFontWeight('bold');
  dashboard
    .getRange(3, 1, 1, 4)
    .setFontWeight('bold')
    .setBackground('#e8f0fe');
  dashboard.setColumnWidth(1, 180);
  dashboard.setColumnWidth(2, 140);
  dashboard.setColumnWidth(3, 160);
  dashboard.setColumnWidth(4, 120);
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
    .addToUi();
}

function testLastRow() {
  onFormSubmit(null);
  SpreadsheetApp.getUi().alert('✅ Test complete — check the last row.');
}

// ============================================================
// 🌐 Razorpay webhook placeholder (S02 will enforce signature/idempotency)
// ============================================================

function doPost(e) {
  Logger.log(
    JSON.stringify({
      event: 'webhook_received',
      phase: 'S01_contract_only',
      hasBody: Boolean(e && e.postData && e.postData.contents),
    })
  );

  return ContentService.createTextOutput(
    JSON.stringify({
      status: 'accepted',
      message: 'Webhook ingestion placeholder in S01. Reconciliation enforced in S02.',
    })
  ).setMimeType(ContentService.MimeType.JSON);
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
