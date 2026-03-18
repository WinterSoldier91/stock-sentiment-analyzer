#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';

const FIXTURE_PATH = path.resolve('fixtures/s02/webhook-events.json');

const STATUS = {
  CONFIRMED: 'CONFIRMED',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
};

const RECONCILIATION_DECISION = {
  MATCHED: 'MATCHED',
  AMBIGUOUS: 'AMBIGUOUS',
  UNMATCHED: 'UNMATCHED',
  REPLAY: 'REPLAY',
  REJECTED: 'REJECTED',
};

function normalizeText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizePhone(phone) {
  const text = normalizeText(phone);
  if (!text) return '';
  const digits = text.replace(/\D/g, '');
  if (!digits) return '';
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function buildWebhookDecisionScaffold(webhookEvent) {
  if (webhookEvent.eventName !== 'payment_link.paid') {
    return {
      decision: RECONCILIATION_DECISION.REJECTED,
      reason: 'unsupported_event',
      candidateRows: [],
    };
  }

  if (!webhookEvent.paymentLinkId && !webhookEvent.paymentLinkShortUrl) {
    return {
      decision: RECONCILIATION_DECISION.REJECTED,
      reason: 'missing_payment_link_identifier',
      candidateRows: [],
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
    candidateRows: [],
  };
}

function reconcileWebhookEvent(rows, webhookEvent) {
  const eligibleRows = rows.filter(
    (row) => row.batchAssigned && row.batchAssigned !== 'Waitlist' && row.status !== STATUS.CONFIRMED
  );

  let candidates = [];

  if (webhookEvent.customerContactNormalized) {
    candidates = eligibleRows.filter(
      (row) => row.phoneNormalized === webhookEvent.customerContactNormalized
    );
  }

  if (candidates.length === 0 && webhookEvent.paymentLinkShortUrl) {
    candidates = eligibleRows.filter(
      (row) => normalizeText(row.paymentLink) === webhookEvent.paymentLinkShortUrl
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
      (row) => normalizeText(row.paymentLink) === webhookEvent.paymentLinkShortUrl
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

function applyReconciliationDecision(rows, decision) {
  if (decision.decision === RECONCILIATION_DECISION.MATCHED && decision.row) {
    const target = rows.find((row) => row.row === decision.row);
    if (target) {
      target.paymentStatus = 'PAID';
      target.status = 'CONFIRMED';
    }
    return;
  }

  if (decision.decision === RECONCILIATION_DECISION.AMBIGUOUS) {
    (decision.candidateRows || []).forEach((rowNum) => {
      const target = rows.find((row) => row.row === rowNum);
      if (!target) return;
      if (target.status !== STATUS.CONFIRMED) {
        target.status = STATUS.REVIEW_REQUIRED;
      }
    });
  }
}

function buildWebhookIdempotencyKey(webhookEvent) {
  const rawKey = [
    normalizeText(webhookEvent.eventName),
    normalizeText(webhookEvent.paymentId),
    normalizeText(webhookEvent.paymentLinkId),
    normalizeText(webhookEvent.paymentLinkShortUrl),
    normalizeText(webhookEvent.customerContactNormalized),
    normalizeText(webhookEvent.customerEmailNormalized),
    String(webhookEvent.amountRupees || 0),
  ].join('|');

  const digest = crypto.createHash('sha256').update(rawKey).digest('hex');
  return `RAZORPAY_EVT_${digest}`;
}

function processWebhookEvent(rows, event, processedKeys) {
  const idempotencyKey = buildWebhookIdempotencyKey(event);

  if (processedKeys.has(idempotencyKey)) {
    return {
      decision: RECONCILIATION_DECISION.REPLAY,
      reason: 'duplicate_event',
      candidateRows: [],
      idempotencyKey,
    };
  }

  const scaffoldDecision = buildWebhookDecisionScaffold(event);
  const finalDecision =
    scaffoldDecision.decision === RECONCILIATION_DECISION.UNMATCHED &&
    scaffoldDecision.reason === 'ready_for_row_reconciliation'
      ? reconcileWebhookEvent(rows, event)
      : scaffoldDecision;

  finalDecision.idempotencyKey = idempotencyKey;
  applyReconciliationDecision(rows, finalDecision);
  processedKeys.add(idempotencyKey);

  return finalDecision;
}

function normalizeScenarioRows(rows) {
  return rows.map((row) => ({
    row: row.row,
    phoneNormalized: normalizePhone(row.phone),
    paymentLink: normalizeText(row.paymentLink),
    batchAssigned: normalizeText(row.batchAssigned),
    status: normalizeText(row.status),
    paymentStatus: normalizeText(row.paymentStatus),
  }));
}

function normalizeScenarioEvent(event) {
  return {
    eventName: normalizeText(event.eventName),
    paymentLinkId: normalizeText(event.paymentLinkId),
    paymentLinkShortUrl: normalizeText(event.paymentLinkShortUrl),
    paymentId: normalizeText(event.paymentId),
    customerContactNormalized: normalizePhone(event.customerContact),
    customerEmailNormalized: normalizeText(event.customerEmail).toLowerCase(),
    amountRupees: Number(event.amountRupees || 0),
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sortedArray(value) {
  if (!Array.isArray(value)) return [];
  return [...value].sort((a, b) => a - b);
}

function assertDecision(decision, expected, scenarioId) {
  assert(
    decision.decision === expected.decision,
    `[${scenarioId}] decision mismatch: expected ${expected.decision}, got ${decision.decision}`
  );

  assert(
    decision.reason === expected.reason,
    `[${scenarioId}] reason mismatch: expected ${expected.reason}, got ${decision.reason}`
  );

  if (Object.prototype.hasOwnProperty.call(expected, 'row')) {
    assert(
      decision.row === expected.row,
      `[${scenarioId}] matched row mismatch: expected ${expected.row}, got ${decision.row}`
    );
  }

  if (Object.prototype.hasOwnProperty.call(expected, 'candidateRows')) {
    const actualCandidates = sortedArray(decision.candidateRows || []);
    const expectedCandidates = sortedArray(expected.candidateRows || []);
    assert(
      JSON.stringify(actualCandidates) === JSON.stringify(expectedCandidates),
      `[${scenarioId}] candidate rows mismatch: expected ${JSON.stringify(expectedCandidates)}, got ${JSON.stringify(actualCandidates)}`
    );
  }
}

function assertRows(rows, expectedRows, scenarioId) {
  (expectedRows || []).forEach((expectedRow) => {
    const actual = rows.find((row) => row.row === expectedRow.row);
    assert(actual, `[${scenarioId}] missing expected row ${expectedRow.row}`);
    assert(
      actual.status === expectedRow.status,
      `[${scenarioId}] row ${expectedRow.row} status mismatch: expected ${expectedRow.status}, got ${actual.status}`
    );
    assert(
      actual.paymentStatus === expectedRow.paymentStatus,
      `[${scenarioId}] row ${expectedRow.row} payment status mismatch: expected ${expectedRow.paymentStatus}, got ${actual.paymentStatus}`
    );
  });
}

async function main() {
  const raw = await fs.readFile(FIXTURE_PATH, 'utf8');
  const fixture = JSON.parse(raw);
  assert(Array.isArray(fixture.scenarios), 'Fixture must define scenarios array.');

  let rowAssertions = 0;

  for (const scenario of fixture.scenarios) {
    const rows = normalizeScenarioRows(scenario.rows || []);
    const event = normalizeScenarioEvent(scenario.event || {});
    const processedKeys = new Set();

    const firstDecision = processWebhookEvent(rows, event, processedKeys);

    assertDecision(firstDecision, scenario.expected, scenario.id);

    if (scenario.runTwice) {
      const secondDecision = processWebhookEvent(rows, event, processedKeys);
      assert(
        secondDecision.decision === scenario.expected.secondDecision,
        `[${scenario.id}] second decision mismatch: expected ${scenario.expected.secondDecision}, got ${secondDecision.decision}`
      );
      assert(
        secondDecision.reason === scenario.expected.secondReason,
        `[${scenario.id}] second reason mismatch: expected ${scenario.expected.secondReason}, got ${secondDecision.reason}`
      );
    }

    assertRows(rows, scenario.expected.rows, scenario.id);
    rowAssertions += (scenario.expected.rows || []).length;

    console.log(`✓ ${scenario.id}`);
  }

  console.log(`S02 webhook reconciliation verification passed (${rowAssertions} row assertions).`);
}

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  process.exit(1);
});
