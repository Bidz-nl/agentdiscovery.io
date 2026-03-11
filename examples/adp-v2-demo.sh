#!/usr/bin/env bash

set -euo pipefail

BASE_URL="http://localhost:3000/api/adp/v2"
PROVIDER_DID="did:adp:provider-001"
CONSUMER_DID="did:adp:consumer-001"
SESSION_ID="hs_replace_me"
TRANSACTION_ID="tx_replace_me"

# Step 1: Register a provider agent.
curl -X POST "$BASE_URL/agents/register" \
  -H 'Content-Type: application/json' \
  -d '{
    "did": "did:adp:provider-001",
    "name": "QuickFix Plumbing",
    "role": "provider",
    "categories": ["plumbing"],
    "capabilities": [
      {
        "key": "emergency-plumbing",
        "description": "Urgent plumbing support"
      }
    ],
    "supported_protocol_versions": ["2.0"]
  }'

echo

echo "Save the returned provider DID if you want to replace PROVIDER_DID."

# Step 2: Register a consumer agent.
curl -X POST "$BASE_URL/agents/register" \
  -H 'Content-Type: application/json' \
  -d '{
    "did": "did:adp:consumer-001",
    "name": "HomeOwner Agent",
    "role": "consumer",
    "capabilities": [
      {
        "key": "request-home-services",
        "description": "Request urgent home services"
      }
    ],
    "supported_protocol_versions": ["2.0"]
  }'

echo

echo "Save the returned consumer DID if needed."

# Step 3: Create a handshake session and copy the returned session_id into SESSION_ID.
curl -X POST "$BASE_URL/handshake" \
  -H 'Content-Type: application/json' \
  -d '{
    "message_type": "HELLO",
    "protocol_version": "2.0",
    "did": "did:adp:consumer-001",
    "role": "consumer",
    "supported_versions": ["2.0"],
    "nonce": "hello-123",
    "timestamp": "2026-03-11T08:00:00.000Z"
  }'

echo

echo "Copy session_id from the handshake response into SESSION_ID before continuing."

# Step 4: Discover matching providers using the handshake session.
curl -X POST "$BASE_URL/discover" \
  -H 'Content-Type: application/json' \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"intent\": \"Need urgent plumbing help\",
    \"category\": \"plumbing\"
  }"

echo

# Step 5: Negotiate with the provider using the provider DID and session.
curl -X POST "$BASE_URL/negotiate" \
  -H 'Content-Type: application/json' \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"provider_did\": \"$PROVIDER_DID\",
    \"service_category\": \"plumbing\",
    \"intent\": \"Need urgent plumbing help\",
    \"budget\": 150,
    \"currency\": \"EUR\"
  }"

echo

# Step 6: Create a transaction and copy the returned transaction_id into TRANSACTION_ID.
curl -X POST "$BASE_URL/transact" \
  -H 'Content-Type: application/json' \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"provider_did\": \"$PROVIDER_DID\",
    \"intent\": \"Book urgent plumbing repair\",
    \"budget\": 150,
    \"currency\": \"EUR\"
  }"

echo

echo "Copy transaction_id from the transact response into TRANSACTION_ID before continuing."

# Step 7: Update the transaction status from pending to accepted.
curl -X PATCH "$BASE_URL/transact/$TRANSACTION_ID" \
  -H 'Content-Type: application/json' \
  -d '{
    "status": "accepted"
  }'

echo

# Step 8: Update the transaction status from accepted to completed.
curl -X PATCH "$BASE_URL/transact/$TRANSACTION_ID" \
  -H 'Content-Type: application/json' \
  -d '{
    "status": "completed"
  }'

echo

# Step 9: Record a reputation signal for the completed transaction.
curl -X POST "$BASE_URL/reputation" \
  -H 'Content-Type: application/json' \
  -d "{
    \"transaction_id\": \"$TRANSACTION_ID\",
    \"provider_did\": \"$PROVIDER_DID\",
    \"score\": 3,
    \"signal\": \"Service completed successfully\"
  }"

echo

echo "ADP v2 demo flow complete."
