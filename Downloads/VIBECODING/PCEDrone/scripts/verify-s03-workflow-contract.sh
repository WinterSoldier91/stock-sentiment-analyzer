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

echo "Checking S03 operator workflow contract in $CODE_FILE"

require_literal "STATUS.REVIEW_REQUIRED"
require_literal "OPERATOR_REVIEW_RESOLVED"
require_literal "OPERATOR_INVALID_ACTION"

require_literal "function getWebhookDecisionCounts_()"
require_literal "function getRecentWebhookReviewRows_(limit)"
require_literal "function resolveReviewRowToConfirmed()"
require_literal "function resolveReviewRowToPending()"
require_literal "function resolveReviewRowToCancelled()"
require_literal "function applyReviewResolution_(row, action, operatorNote)"
require_literal "confirm_without_paid_status"
require_literal "confirm_without_assigned_seat"

echo "S03 operator workflow contract verification passed."
