# ADP v2 Hello World

This scenario shows a minimal end-to-end ADP v2 flow using the current API.

Scenario: a consumer agent needs urgent plumbing help.

![ADP process timeline](../assets/diagrams/adp-process-timeline.png)

## 1. Register provider agent

**Endpoint**

```text
POST /api/adp/v2/agents/register
```

**Request**

```json
{
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
}
```

**Response**

```json
{
  "ok": true,
  "message": "ADP v2 agent registered",
  "agent": {
    "did": "did:adp:provider-001",
    "role": "provider"
  }
}
```

## 2. Register consumer agent

**Endpoint**

```text
POST /api/adp/v2/agents/register
```

**Request**

```json
{
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
}
```

**Response**

```json
{
  "ok": true,
  "message": "ADP v2 agent registered",
  "agent": {
    "did": "did:adp:consumer-001",
    "role": "consumer"
  }
}
```

## 3. Create handshake session

**Endpoint**

```text
POST /api/adp/v2/handshake
```

**Request**

```json
{
  "message_type": "HELLO",
  "protocol_version": "2.0",
  "did": "did:adp:consumer-001",
  "role": "consumer",
  "supported_versions": ["2.0"],
  "nonce": "hello-123",
  "timestamp": "2026-03-11T08:00:00.000Z"
}
```

**Response**

```json
{
  "message_type": "ACK",
  "accepted": true,
  "session_id": "hs_abc123",
  "status": "open",
  "trust_level": "provisional",
  "expires_at": "2026-03-11T08:15:00.000Z"
}
```

## 4. Discover providers

**Endpoint**

```text
POST /api/adp/v2/discover
```

**Request**

```json
{
  "session_id": "hs_abc123",
  "intent": "Need urgent plumbing help",
  "category": "plumbing"
}
```

**Response**

```json
{
  "ok": true,
  "message": "ADP v2 discover completed",
  "session_id": "hs_abc123",
  "matches": [
    {
      "did": "did:adp:provider-001",
      "name": "QuickFix Plumbing"
    }
  ]
}
```

## 5. Negotiate service

**Endpoint**

```text
POST /api/adp/v2/negotiate
```

**Request**

```json
{
  "session_id": "hs_abc123",
  "provider_did": "did:adp:provider-001",
  "service_category": "plumbing",
  "intent": "Need urgent plumbing help",
  "budget": 150,
  "currency": "EUR"
}
```

**Response**

```json
{
  "ok": true,
  "message": "ADP v2 negotiate request accepted",
  "session_id": "hs_abc123",
  "provider": {
    "did": "did:adp:provider-001",
    "name": "QuickFix Plumbing"
  }
}
```

## 6. Create transaction

**Endpoint**

```text
POST /api/adp/v2/transact
```

**Request**

```json
{
  "session_id": "hs_abc123",
  "provider_did": "did:adp:provider-001",
  "intent": "Book urgent plumbing repair",
  "budget": 150,
  "currency": "EUR"
}
```

**Response**

```json
{
  "ok": true,
  "message": "ADP v2 transaction created",
  "transaction": {
    "transaction_id": "tx_123",
    "status": "pending"
  }
}
```

## 7. Accept transaction

**Endpoint**

```text
PATCH /api/adp/v2/transact/tx_123
```

**Request**

```json
{
  "status": "accepted"
}
```

**Response**

```json
{
  "ok": true,
  "transaction": {
    "transaction_id": "tx_123",
    "status": "accepted"
  }
}
```

## 8. Complete transaction

**Endpoint**

```text
PATCH /api/adp/v2/transact/tx_123
```

**Request**

```json
{
  "status": "completed"
}
```

**Response**

```json
{
  "ok": true,
  "transaction": {
    "transaction_id": "tx_123",
    "status": "completed"
  }
}
```

## 9. Record reputation

**Endpoint**

```text
POST /api/adp/v2/reputation
```

**Request**

```json
{
  "transaction_id": "tx_123",
  "provider_did": "did:adp:provider-001",
  "score": 3,
  "signal": "Service completed successfully"
}
```

**Response**

```json
{
  "ok": true,
  "message": "ADP v2 reputation recorded",
  "reputation": {
    "reputation_id": "rep_123",
    "score": 3
  }
}
```
