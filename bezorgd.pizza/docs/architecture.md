# bezorgd.pizza Architecture

## Overview

`bezorgd.pizza` is a standalone product repository.

The repo is structured as a consumer-facing pizza product with an internal provider workspace, built on a small reusable domain foundation.

The core principle is:

- **public product first**
- **provider workspace second**
- **ADP/core minimal in phase 1**
- **warm, local, no-nonsense UX on the public layer**

The product should feel like a local pizza ordering brand, not like a protocol demo or SaaS dashboard.

## Core Architecture

The repository is divided into four architectural layers.

### 1. Brand layer

The brand layer contains all public-facing `bezorgd.pizza` product experience.

It owns:

- homepage
- restaurant discovery UX
- restaurant and menu pages
- checkout flow
- city pages
- SEO metadata and route presentation
- visual design, copy, and tone

This layer is responsible for the warm, local, straightforward `bezorgd.pizza` experience.

It must not contain:

- order state machine rules
- persistence logic
- provider visibility rules
- auth primitives
- generic runtime abstractions

Primary folders:

- `src/app/(public)/`
- `src/features/brand/`
- `src/features/restaurants/`
- `src/features/checkout/`

### 2. Local-food domain layer

The local-food layer contains the reusable pizza/local-food business rules.

It owns:

- provider records
- menu records
- order records
- postcode matching
- provider launch readiness
- public provider visibility rules
- fulfilment mode validation
- order creation and status transitions
- payment placeholder logic
- menu import helpers

This layer should stay reusable and should not know about `bezorgd.pizza` branding.

It must not contain:

- homepage structure
- brand copy
- city landing page text
- branded metadata
- route presentation decisions

Primary folder:

- `src/lib/local-food/`

### 3. ADP/core layer

The ADP/core layer stays intentionally small in phase 1.

It exists to support the product where needed, without turning the repo into a protocol-heavy codebase.

It owns only the minimum needed for:

- identity concepts
- profile projections/defaults
- owner/private auth support for provider workspace scope
- future runtime integration points
- thin client abstractions if needed

It must not contain:

- pizza-specific UI
- public brand concerns
- menu UX
- checkout UX
- unnecessary runtime or negotiation complexity in phase 1

Primary folder:

- `src/lib/adp/`

### 4. DB/persistence layer

The DB layer contains storage plumbing and repository support.

It owns:

- database client bootstrapping
- schema definitions
- repository persistence helpers
- migration-facing persistence structure

It should stay explicit and boring.

It must not contain:

- brand logic
- UI view models
- route logic
- local-food business rules beyond persistence boundaries

Primary folder:

- `src/lib/db/`

## Repo Structure

```text
bezorgd.pizza/
├─ docs/
│  ├─ architecture.md
│  └─ phase-1-plan.md
├─ public/
│  ├─ images/
│  │  └─ pizza/
│  ├─ icons/
│  └─ og/
├─ src/
│  ├─ app/
│  │  ├─ (public)/
│  │  ├─ (workspace)/
│  │  ├─ api/
│  │  ├─ globals.css
│  │  ├─ robots.ts
│  │  └─ sitemap.ts
│  ├─ features/
│  │  ├─ brand/
│  │  ├─ restaurants/
│  │  ├─ checkout/
│  │  └─ provider-workspace/
│  ├─ lib/
│  │  ├─ adp/
│  │  ├─ local-food/
│  │  ├─ public-routing/
│  │  ├─ db/
│  │  ├─ env/
│  │  └─ utils/
│  ├─ types/
│  └─ middleware.ts
└─ package.json
```

## Boundary Rules

### Brand vs local-food

- Brand decides **how the product is presented**.
- Local-food decides **what is allowed in the food-ordering domain**.

Examples:

- `brand`: hero text, CTA labels, restaurant cards, city landing page content
- `local-food`: who is public, how postcode matching works, whether an order is valid

### Local-food vs ADP/core

- Local-food is the vertical business layer.
- ADP/core is a thin supporting foundation.

Examples:

- `local-food`: provider activation checklist, menu categories, order statuses
- `adp`: provider identity, profile defaults, private owner scope support

### Local-food vs DB

- Local-food contains business rules.
- DB contains storage and repository plumbing.

Examples:

- `local-food`: validate provider activation before go-live
- `db`: save provider snapshot, load menu items, persist order rows

### Brand vs DB

There should be no direct coupling.

The public product layer should consume read models or view models, not raw persistence logic.

## Phase 1 Scope

Phase 1 is the smallest credible version of `bezorgd.pizza` as a standalone branded product.

### Included in phase 1

#### Public product

- branded public layout
- homepage
- postcode-based discovery entry
- restaurants overview page
- restaurant detail/menu page
- checkout/order submit flow
- warm, local, no-nonsense public UX
- `robots.ts`
- `sitemap.ts`
- basic public metadata
- slug-based public routing support

#### Provider workspace

- minimal workspace shell
- provider overview page
- provider menu management page
- provider orders page
- provider settings placeholder
- provider-scoped access shape
- launch readiness/checklist surfacing

#### Domain and infrastructure

- local-food provider/menu/order domain
- public discovery rules
- order validation and order status transitions
- payment placeholder only
- explicit `src/lib/public-routing/`
- explicit `src/lib/db/` structure
- consistent repository naming

## What is deliberately not in phase 1

The following items are intentionally deferred.

### Product and UX

- real payment provider integration
- live order tracking
- customer accounts as a hard requirement
- advanced multi-city SEO scale-out
- analytics dashboards
- restaurant self-serve polish beyond the basic workspace

### Platform and architecture

- heavy runtime abstractions
- protocol-heavy negotiation UI
- multi-brand architecture
- over-engineered routing systems
- over-engineered auth layers
- over-engineered service boundaries
- deep ADP runtime integration beyond what phase 1 needs

## Architectural Priorities

The implementation should optimize for:

- fast path to a convincing public product
- simple and explicit code ownership
- reusable local-food business logic
- minimal ADP/core footprint in phase 1
- clear file boundaries
- low brand-to-domain coupling
- no SaaS feeling on the public layer

## Practical Build Direction

The build order should follow this sequence:

1. public shell
2. homepage
3. restaurants and menu pages
4. checkout flow
5. provider workspace shell

This keeps the strongest energy on the consumer-facing product while still preparing the provider side for launch.
