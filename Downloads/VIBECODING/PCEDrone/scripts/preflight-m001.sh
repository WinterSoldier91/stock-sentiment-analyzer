#!/usr/bin/env bash
set -euo pipefail

run() {
  local label="$1"
  shift
  echo "\n==> $label"
  "$@"
}

echo "M001 preflight started"

run "S01 contract" bash scripts/verify-s01-sheet-contract.sh
run "S01 seat engine" node scripts/verify-s01-seat-engine.mjs
run "S02 security" bash scripts/verify-s02-security-contract.sh
run "S02 reconciliation" node scripts/verify-s02-webhook-matching.mjs
run "S03 workflow" bash scripts/verify-s03-workflow-contract.sh
run "S03 operator views" node scripts/verify-s03-operator-views.mjs

echo "\n✅ M001 preflight passed (S01/S02/S03 verifiers all green)."
