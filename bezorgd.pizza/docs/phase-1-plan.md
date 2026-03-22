# bezorgd.pizza Phase 1 Plan

## Goal

Build a convincing standalone `bezorgd.pizza` product foundation with a warm public experience, a minimal provider workspace, and only the smallest necessary ADP/core footprint.

## Phase 1 Build Order

### Step 1

#### Goal

Create the branded public shell and repo foundations.

#### Files and folders

- `src/app/(public)/layout.tsx`
- `src/app/globals.css`
- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `src/features/brand/`
- `public/images/pizza/`
- `public/og/`
- `src/lib/public-routing/`
- `src/lib/env/`

#### Acceptance criteria

- a branded public layout exists
- header and footer structure exist
- global public styling baseline exists
- metadata foundations exist
- `robots.ts` and `sitemap.ts` exist
- no provider workspace UI is mixed into the public layout
- the public layer feels product-like, not like a SaaS dashboard

### Step 2

#### Goal

Build the homepage as the primary branded entry point.

#### Files and folders

- `src/app/(public)/page.tsx`
- `src/features/brand/components/`
- `src/features/brand/content/`
- `src/features/restaurants/components/`

#### Acceptance criteria

- homepage has a clear hero section
- homepage includes a postcode/search entry point
- homepage includes trust or explanation sections
- homepage points users toward restaurant discovery
- tone is warm, local, and no-nonsense
- there is no generic SaaS framing on the page

### Step 3

#### Goal

Build public restaurant discovery and restaurant detail/menu pages.

#### Files and folders

- `src/app/(public)/restaurants/page.tsx`
- `src/app/(public)/restaurants/[slug]/page.tsx`
- `src/app/api/public/restaurants/route.ts`
- `src/app/api/public/restaurants/[slug]/route.ts`
- `src/app/api/public/discover/route.ts`
- `src/features/restaurants/view-models/`
- `src/features/restaurants/queries/`
- `src/lib/public-routing/`
- `src/lib/local-food/`

#### Acceptance criteria

- public restaurant list route exists
- public restaurant detail route exists
- restaurant lookup works through slug-based routing
- menu data is rendered from the local-food domain layer
- only valid public restaurants are shown
- postcode discovery is connected or clearly scaffolded for connection

### Step 4

#### Goal

Build the checkout/order submission flow.

#### Files and folders

- `src/app/(public)/bestellen/[slug]/page.tsx`
- `src/app/api/public/orders/route.ts`
- `src/features/checkout/components/`
- `src/features/checkout/forms/`
- `src/features/checkout/state/`
- `src/lib/local-food/`

#### Acceptance criteria

- users can review a restaurant order context
- cart state exists
- customer details form exists
- postcode and fulfilment mode are supported
- order submission path exists
- success and error states are shown clearly
- payment is explicitly placeholder-only in phase 1

### Step 5

#### Goal

Build the minimal provider workspace shell.

#### Files and folders

- `src/app/(workspace)/layout.tsx`
- `src/app/(workspace)/login/page.tsx`
- `src/app/(workspace)/provider/page.tsx`
- `src/app/(workspace)/provider/menu/page.tsx`
- `src/app/(workspace)/provider/orders/page.tsx`
- `src/app/(workspace)/provider/settings/page.tsx`
- `src/features/provider-workspace/components/`
- `src/features/provider-workspace/forms/`
- `src/features/provider-workspace/queries/`
- `src/app/api/provider/profile/route.ts`
- `src/app/api/provider/menu/route.ts`
- `src/app/api/provider/menu/[itemId]/route.ts`
- `src/app/api/provider/orders/route.ts`
- `src/app/api/provider/orders/[orderId]/route.ts`

#### Acceptance criteria

- workspace layout exists separately from the public layout
- provider overview page exists
- menu management entry exists
- orders page exists
- settings placeholder exists
- provider state is scoped away from the public layer
- visual polish can be minimal, but structure must be clear and usable

### Step 6

#### Goal

Stabilize the local-food and persistence foundations used by public and workspace flows.

#### Files and folders

- `src/lib/local-food/local-food-types.ts`
- `src/lib/local-food/local-food-service.ts`
- `src/lib/local-food/local-food-provider-repository.ts`
- `src/lib/local-food/local-food-menu-item-repository.ts`
- `src/lib/local-food/local-food-order-repository.ts`
- `src/lib/local-food/local-food-payment.ts`
- `src/lib/local-food/local-food-postcode.ts`
- `src/lib/local-food/local-food-menu-import.ts`
- `src/lib/db/client.ts`
- `src/lib/db/schema/`
- `src/lib/db/repositories/`

#### Acceptance criteria

- local-food domain files exist with clear ownership
- repository naming is consistent
- db structure is explicit
- domain rules are not leaking into UI files
- public and provider APIs share the same domain rules where relevant

## Phase 1 Success Definition

Phase 1 is successful when:

- `bezorgd.pizza` has a clear branded public product shell
- a visitor can discover restaurants and open a menu page
- a visitor can go through a basic order submission flow
- a provider can access a minimal workspace shell
- the public product does not feel like a SaaS dashboard
- the codebase remains cleanly split between brand, local-food, ADP/core, and DB concerns

## Explicit Non-Goals for Phase 1

- full payment integration
- real-time delivery tracking
- advanced runtime orchestration
- deep protocol-heavy ADP experiences
- overbuilt auth architecture
- overbuilt multi-brand abstractions
- over-engineered routing systems

## Implementation Notes

- prefer simple route handlers over early abstraction layers
- keep ADP/core minimal and supporting only real phase-1 needs
- keep local-food reusable and free of `bezorgd.pizza` brand assumptions
- keep public UX warm, local, and direct
- default to clarity over cleverness
