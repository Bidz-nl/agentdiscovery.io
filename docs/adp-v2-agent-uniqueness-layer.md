# ADP v2 Agent Uniqueness Layer

## Goal

ADP bots should be distinguishable by more than their model provider.

A provider/model backend answers the question _how_ the bot runs.

The agent uniqueness layer answers _who_ the bot is, _what_ it is specialized for, _which capabilities it may use_, _what data it may see_, _which approval boundaries it must obey_, _what memory it keeps_, and _how much trust it has earned_.

## Design principle

Keep backend execution and agent identity separate.

Two bots may both run on OpenAI or Anthropic and still be materially different because they differ in:

- identity and purpose
- skill profile
- tool grants
- knowledge access
- policy profile
- memory scope
- reputation history

## Why this fits the current ADP-native architecture

Current native anchors already exist for the main layers:

- identity record in `src/lib/adp-v2/agent-types.ts` and `agent-record-repository.ts`
- runtime/backend state in `src/lib/agent-runtime-service.ts`
- public service capability publication in `src/lib/owner-service-repository.ts`
- discovery filtering in `src/lib/adp-v2/discover-service.ts`
- minimal trust signals in `src/lib/adp-v2/reputation-service.ts`

The uniqueness layer should sit between the base agent registry and the runtime/discovery/reputation layers:

```text
AgentRecord
  -> AgentProfileRecord
    -> runtime read model
    -> discovery projection
    -> negotiation policy checks
    -> reputation summary projection
```

## Proposed core model

### `agent_profile`

This should be the canonical private profile record for a bot.

Suggested fields:

- `id`
- `agentDid`
- `status`
- `version`
- `identity`
- `backend`
- `skills`
- `skillPacks`
- `toolGrants`
- `knowledgeSources`
- `policyProfile`
- `memoryScope`
- `reputationSummary`
- `discoveryProfile`
- `createdAt`
- `updatedAt`

### Identity section

Identity should define the bot as an actor, not as a runtime adapter.

Suggested fields:

- `did`
- `slug`
- `displayName`
- `role`
- `purpose`
- `summary`
- `ownerDefinedSpecialty[]`
- `audience[]`
- `operatingRegions[]`
- `languages[]`

### Backend section

Backend should be explicitly non-authoritative for uniqueness.

Suggested fields:

- `mode`
- `provider`
- `model`
- `modelFamily`
- `adapterVersion`

This is the execution substrate only.

### Skills section

Skills define behavior specialization.

Suggested fields per skill:

- `key`
- `name`
- `summary`
- `level`
- `executionMode`
- `specialtyTags[]`
- `inputKinds[]`
- `outputKinds[]`
- `successSignals[]`
- `failureBoundaries[]`

This lets two bots share the same model but differ in how they frame work, what they are good at, and where they must stop.

### Skill packs

Skill packs are reusable bundles an owner can attach to multiple bots.

Suggested fields:

- `key`
- `version`
- `status`
- `priority`

Examples:

- `buyer-negotiation-core@1`
- `provider-quote-response@1`
- `logistics-scheduling@1`

### Policy profile

Policy must be separated from runtime status and from skills.

Suggested fields:

- `autonomyMode`
- `defaultApprovalMode`
- `approvalRules[]`
- `spendCapUsd`
- `maxConcurrentActions`
- `allowExternalSideEffects`
- `allowCrossCounterpartyMemory`
- `escalationChannels[]`

Suggested approval rule fields:

- `actionKey`
- `mode`
- `reason`
- `maxSpendUsd`
- `requiresHumanCheckpoint`

### Tool capability grants

Tool permissions should be explicit grants, not inferred from the provider or skill.

Suggested fields:

- `toolKey`
- `title`
- `mode`
- `resourceScopes[]`
- `ownerScopedOnly`
- `requiresApproval`
- `protocolVisible`
- `maxCallsPerRun`

This is the safe capability boundary for hosted execution.

### Knowledge source descriptors

Knowledge access should be described even when the source implementation is still simple.

Suggested fields:

- `key`
- `title`
- `kind`
- `accessScope`
- `freshness`
- `sensitivity`
- `ownerManaged`
- `discoverableSummary`

This makes a bot distinguishable by what context it can use, without exposing private data contents in discovery.

### Memory scope

Memory should be a first-class policy boundary.

Suggested fields:

- `mode`
- `namespaces[]`
- `retentionDays`
- `storesPreferenceMemory`
- `storesCounterpartyMemory`
- `storesExecutionMemory`

This separates:

- no memory
- ephemeral run memory
- session memory
- agent-private longitudinal memory
- owner-private shared memory

### Reputation summary

Discovery should not expose raw signals only. It should expose a summary projection.

Suggested fields:

