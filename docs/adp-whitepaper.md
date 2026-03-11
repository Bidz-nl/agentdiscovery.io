1. Abstract

Korte samenvatting van het probleem en de oplossing.

Voorbeeldtekst:

The Agent Discovery Protocol (ADP) is an open protocol that enables autonomous AI agents to discover service providers, negotiate capabilities, execute transactions, and record reputation signals in a standardized way.

As AI agents become increasingly capable of acting on behalf of users and businesses, a missing infrastructure layer exists between agents and real-world services. ADP defines a simple protocol for agent discovery, negotiation, transaction execution, and reputation signaling.

The protocol aims to provide a neutral interoperability layer enabling agents and service providers to interact without requiring tightly coupled integrations.

2. Introduction

Leg uit waarom dit nodig is.

Belangrijk punt:

AI agents are becoming actors in the economy
but there is no standard protocol for how they
discover services and transact.

Voorbeeldtekst:

AI systems are rapidly evolving from passive tools into autonomous agents capable of acting on behalf of users. These agents may schedule services, purchase goods, negotiate prices, or interact with digital systems.

However, the infrastructure for agent-to-service interaction remains fragmented. Today, integrations are built through custom APIs, proprietary platforms, or manual service directories.

ADP proposes a simple open protocol that allows agents to:

discover providers

negotiate capabilities

perform transactions

record reputation signals

3. The Problem

Hier gebruik je de Problem ADP Solves diagram.

Belangrijkste punten:

Fragmented APIs
Every provider exposes different interfaces
No discovery mechanism

Agents cannot automatically locate providers.

No shared transaction model

Every service implements its own logic.

No trust layer

Agents cannot evaluate provider reliability.

4. Design Goals

Wat ADP wel en niet probeert te doen.

Interoperability

Agents and providers must interact without prior integration.

Simplicity

The protocol must remain minimal and easy to implement.

Extensibility

New services and capabilities should be added without breaking compatibility.

Neutral infrastructure

The protocol should not depend on any central authority.

5. Core Concepts

Gebaseerd op je docs/adp-v2-concepts.md.

Agent

Software entity acting on behalf of a user or system.

Provider

Service endpoint capable of executing tasks.

Capability

A declared ability offered by a provider.

Session

Temporary interaction context between agents.

Transaction

Structured execution of a service request.

Reputation Signal

Feedback generated after completed transactions.

6. Protocol Flow

Hier gebruik je:

adp-protocol-flow.png

Flow:

Agent Register
→ Handshake
→ Discover
→ Negotiate
→ Transact
→ Reputation

Uitleg van elke stap.

7. Architecture

Gebruik:

adp-architecture.png

Architectuurlagen:

AI Agents
↓
ADP API Layer
↓
Protocol Services
↓
Transaction Layer
↓
Reputation Layer
8. Transaction Lifecycle

Gebruik je transact states.

pending
accepted
completed
rejected

Lifecycle:

create
→ accept
→ complete
→ reputation
9. Reputation Model

ADP MVP gebruikt een simple signal model.

Score:

1 negative
2 neutral
3 positive

Waarom simpel:

makkelijk te implementeren

later uitbreidbaar

10. Security Considerations

Belangrijke punten:

Identity

Agents are identified through decentralized identifiers (DIDs).

Session security

Handshake sessions expire automatically.

Transaction integrity

Transactions reference session context.

Future work

Possible extensions include:

cryptographic signatures
escrow systems
policy enforcement
11. Example Interaction

Gebruik je demo script.

Flow:

agent register
handshake
discover
negotiate
transact
complete
reputation

Dit is je examples/adp-v2-demo.sh.

12. Future Extensions

Dingen die nog kunnen komen:

Payment rails

Integration with payment protocols.

Escrow systems

Trust-minimized transactions.

Capability ontologies

Standardized service definitions.

Multi-agent negotiation

Competitive bidding models.

13. Conclusion

Samenvatting.

Voorbeeld:

ADP introduces a simple open protocol enabling autonomous AI agents to interact with service providers through standardized discovery, negotiation, and transaction flows.

By defining a minimal interoperability layer, ADP aims to reduce fragmentation and enable a broader ecosystem of agent-driven services.