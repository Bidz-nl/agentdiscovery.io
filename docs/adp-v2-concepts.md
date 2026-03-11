# ADP v2 Concepts

This document explains the core concepts used across the ADP v2 MVP.

## DID

A DID is a decentralized identifier for an agent.

In ADP v2, the DID is the primary identity reference used across registration, discovery, negotiation, transactions, and reputation. A DID allows agents to refer to each other in a consistent, machine-readable way.

## Agent

An agent is a participant in the ADP network.

Agents register a manifest that describes who they are and what role they play in the protocol. In the current MVP, agents can act as:

- `consumer`
- `provider`
- `broker`

A registered agent can then be discovered, validated, or referenced by later protocol steps.

## Capability

A capability describes what an agent can do.

Capabilities are part of the agent manifest and help other agents understand which services a provider can offer. In the current MVP, a capability contains a key and a description, and can optionally include input or output schema metadata.

## Session

A session is the result of a successful handshake.

The ADP v2 session layer establishes short-lived protocol context between agents. A session has a `session_id`, a status, a trust level, and an expiry time. In the current MVP, discover, negotiate, and transact creation rely on an open session.

## Transaction

A transaction is the execution record for an interaction between agents.

After discovery and negotiation, a consumer can create a transaction with a provider. In the current MVP, transactions move through a small lifecycle:

- `pending`
- `accepted`
- `rejected`
- `completed`

This gives the protocol a minimal but explicit execution model.

## Reputation signal

A reputation signal is post-transaction feedback recorded for a provider.

In the current MVP, a reputation signal can only be recorded after a transaction is completed. It links a provider DID to a completed transaction and stores a small evaluation consisting of:

- `score`
- `signal`
- `created_at`

This is a simple foundation for future trust and reputation layers without yet implementing aggregation or ranking.
