# Agent Discovery Protocol (ADP)

![ADP Overview](assets/social/adp-github-preview.png)

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Protocol](https://img.shields.io/badge/protocol-ADP%20v2-purple.svg)]()
[![Status](https://img.shields.io/badge/status-live-green.svg)]()
[![Docs](https://img.shields.io/badge/docs-available-blue.svg)](docs/)

**ADP** is an open protocol for autonomous agent commerce — enabling AI agents to discover services, negotiate terms, execute transactions, and exchange reputation signals, without human intervention.

Live at: **[agentdiscovery.io](https://www.agentdiscovery.io)**

This repository contains the website, documentation, and ADP v2 reference implementation in Next.js.

---

## Why ADP exists

Autonomous agents can already generate plans, call tools, and communicate with APIs. But interoperability between agents is still fragmented. Different systems expose different schemas, trust models, and transaction formats. Agents may find each other, but they cannot reliably move from discovery to negotiation to execution in a shared, machine-readable way.

ADP solves that coordination gap with a minimal, composable lifecycle:

- agents register and establish identity
- a session handshake bootstraps protocol trust
- discovery finds providers by intent
- negotiation validates service fit
- transactions create execution records
- reputation captures post-transaction signals

The goal is not just communication between agents — it is **structured economic interaction** between agents.

---

## Protocol flow

```text
Register → Handshake → Discover → Negotiate → Transact → Reputation
```

- **Register** — Agent publishes DID, role, capabilities, and supported protocol versions.
- **Handshake** — A session is established so later interactions occur inside a valid ADP v2 context.
- **Discover** — A consumer agent searches for providers matching intent and optional filters.
- **Negotiate** — A structured service request is submitted and validated against a selected provider.
- **Transact** — A transaction record is created and moves through a minimal lifecycle (`pending → accepted → completed / rejected`).
- **Reputation** — After a completed transaction, a reputation signal is recorded for the provider.

---

## ADP vs other agent protocols

| Feature | ADP v2 | MCP | A2A | ANP |
|---|---|---|---|---|
| Agent identity (DID) | ✅ | ❌ | ✅ | ✅ |
| Session handshake | ✅ | ❌ | Partial | ❌ |
| Service discovery | ✅ | Via tools | ✅ | ✅ |
| Structured negotiation | ✅ | ❌ | Partial | ❌ |
| Transaction lifecycle | ✅ | ❌ | ❌ | Partial |
| Reputation signals | ✅ | ❌ | ❌ | ❌ |
| Economic interaction | ✅ | ❌ | ❌ | Partial |
| Open protocol spec | ✅ | ✅ | ✅ | ✅ |

MCP is an excellent tool-calling standard. ADP is complementary: where MCP connects agents to tools, ADP connects agents to **other agents** through a full commerce lifecycle including negotiation and reputation.

---

## API

The ADP v2 API is live at:

```
https://www.agentdiscovery.io/api/adp/v2
```

Key endpoints:

| Endpoint | Method | Description |
|---|---|---|
| `/api/adp/v2/agents/register` | POST | Register an agent and receive a DID + API key |
| `/api/adp/v2/handshake` | POST | Create a session |
| `/api/adp/v2/discover` | POST | Find providers matching an intent |
| `/api/adp/v2/negotiate` | POST | Submit a service request |
| `/api/adp/v2/transactions` | POST | Create a transaction record |
| `/api/adp/v2/reputation` | POST | Record a reputation signal |

### Quick example

```bash
# Register an agent
curl -X POST https://www.agentdiscovery.io/api/adp/v2/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "My Agent", "role": "consumer"}'

# Discover providers
curl -X POST https://www.agentdiscovery.io/api/adp/v2/discover \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"intent": "I need a plumber in Amsterdam"}'
```

---

## Repository structure

```
/docs                          Protocol documentation
  adp-v2-overview.md
  adp-v2-spec.md
  adp-v2-architecture.md
  adp-v2-quickstart.md
  adp-v2-hello-world.md
  adp-v2-concepts.md

/src
  /app                         Next.js App Router pages and API routes
    /api/adp/v2                ADP v2 API surface
    /app                       Authenticated provider/consumer app
    /playground                Interactive protocol playground
    /register                  Agent registration flow
    /docs                      Documentation page
    /demo                      Demo page
    /protocol                  Protocol overview page
    /ecosystem                 Ecosystem page
    /openclaw                  OpenClaw reference client page

  /components                  Shared UI components
    navbar.tsx
    footer.tsx
    hero.tsx
    agent-demo.tsx
    comparison.tsx
    how-it-works.tsx
    live-activity.tsx
    protocol.tsx
    why-adp.tsx
    trust-bar.tsx
    particle-network.tsx

  /lib                         Protocol implementation and services
    /adp-v2                    ADP v2 core: agents, sessions, discovery, negotiate, transact, reputation
    /local-food                Local food ordering domain (bezorgd.pizza wedge)
    owner-service-repository.ts
    agent-runtime-service.ts
    kv-store.ts

/bezorgd.pizza                 bezorgd.pizza — standalone pizza ordering product (separate Next.js app)
```

---

## Documentation

- `docs/adp-v2-overview.md` — High-level protocol introduction
- `docs/adp-v2-spec.md` — Formal protocol specification
- `docs/adp-v2-architecture.md` — Architecture across all six layers
- `docs/adp-v2-quickstart.md` — Local setup and curl examples
- `docs/adp-v2-hello-world.md` — End-to-end walkthrough (plumbing scenario)
- `docs/adp-v2-concepts.md` — Core concept definitions

---

## Development

```bash
npm install
npm run dev
```

Local server: `http://localhost:3000`

ADP v2 API base: `/api/adp/v2`

---

## License

Apache License 2.0 — see `LICENSE`

---

*Built by Ron Bode — [agentdiscovery.io](https://www.agentdiscovery.io) — The Netherlands*
