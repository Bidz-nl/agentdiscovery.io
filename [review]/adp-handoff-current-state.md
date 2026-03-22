# ADP handoff — current state and next start point

## Where the project stands
ADP has been moved away from Bidz-coupled assumptions into its own architecture under agentdiscovery.io direction.

### Stable foundations now in place
- Owner-private service control plane exists end-to-end
- Owner-private auth boundary exists
- Provider switching exists
- Durable ServiceRecord store exists
- Durable manifest/projection store exists
- Frozen latest-published snapshot exists
- Service lifecycle exists:
  - draft
  - published
  - archived
  - hard delete
- Explicit compat inbox routes exist
- Explicit compat negotiation routes exist
- App-local negotiation detail resolver exists

## Important architectural truths
### Owner-private domain
Owner-private service management is no longer treated as protocol capability editing.
It is its own private control plane.

### Publish/projection boundary
- ServiceRecord is the owner-private source of truth
- Manifest is a derived projection store
- Publish/unpublish are explicit projection actions
- Archive/delete are owner-private lifecycle actions
- Archive preserves history and snapshot
- Delete is terminal and only allowed for non-published services

### Auth boundary
- Owner auth is separate from handshake/session auth
- Owner-private route scope is server-derived
- Provider scope comes from validated private auth context, not client-supplied DID
- Provider switching is server-authoritative via activeProviderDid

## Current owner-private service system
### Routes and behavior
- owner-private read/create/edit exist
- publish/unpublish exist
- archive/restore exist
- hard delete exists
- UI list/add/edit flow exists
- legacy services are not mixed into owner-private mutation semantics

### Current lifecycle rules
- published services must be unpublished before archive/delete
- archived services are read-only until restored
- archived services are excluded from rebuild
- delete removes the whole durable ServiceRecord including latestPublishedSnapshot

## Runtime / compatibility cleanup status
### /api/adp/[...path]
This route is now pure legacy passthrough only.

It no longer owns:
- dashboard/summary compatibility logic
- inbox compatibility logic
- negotiation runtime compatibility logic

### Explicit app/compat routes now exist
- dashboard compat routes
- provider inbox compat routes
- compat negotiation routes
- app-local negotiation detail resolver

## Current compatibility/runtime direction
### Negotiation
- compat engage uses explicit compat route
- compat action uses explicit compat route
- negotiation detail reads use app-local resolver
- no negotiation runtime shim remains in catch-all

### Provider inbox
- compat inbox uses explicit app compat route
- catch-all inbox shim removed
- legacy inbox still exists only through generic passthrough when applicable

## Product decisions already made
### Engage
Engage is now protocol-session-required at the product/UI layer.
The old non-session engage path was retired from first-party UI, then the fallback/shim was removed.

### Legacy negotiation actions
Legacy negotiations are now view-only on the consumer order page.
Compat/session negotiations remain actionable.
This allowed removal of the last non-session negotiate fallback and action shim.

## Current meaning of the catch-all
Near-term:
- pure legacy passthrough only

Long-term:
- removable entirely once no first-party /api/adp legacy usage remains

## Best next step after opening a new chat
Do a **legacy passthrough usage audit**.

Goal:
map all remaining first-party usage of `/api/adp/...` and decide:
- which calls are still intentionally needed legacy flows
- which are migration candidates
- which may be dead leftovers
- what the shortest path is to removing `/api/adp/[...path]` entirely

## Recommended opening line for the next chat
“We are continuing the ADP project. The owner-private control plane, lifecycle, provider switching, compat inbox/negotiation routes, and catch-all cleanup are already in place. `/api/adp/[...path]` is now pure legacy passthrough only. We want to continue from the remaining legacy passthrough usage audit.”

## Notes
This handoff reflects the latest completed state from the long session and is meant to avoid re-deriving the architecture from scratch.
