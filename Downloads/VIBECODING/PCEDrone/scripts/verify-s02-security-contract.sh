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

echo "Checking S02 webhook security scaffolding in $CODE_FILE"

require_literal "const WEBHOOK ="
require_literal "SECRET_PROPERTY_KEY: 'RAZORPAY_WEBHOOK_SECRET'"
require_literal "IDEMPOTENCY_PROPERTY_PREFIX: 'RAZORPAY_EVT_'"
require_literal "const RECONCILIATION_DECISION ="

require_literal "function doPost(e)"
require_literal "function getRawBody_(e)"
require_literal "function getWebhookSignature_(e, payload)"
require_literal "function getWebhookSecret_()"
require_literal "function verifyWebhookSignature_(rawBody, providedSignature, webhookSecret)"
require_literal "function computeHmacSha256Hex_(message, secret)"
require_literal "function buildWebhookIdempotencyKey_(webhookEvent)"
require_literal "function isWebhookReplay_(idempotencyKey)"
require_literal "function markWebhookProcessed_(idempotencyKey)"
require_literal "function buildWebhookDecisionScaffold_(webhookEvent)"
require_literal "signature_mismatch"
require_literal "duplicate_event"

echo "S02 webhook security contract verification passed."
