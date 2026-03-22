# ADP Legacy Passthrough Usage Audit

Date: 2026-03-12

## 1. Findings summary

`/api/adp/[...path]` is now a pure legacy passthrough route, but first-party runtime traffic still reaches it from a small number of active product flows.

### Active first-party runtime dependencies on `/api/adp`
- `POST /api/adp/agents`
  - `src/app/app/onboarding/consumer/page.tsx` via `ADPClient.register()`
  - `src/app/app/onboarding/provider/page.tsx` via `ADPClient.register()`
  - `src/app/register/page.tsx` via a direct `fetch(`${API_BASE}/agents`, ...)`
- `POST /api/adp/services/match`
  - `src/app/app/consumer/page.tsx` via `ADPClient.matchServices()`
- `GET /api/adp/agents/:did/inbox`
  - `src/app/app/provider/page.tsx` via the legacy branch of `ADPClient.getInbox()`
- `POST /api/adp/agents/:did/inbox`
  - `src/app/app/provider/page.tsx` via the legacy branch of `ADPClient.respondToInbox()`

### No longer active as visible first-party runtime flows
These still exist in `ADPClient`, but no current first-party callers were found:
- `GET /api/adp/agents` via `getAgents()`
- `POST /api/adp/capabilities` via `addCapability()`
- `GET /api/adp/capabilities` via `getCapabilities()`
- `GET /api/adp/discover` via `discover()`

### Important distinction
Removing `/api/adp/[...path]` is not the same thing as removing all legacy backend coupling.
Some explicit app-local routes still proxy directly to `https://www.bidz.nl/api/adp/v1`, for example:
- `src/app/api/app/negotiations/[id]/route.ts`
- owner-private/auth helpers that still talk to the legacy backend directly

Those are not catch-all usages, but they are still relevant if the broader long-term goal is total legacy backend decoupling.

### Main conclusion
The remaining blockers for deleting `/api/adp/[...path]` are:
- agent registration
- service matching
- legacy provider inbox read/respond

The cleanest next migration target is still `matchServices()`, because it is a bounded user-facing flow with one visible caller and no mixed compat/legacy semantics.

## 2. Reference inventory table

## Runtime and internal references that still matter for passthrough removal

| File path | Component / hook / client using it | Exact endpoint path | Purpose | Read / write | User-facing / internal | Current classification | Recommended action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `src/app/app/lib/adp-client.ts` | `ADPClient` transport base (`ADP_BASE`) | base path `/api/adp` | Shared legacy transport base for all `request(...)` calls and `register()` | Mixed | Internal runtime infrastructure | Intentionally needed legacy infrastructure | Remove only after all remaining `/api/adp` callers are migrated or deleted |
| `src/app/app/lib/adp-client.ts` | `ADPClient.register()` | `POST /api/adp/agents` | Agent registration during app onboarding | Write | User-facing | Intentionally needed legacy flow | Migrate to an explicit app-local registration route |
| `src/app/app/onboarding/consumer/page.tsx` | `handleRegister()` | `POST /api/adp/agents` via `ADPClient.register()` | Consumer onboarding registration | Write | User-facing | Intentionally needed legacy flow | Migrate together with `ADPClient.register()` |
| `src/app/app/onboarding/provider/page.tsx` | `handleRegister()` | `POST /api/adp/agents` via `ADPClient.register()` | Provider onboarding registration plus initial capability payload | Write | User-facing | Intentionally needed legacy flow | Migrate together with `ADPClient.register()` |
| `src/app/register/page.tsx` | `RegisterProviderPage` direct fetch | `POST /api/adp/agents` | Public provider registration landing page | Write | User-facing | Intentionally needed legacy flow | Migrate off direct `/api/adp` use; ideally converge on the same explicit registration route as onboarding |
| `src/app/app/lib/adp-client.ts` | `ADPClient.matchServices()` | `POST /api/adp/services/match` | Consumer service matching/search | Write | User-facing | Intentionally needed legacy flow | Safest next migration target: move to explicit app-local route |
| `src/app/app/consumer/page.tsx` | `handleSearch()` | `POST /api/adp/services/match` via `ADPClient.matchServices()` | Main consumer search flow | Write | User-facing | Intentionally needed legacy flow | Migrate this caller and `ADPClient.matchServices()` together |
| `src/app/app/lib/adp-client.ts` | `ADPClient.getInbox()` legacy branch | `GET /api/adp/agents/:did/inbox` | Read provider legacy inbox items when no compat session path is used | Read | User-facing | Intentionally needed legacy flow | Requires product/runtime decision: keep legacy inbox support behind an explicit route or retire legacy inbox path |
| `src/app/app/provider/page.tsx` | `fetchInbox()` | `GET /api/adp/agents/:did/inbox` via `ADPClient.getInbox()` when no `protocolSessionId` | Provider dashboard polling for legacy inbox items | Read | User-facing | Intentionally needed legacy flow | Migrate only after deciding whether legacy provider inbox remains supported |
| `src/app/app/lib/adp-client.ts` | `ADPClient.respondToInbox()` legacy branch | `POST /api/adp/agents/:did/inbox` | Respond to legacy provider inbox items | Write | User-facing | Intentionally needed legacy flow | Same migration boundary as legacy inbox read path |
| `src/app/app/provider/page.tsx` | `handleRespond()` | `POST /api/adp/agents/:did/inbox` via `ADPClient.respondToInbox()` for non-compat items | Provider accepts/rejects/counters legacy inbox items | Write | User-facing | Intentionally needed legacy flow | Same migration boundary as legacy inbox read path |
| `src/app/app/lib/adp-client.ts` | `ADPClient.getAgents()` | `GET /api/adp/agents` | Legacy agent listing client method | Read | Internal client API | Dead leftover | Remove after one final repo-wide verification |
| `src/app/app/lib/adp-client.ts` | `ADPClient.addCapability()` | `POST /api/adp/capabilities` | Legacy capability creation client method | Write | Internal client API | Dead leftover | Remove after one final repo-wide verification |
| `src/app/app/lib/adp-client.ts` | `ADPClient.getCapabilities()` | `GET /api/adp/capabilities` | Legacy capability listing client method | Read | Internal client API | Dead leftover | Remove after one final repo-wide verification |
| `src/app/app/lib/adp-client.ts` | `ADPClient.discover()` | `GET /api/adp/discover` | Legacy discovery client method | Read | Internal client API | Dead leftover | Remove after one final repo-wide verification |
| `src/app/api/adp/[...path]/route.ts` | Catch-all passthrough route | all `/api/adp/*` paths | Pure proxy to legacy ADP backend | Mixed | Internal server infrastructure | Intentionally needed legacy infrastructure | Delete only after all active callers above are removed |

