#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const FIXTURE_PATH = path.resolve('fixtures/s03/operator-workflow.json');

function normalizeText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function countReviewRequired(responses) {
  return responses.filter((row) => normalizeText(row.status) === 'REVIEW_REQUIRED').length;
}

function countDecisions(reviewRows) {
  return reviewRows.reduce((acc, row) => {
    const decision = normalizeText(row.decision);
    if (!decision) return acc;
    acc[decision] = (acc[decision] || 0) + 1;
    return acc;
  }, {});
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const raw = await fs.readFile(FIXTURE_PATH, 'utf8');
  const fixture = JSON.parse(raw);

  assert(Array.isArray(fixture.scenarios), 'Fixture must define scenarios array.');

  let checks = 0;

  for (const scenario of fixture.scenarios) {
    const reviewRequired = countReviewRequired(scenario.responses || []);
    const decisionCounts = countDecisions(scenario.webhookReviews || []);

    assert(
      reviewRequired === scenario.expected.reviewRequired,
      `[${scenario.id}] reviewRequired mismatch: expected ${scenario.expected.reviewRequired}, got ${reviewRequired}`
    );

    checks += 1;

    const expectedDecisionCounts = scenario.expected.decisionCounts || {};
    Object.entries(expectedDecisionCounts).forEach(([decision, expectedCount]) => {
      const actual = decisionCounts[decision] || 0;
      assert(
        actual === expectedCount,
        `[${scenario.id}] decision ${decision} mismatch: expected ${expectedCount}, got ${actual}`
      );
      checks += 1;
    });

    console.log(`✓ ${scenario.id}`);
  }

  console.log(`S03 operator visibility verification passed (${checks} checks).`);
}

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  process.exit(1);
});
