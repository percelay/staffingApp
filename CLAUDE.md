# StaffingHub

This file is the current source of truth for repository architecture and engineering conventions.
`AGENTS.md` is the short agent entrypoint and should stay aligned with this document.

## Critical Next.js Note

This repo uses Next.js 16 App Router. APIs, conventions, and route handler signatures may differ from older versions.
Before changing framework-level behavior, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.

## Product Summary

Visual staffing tool for consulting firms. The app assigns consultants to engagements, tracks utilization and burnout risk, manages opportunity scenarios, and provides an executive staffing summary.

## Commands

```bash
npm run dev        # Start Next.js dev server
npm run build      # prisma generate + next build
npm run lint       # ESLint
npm run test:run   # Run Vitest suite once
npm run db:push    # Push Prisma schema to the database
npm run db:seed    # Seed database via prisma/seed.ts
npm run db:studio  # Open Prisma Studio
npm run db:generate
```

## Environment

- Copy `.env.example` to `.env`
- Production data requires `DATABASE_URL` for PostgreSQL
- The app can still boot without a DB: `/api/bootstrap` falls back to deterministic demo data from `src/lib/data/seed.ts` and `src/lib/data/opportunity-seed.ts`

## Tech Stack

- Next.js 16.2.1 App Router
- React 19
- TypeScript 5
- Prisma 6 + PostgreSQL
- Zustand 5
- Tailwind CSS v4
- shadcn/ui
- D3.js
- Framer Motion
- date-fns
- Vitest

## Current Architecture

### High-Level Flow

```text
Browser
  -> auth store adds X-User-* headers
  -> dashboard StoreProvider calls /api/bootstrap
  -> route handlers call src/server/services/*
  -> services use repositories + serializers + schemas
  -> repositories are the only Prisma boundary
```

### Layout / Boot Flow

- `src/app/layout.tsx` is global shell only. It does not hydrate staffing data.
- `src/app/(dashboard)/layout.tsx` auth-guards dashboard routes and mounts `StoreProvider` keyed by `currentUser.id`.
- `src/lib/stores/store-provider.tsx` hydrates all domain stores from `/api/bootstrap` and resets them on logout.
- `src/server/services/bootstrap-service.ts` decides whether the source is `database` or `demo`.

### Server Boundary

All server-side business logic should flow through `src/server/`:

- `src/server/repositories/` owns Prisma access
- `src/server/services/` owns workflows and orchestration
- `src/server/serializers/` owns DTO mapping
- `src/server/schemas/` owns request validation
- `src/server/http.ts` contains shared request/error helpers

Do not query Prisma directly from pages, client components, or ad hoc route logic. Extend the repository/service layer instead.

### DTO / Casing Convention

| Layer | Casing | Example |
|---|---|---|
| Prisma / DB | camelCase | `clientName`, `allocationPercentage` |
| API DTOs + frontend types | snake_case | `client_name`, `allocation_percentage` |

Rules:

- Reuse serializers from `src/server/serializers/staffing.ts`
- Reuse request schemas from `src/server/schemas/staffing.ts`
- `src/lib/api/transformers.ts` is now just a compatibility re-export layer
- Keep the snake_case DTO boundary stable unless doing an intentional broad migration

### Route Handler Conventions

All API routes live under `src/app/api/` and use route handlers, not server actions.

Current resources:

- `assignments`
- `bootstrap`
- `consultants`
- `engagements`
- `executive-summary`
- `opportunities`
- `proposals`
- `seed`
- `skills`
- `wellbeing`

Nested routes also exist for consultant goals/skills and opportunity scenarios.

Handler rules:

- Export `const dynamic = 'force-dynamic'`
- Use `withAuth()` from `src/lib/api/rbac.ts`
- Use `parseRequestBody()` from `src/server/http.ts`
- Use `RouteContext<'/api/...'>` and await `ctx.params`

Example:

```ts
export const PATCH = withAuth(
  'consultants',
  async (
    request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/consultants/[id]'>
  ) => {
    const { id } = await ctx.params;
    const input = await parseRequestBody(request, consultantUpdateSchema);
    // ...
  }
);
```

### State Management

Zustand is still the client state layer, but it now has clearer responsibilities:

- `useAuthStore` and `useUIStore` own session/UI state
- Domain stores are thin API-backed caches
- Demo-vs-database selection happens once during bootstrap, not independently inside each store

Primary stores:

- `src/lib/stores/auth-store.ts`
- `src/lib/stores/app-store.ts`
- `src/lib/stores/consultant-store.ts`
- `src/lib/stores/engagement-store.ts`
- `src/lib/stores/assignment-store.ts`
- `src/lib/stores/wellbeing-store.ts`
- `src/lib/stores/opportunity-store.ts`
- `src/lib/stores/proposal-store.ts`

## Current Routes

Dashboard pages:

- `/executive`
- `/manage`
- `/opportunities`
- `/opportunities/[id]`
- `/staffing`
- `/timeline`

Other pages:

- `/`
- `/login`

There is no longer a `/graph` route.

## Domain Model

- **Consultant**: staffing resource with skills, goals, seniority, practice area, and `status`
- **Engagement**: active/upcoming/completed/at_risk client work with required skills
- **Assignment**: consultant-to-engagement allocation with date range and role
- **WellbeingSignal**: burnout indicators such as `overwork`, `weekend_work`, `no_break`, `high_travel`
- **Opportunity**: pipeline item with scenario planning
- **Scenario / TentativeAssignment**: proposed staffing plans for an opportunity
- **Proposal / ProposalSlot**: recommended engagement team composition

Important computed concepts:

- Utilization is derived from active assignments and never stored
- Burnout risk is computed in `src/lib/utils/burnout.ts`
- Executive metrics are centralized in `src/lib/selectors/executive.ts`

## Auth / Access

- Auth is still demo auth via `src/lib/stores/auth-store.ts`
- Current demo users:
  - Sarah Chen (`partner`)
  - James Rivera (`manager`)
- API authorization is enforced by `src/lib/api/rbac.ts`

## Data / UX Conventions

- Path alias: `@/*` -> `src/*`
- Frontend dates use ISO strings like `YYYY-MM-DD`
- Prisma client is generated to `src/generated/prisma/`
- Consultant delete is soft delete (`status -> departed`)
- Engagement delete is hard delete
- Opportunity detail is implemented in `src/components/opportunities/opportunity-detail.tsx` and mounted by the route page

## Testing / Verification

Current verification baseline:

- `npm run test:run`
- `npm run build`
- `npm run lint`

Focused regression tests were added for:

- bootstrap source selection
- shared executive summary calculations
- DTO serialization
- route-level auth/service integration for key endpoints

## Maintenance Notes

- Keep `CLAUDE.md` current when architecture changes materially
- Keep `AGENTS.md` short and directive; avoid duplicating the full architecture there
- If you change the data layer shape, update serializers, schemas, stores, and tests together