## Non-runtime references explicitly excluded from the removal blocker list

These are references to `/api/adp` or `adp/v2` in docs, examples, review notes, or UI copy. They are not first-party runtime dependencies for the catch-all removal decision.

| File path | Reference type | Example | Why excluded |
| --- | --- | --- | --- |
| `src/components/protocol.tsx` | docs UI | `/api/adp/v2/...` endpoint list | Protocol documentation surface, not runtime caller of the legacy passthrough |
| `src/app/protocol/page.tsx` | docs UI copy | `/api/adp/v2` | Informational only |
| `src/app/openclaw/page.tsx` | docs/examples | `curl https://www.agentdiscovery.io/api/adp/v2/...` | Example commands only |
| `[review]/adp-handoff-current-state.md` | review note | mentions `/api/adp/[...path]` | Handoff documentation only |
| `[review]/adp-vs-2.md` | design note | `/api/adp/v2/...` | Design/spec note only |
| `[review]/ADP-Frits-Configuratie.md` | review note | `https://www.bidz.nl/api/adp/v1` | Configuration documentation only |

## 3. Migration candidates

### Best next migration target
- `src/app/app/lib/adp-client.ts` -> `matchServices()`
- `src/app/app/consumer/page.tsx` -> `handleSearch()`

Why this is the safest next step:
- one visible first-party caller
- clear endpoint surface: `POST /api/adp/services/match`
- bounded consumer search flow
- no mixed compat/legacy branching inside the caller
- does not disturb onboarding or provider legacy inbox decisions

### Strong follow-up candidate
- registration
  - `src/app/app/lib/adp-client.ts` -> `register()`
  - `src/app/app/onboarding/consumer/page.tsx`
  - `src/app/app/onboarding/provider/page.tsx`
  - `src/app/register/page.tsx`

Why second instead of first:
- three active call sites instead of one
- likely tighter coupling to existing v1 response shape and onboarding expectations
- public marketing registration page and app onboarding probably need a shared new explicit route or consciously separate routes

### Product-sensitive migration candidate
- legacy provider inbox read/respond
  - `src/app/app/lib/adp-client.ts` -> `getInbox()` legacy branch and `respondToInbox()` legacy branch
  - `src/app/app/provider/page.tsx`