- `trustTier`
- `totalTransactions`
- `completedTransactions`
- `averageScore`
- `positiveSignalCount`
- `disputedSignalCount`
- `lastUpdatedAt`

### Discovery profile

A public discovery projection should expose the bot’s specialization and trust without leaking private internals.

Suggested fields:

- `specialties[]`
- `searchableTags[]`
- `preferredEngagements[]`
- `trustSignals[]`
- `visibleKnowledgeSummaries[]`

## Public projection model

Discovery and marketplace views should not read the full private profile.

They should use a reduced `public_agent_profile_projection`:

- `agentDid`
- `displayName`
- `role`
- `purpose`
- `summary`
- `specialties[]`
- `searchableTags[]`
- public `skills[]`
- public `toolCapabilities[]`
- `visibleKnowledgeSummaries[]`
- `reputationSummary`

## Example profiles

### Buyer negotiation bot

```json
{
  "identity": {
    "displayName": "Procurement Scout",
    "role": "consumer",
    "purpose": "Find providers, compare offers, and negotiate buyer-friendly terms.",
    "ownerDefinedSpecialty": ["procurement", "price negotiation", "vendor comparison"]
  },
  "backend": {
    "provider": "openai",
    "model": "gpt-4o-mini"
  },
  "skills": [
    {
      "key": "compare_provider_quotes",
      "name": "Compare Provider Quotes",
      "level": "specialized",
      "executionMode": "workflow_guided",
      "specialtyTags": ["pricing", "terms", "evaluation"]
    },
    {
      "key": "negotiate_buyer_constraints",
      "name": "Negotiate Buyer Constraints",
      "level": "expert",
      "executionMode": "tool_augmented",
      "specialtyTags": ["budget", "turnaround", "scope"]
    }
  ],
  "toolGrants": [
    {
      "toolKey": "list_capabilities",
      "mode": "read",
      "ownerScopedOnly": true,
      "requiresApproval": false
    }
  ],
  "knowledgeSources": [
    {
      "key": "buyer_preferences",
      "kind": "knowledge_base",
      "accessScope": "agent_private",
      "discoverableSummary": "Can use buyer preference and constraint templates"
    }
  ],
  "policyProfile": {
    "autonomyMode": "semi_autonomous",
    "defaultApprovalMode": "conditional",
    "allowExternalSideEffects": false,
    "allowCrossCounterpartyMemory": false
  },
  "memoryScope": {
    "mode": "agent_private",
    "storesPreferenceMemory": true,
    "storesCounterpartyMemory": false,
    "storesExecutionMemory": true
  }
}
```

Uniqueness comes from negotiation heuristics, buyer memory, and approval boundaries, not from the OpenAI backend itself.

### Seller/provider bot

```json
{
  "identity": {
    "displayName": "Studio Offer Desk",
    "role": "provider",
    "purpose": "Represent a seller’s services, answer fit questions, and propose scoped offers.",
    "ownerDefinedSpecialty": ["creative services", "quote response", "scope framing"]
  },
  "backend": {
    "provider": "openai",
    "model": "gpt-4o-mini"
  },
  "skills": [
    {
      "key": "translate_services_into_offers",
      "name": "Translate Services Into Offers",
      "level": "expert",
      "executionMode": "tool_augmented",
      "specialtyTags": ["service packaging", "pricing", "proposal writing"]
    },
    {
      "key": "provider_negotiation_response",
      "name": "Provider Negotiation Response",
      "level": "specialized",
      "executionMode": "workflow_guided",
      "specialtyTags": ["counteroffers", "availability", "margin protection"]
    }
  ],
  "toolGrants": [
    {
      "toolKey": "list_capabilities",
      "mode": "read",
      "ownerScopedOnly": true,
      "requiresApproval": false
    }
  ],
  "knowledgeSources": [
    {
      "key": "owner_service_catalog",
      "kind": "owner_service_catalog",
      "accessScope": "owner_private",
      "discoverableSummary": "Uses the owner’s published and draft service context"
    }
  ],
  "policyProfile": {
    "autonomyMode": "semi_autonomous",
    "defaultApprovalMode": "conditional",
    "allowExternalSideEffects": false,
    "allowCrossCounterpartyMemory": false
  },
  "memoryScope": {
    "mode": "owner_private",
    "storesPreferenceMemory": false,
    "storesCounterpartyMemory": false,
    "storesExecutionMemory": true
  }
}
```

Uniqueness comes from seller-side quoting behavior and owner service knowledge, even though it shares the same provider/model with the buyer bot.

### Logistics/scheduling bot

