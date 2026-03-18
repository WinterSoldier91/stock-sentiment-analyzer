#!/usr/bin/env bash
set -euo pipefail

CODE_FILE="apps-script/Code.gs"

if [[ ! -f "$CODE_FILE" ]]; then
  echo "✗ Missing $CODE_FILE"
  exit 1
fi

require_literal() {
  local literal="$1"
  if ! grep -Fq "$literal" "$CODE_FILE"; then
    echo "✗ Missing literal: $literal"
    exit 1
  fi
  echo "✓ $literal"
}

echo "Checking S01 sheet contract symbols in $CODE_FILE"

# Core entrypoints / helpers
require_literal "function onFormSubmit(e)"
require_literal "function assignBatch_(sheet, currentRow)"
require_literal "function assertResponsesSchema_(sheet)"
require_literal "function normalizePhone_(phone)"

# Required headers
require_literal "const REQUIRED_STATE_HEADERS"
require_literal "8: 'Batch Assigned'"
require_literal "9: 'Payment Status'"
require_literal "10: 'Payment Link'"
require_literal "11: 'Status'"
require_literal "12: 'Notes'"

# Required column mappings
require_literal "BATCH_ASSIGNED: 8"
require_literal "PAYMENT_STATUS: 9"
require_literal "PAYMENT_LINK: 10"
require_literal "STATUS: 11"
require_literal "NOTES: 12"

echo "S01 sheet contract verification passed."
