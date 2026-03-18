#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const FIXTURE_PATH = path.resolve('fixtures/s01/intake-sequence.json');

function normalizeText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function pickPaymentLink(batchPreference, defaultPaymentLink, premiumPaymentLink) {
  const pref = normalizeText(batchPreference).toLowerCase();
  if ((pref.includes('premium') || pref.includes('2500')) && premiumPaymentLink) {
    return premiumPaymentLink;
  }
  return defaultPaymentLink;
}

function assignBatch(existingAssignments, maxPerBatch, totalBatches) {
  for (let i = 1; i <= totalBatches; i += 1) {
    const batchName = `Batch ${i}`;
    const count = existingAssignments.filter((b) => b === batchName).length;
    if (count < maxPerBatch) return batchName;
  }
  return 'Waitlist';
}

function buildExpectedState(input, batchAssigned, links) {
  const waitlisted = batchAssigned === 'Waitlist';
  return {
    batchAssigned,
    status: waitlisted ? 'WAITLISTED' : 'REGISTERED',
    paymentStatus: 'PENDING',
    paymentLink: waitlisted
      ? ''
      : pickPaymentLink(input.batchPreference, links.defaultPaymentLink, links.premiumPaymentLink),
  };
}

function assertDeepEqual(actual, expected, context) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(
      [
        `Scenario ${context.scenarioId} mismatch at row ${context.rowIndex}`,
        `Expected: ${expectedJson}`,
        `Actual:   ${actualJson}`,
      ].join('\n')
    );
  }
}

function assertNoOverfill(assignments, maxPerBatch, totalBatches, scenarioId) {
  for (let i = 1; i <= totalBatches; i += 1) {
    const batchName = `Batch ${i}`;
    const count = assignments.filter((b) => b === batchName).length;
    if (count > maxPerBatch) {
      throw new Error(
        `Scenario ${scenarioId} overfilled ${batchName}: ${count} > ${maxPerBatch}`
      );
    }
  }
}

async function main() {
  const raw = await fs.readFile(FIXTURE_PATH, 'utf8');
  const fixture = JSON.parse(raw);

  if (!Array.isArray(fixture.scenarios) || fixture.scenarios.length === 0) {
    throw new Error('No scenarios found in fixture file.');
  }

  let verifiedRows = 0;

  for (const scenario of fixture.scenarios) {
    const {
      id,
      maxPerBatch,
      totalBatches,
      inputs,
      expected,
      defaultPaymentLink,
      premiumPaymentLink,
    } = scenario;

    if (!id) throw new Error('Scenario missing id');
    if (!Array.isArray(inputs) || !Array.isArray(expected)) {
      throw new Error(`Scenario ${id} has invalid inputs/expected arrays`);
    }
    if (inputs.length !== expected.length) {
      throw new Error(`Scenario ${id} input/expected length mismatch`);
    }

    const assignments = [];

    for (let i = 0; i < inputs.length; i += 1) {
      const input = inputs[i];
      const batchAssigned = assignBatch(assignments, maxPerBatch, totalBatches);
      const actual = buildExpectedState(input, batchAssigned, {
        defaultPaymentLink,
        premiumPaymentLink,
      });

      assertDeepEqual(actual, expected[i], {
        scenarioId: id,
        rowIndex: i + 1,
      });

      assignments.push(batchAssigned);
      verifiedRows += 1;
    }

    assertNoOverfill(assignments, maxPerBatch, totalBatches, id);
    console.log(`✓ ${id} (${inputs.length} rows)`);
  }

  console.log(`S01 seat engine verification passed (${verifiedRows} rows validated).`);
}

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  process.exit(1);
});