Why it is not the safest next step:
- current provider dashboard intentionally still supports legacy inbox items
- read and action semantics are linked
- any migration should follow a product decision:
  - keep legacy provider inbox behavior behind an explicit route
  - or retire legacy provider inbox support from the UI

## 4. Dead leftovers

Visible dead leftovers in the current first-party app surface:
- `src/app/app/lib/adp-client.ts` -> `getAgents()`
- `src/app/app/lib/adp-client.ts` -> `addCapability()`
- `src/app/app/lib/adp-client.ts` -> `getCapabilities()`
- `src/app/app/lib/adp-client.ts` -> `discover()`

No visible first-party callers were found for these methods in the audited app code.

They are good cleanup candidates, but removing them does not materially advance catch-all deletion until the active flows are migrated.

## 5. Safe removal sequence

### Phase 1: migrate service matching off `/api/adp`
Change only:
- `src/app/app/lib/adp-client.ts` -> `matchServices()`
- `src/app/app/consumer/page.tsx`
- add one explicit app-local route for service matching

Result:
- removes one central user-facing legacy dependency
- no impact on onboarding or provider inbox

### Phase 2: decide legacy provider inbox product stance
Choose one:
- keep legacy inbox support, but move it to an explicit app-local route
- retire legacy provider inbox support from the provider UI

Then migrate/remove together:
- `src/app/app/lib/adp-client.ts` -> `getInbox()` legacy branch
- `src/app/app/lib/adp-client.ts` -> `respondToInbox()` legacy branch
- `src/app/app/provider/page.tsx`

### Phase 3: migrate registration off `/api/adp/agents`
Change together:
- `src/app/app/lib/adp-client.ts` -> `register()`
- `src/app/app/onboarding/consumer/page.tsx`
- `src/app/app/onboarding/provider/page.tsx`
- `src/app/register/page.tsx`

Preferred shape:
- one explicit app-local registration route if consumer onboarding, provider onboarding, and public provider registration should share one contract
- otherwise two explicit routes with intentionally separate contracts

### Phase 4: remove dead `ADPClient` leftovers
Remove after one final search-based verification:
- `getAgents()`
- `addCapability()`
- `getCapabilities()`
- `discover()`

### Phase 5: remove `/api/adp/[...path]`
Delete:
- `src/app/api/adp/[...path]/route.ts`
- the remaining `ADP_BASE = '/api/adp'` dependency pattern in `ADPClient`

Precondition:
- no first-party runtime callers remain on `/api/adp/*`

## 6. Exact files that should be changed first

For the smallest safe next implementation boundary:
- `src/app/app/lib/adp-client.ts`
- `src/app/app/consumer/page.tsx`
- new explicit app-local route for service matching

For the next major boundary after that:
- `src/app/app/lib/adp-client.ts`
- `src/app/app/onboarding/consumer/page.tsx`
- `src/app/app/onboarding/provider/page.tsx`
- `src/app/register/page.tsx`
- new explicit app-local registration route(s)

For the provider legacy inbox decision boundary:
- `src/app/app/lib/adp-client.ts`
- `src/app/app/provider/page.tsx`
- optional new explicit app-local legacy inbox route if legacy provider inbox support is kept

## Search patterns used

### Code search query
- `Find all first-party references to /api/adp and all ADPClient methods that still hit the legacy passthrough. Distinguish runtime callers from docs/examples/comments/tests. Return files for ADPClient, onboarding, consumer search, provider inbox, and any direct fetch('/api/adp') usage.`

### Ripgrep-style patterns used
- `/api/adp`
- `new ADPClient\(|ADPClient\.register\(`
- `fetch\((` + "`" + `|"|')/api/adp`
- `return this.request\(|fetch\(\`\$\{ADP_BASE\}`
- `getAgents\(|addCapability\(|getCapabilities\(|discover\(|matchServices\(|getInbox\(|respondToInbox\(|getStats\(`
- `API_BASE|fetch\(|axios|request\(`

## Shortest safe path to full catch-all removal

The shortest safe path remains:
1. move `matchServices()` off `/api/adp`
2. resolve the legacy provider inbox product decision and migrate or retire that path
3. move all registration flows off `/api/adp/agents`
4. remove dead legacy `ADPClient` methods
5. delete `src/app/api/adp/[...path]/route.ts`

This keeps the established architecture intact:
- owner-private control plane remains separate
- ServiceRecord remains source of truth
- manifest remains derived projection
- provider scope remains server-authoritative
- no catch-all shims are reintroduced
- explicit app routes remain the preferred replacement shape