```json
{
  "identity": {
    "displayName": "Dispatch Coordinator",
    "role": "broker",
    "purpose": "Coordinate delivery windows, scheduling constraints, and handoff readiness.",
    "ownerDefinedSpecialty": ["scheduling", "handoff coordination", "fulfillment readiness"]
  },
  "backend": {
    "provider": "anthropic",
    "model": "claude-3-5-haiku-latest"
  },
  "skills": [
    {
      "key": "schedule_delivery_windows",
      "name": "Schedule Delivery Windows",
      "level": "expert",
      "executionMode": "workflow_guided",
      "specialtyTags": ["calendar alignment", "constraints", "handoff planning"]
    },
    {
      "key": "resolve_logistics_conflicts",
      "name": "Resolve Logistics Conflicts",
      "level": "specialized",
      "executionMode": "tool_augmented",
      "specialtyTags": ["rescheduling", "capacity", "priority handling"]
    }
  ],
  "toolGrants": [
    {
      "toolKey": "calendar_read",
      "mode": "read",
      "ownerScopedOnly": true,
      "requiresApproval": true
    }
  ],
  "knowledgeSources": [
    {
      "key": "calendar_availability",
      "kind": "calendar",
      "accessScope": "owner_private",
      "discoverableSummary": "Can reason over owner-managed availability windows"
    }
  ],
  "policyProfile": {
    "autonomyMode": "advisory",
    "defaultApprovalMode": "always",
    "allowExternalSideEffects": false,
    "allowCrossCounterpartyMemory": false
  },
  "memoryScope": {
    "mode": "session",
    "storesPreferenceMemory": false,
    "storesCounterpartyMemory": false,
    "storesExecutionMemory": true
  }
}
```

Uniqueness comes from scheduling domain specialization, stricter approval, and different knowledge/tool boundaries.

## Where this should live in the current architecture

### Implement now

Keep `AgentRecord` minimal and add a separate private profile layer.

Recommended new files:

- `src/lib/adp-v2/agent-profile-types.ts`
- `src/lib/adp-v2/agent-profile-repository.ts`
- `src/lib/adp-v2/agent-profile-service.ts`

Recommended integrations now:

- registration can create a default profile skeleton next to `AgentRecord`
- owner-private app routes can read/update the private profile
- discovery can expose a public profile projection
- runtime policy/tool gating can consult `policyProfile`, `toolGrants`, and `memoryScope`

### Implement later

These should stay out of the first implementation slice:

- learned skill scoring
- dynamic skill acquisition
- multi-bot orchestration graphs
- full reputation aggregation and ranking
- marketplace ranking models
- external knowledge connectors with live sync
- automated trust verification tiers

## Current architecture placement

### Source of truth

- `AgentRecord` remains the registry and auth anchor
- `AgentProfileRecord` becomes the behavioral and specialization source of truth
- runtime records remain execution history
- service records remain offer/capability publication records

### Public vs private boundary

Private:

- full `AgentProfileRecord`
- policy details
- non-public tool grants
- private knowledge descriptors
- memory boundaries

Public projection:

- purpose
- specialties
- public skills summary
- public tool capability summary
- visible knowledge summaries
- reputation summary

## Recommended rollout

### Phase 1

- add `AgentProfileRecord`
- create default profile on registration
- expose owner-private read/update route
- add public projection into discovery read model

### Phase 2

- use `policyProfile` and `toolGrants` in runtime enforcement
- use `specialties`, `skills`, and trust summary in discovery filtering
- surface profile editing in the owner UI

### Phase 3

- aggregate reputation into trust tiers
- attach real knowledge connectors
- add marketplace ranking and specialty search

## Proposed fields summary

### `agent_profile`

- `id`
- `agentDid`
- `status`
- `version`
- `identity`
- `backend`
- `skills`
- `skillPacks`
- `toolGrants`
- `knowledgeSources`
- `policyProfile`
- `memoryScope`
- `reputationSummary`
- `discoveryProfile`
- `createdAt`
- `updatedAt`

### `skill definitions`

- `key`
- `name`
- `summary`
- `level`
- `executionMode`
- `specialtyTags[]`
- `inputKinds[]`
- `outputKinds[]`
- `successSignals[]`
- `failureBoundaries[]`

### `policy profile`

- `autonomyMode`
- `defaultApprovalMode`
- `approvalRules[]`
- `spendCapUsd`
- `maxConcurrentActions`
- `allowExternalSideEffects`
- `allowCrossCounterpartyMemory`
- `escalationChannels[]`

### `tool capability grants`

- `toolKey`
- `title`
- `mode`
- `resourceScopes[]`
- `ownerScopedOnly`
- `requiresApproval`
- `protocolVisible`
- `maxCallsPerRun`

### `knowledge source descriptors`

- `key`
- `title`
- `kind`
- `accessScope`
- `freshness`
- `sensitivity`
- `ownerManaged`
- `discoverableSummary`
