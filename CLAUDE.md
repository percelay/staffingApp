@AGENTS.md

# StaffingHub

Visual staffing tool for consulting firms. Assigns consultants to engagements, tracks utilization/burnout, and visualizes team capacity across 4 views.

## Commands

```bash
npm run dev              # Start dev server
npm run build            # prisma generate + next build
npm run db:push          # Push schema to DB (no migration files)
npm run db:seed          # Seed DB via prisma/seed.ts (uses tsx)
npm run db:studio        # Open Prisma Studio GUI
npm run db:generate      # Regenerate Prisma client
```

Env: copy `.env.example` to `.env`. Requires `DATABASE_URL` (PostgreSQL). App works without a DB — falls back to Faker seed data (deterministic, seeded with 42).

## Tech Stack

Next.js 16.2.1 (App Router) · React 19 · TypeScript 5 · Prisma 6 (PostgreSQL) · Zustand 5 · Tailwind CSS v4 · shadcn/ui (base-nova) · D3.js + react-force-graph-2d · Framer Motion · date-fns · Lucide icons

## Architecture

### Data Flow

```
Browser → Zustand stores → fetch('/api/...') → Route handlers → Prisma → PostgreSQL
                                                      ↓
                                          transformers.ts (camelCase → snake_case)
```

**StoreProvider** (`src/lib/stores/store-provider.tsx`) hydrates all stores on mount: tries API first, falls back to in-memory Faker data if API/DB unavailable.

### Casing Convention (CRITICAL)

| Layer | Casing | Example |
|-------|--------|---------|
| Prisma / DB | camelCase | `clientName`, `allocationPercentage` |
| Frontend types + API responses | snake_case | `client_name`, `allocation_percentage` |

Every API route **must** use transformers from `src/lib/api/transformers.ts` (`toConsultantDTO`, `toEngagementDTO`, `toAssignmentDTO`, `toWellbeingDTO`) before returning data. Request bodies arrive in snake_case and must be manually mapped to camelCase for Prisma.

### API Routes

All under `src/app/api/`. Every route exports `const dynamic = 'force-dynamic'`. No server actions — all mutations via REST API routes.

**Route handler signature (Next.js 16)** — `RouteContext` is a global type (no import needed):
```ts
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/consultants/[id]'>
) {
  const { id } = await ctx.params;  // params is a Promise — must await
}
```

Resources: consultants, engagements, assignments, proposals, skills, wellbeing, seed

### State Management

Zustand stores in `src/lib/stores/`. Each domain store has: `items[]`, `loading`, `setItems()`, `fetch*()`, selectors, and optimistic mutation methods.

- `useAuthStore` — demo auth only (2 hardcoded users: Sarah Chen/partner, James Rivera/manager). No real auth.
- `useUIStore` — view state, filters, drawers, timeline offset

### Routes

| Path | View | Description |
|------|------|-------------|
| `/login` | Login | Demo user picker |
| `/timeline` | Timeline | Gantt-like swimlane chart (default) |
| `/graph` | Graph | D3 force-directed network |
| `/staffing` | Staffing | Drag-drop assignment workspace |
| `/manage` | People | Consultant/engagement CRUD |

All dashboard routes are auth-guarded in `(dashboard)/layout.tsx`. `template.tsx` adds Framer Motion page transitions.

### Domain Model

- **Consultant** — person with skills (many-to-many), practice area, seniority level
- **Engagement** — client project with date range, required skills, status
- **Assignment** — links consultant to engagement with `allocation_percentage` (0–100%). Utilization = sum of active allocations (computed, never stored)
- **WellbeingSignal** — burnout indicators (overwork, weekend_work, no_break, high_travel)
- **Proposal / ProposalSlot** — suggested team composition for an engagement

Burnout score (0–100) computed from 4 factors. See `src/lib/utils/burnout.ts`.

## Conventions

- **Path alias**: `@/*` → `./src/*`
- **Dates**: ISO strings (`YYYY-MM-DD`) in frontend; `@db.Date` in Prisma
- **Prisma client**: generated to `src/generated/prisma/` (gitignored, regenerated on build)
- **shadcn components**: `src/components/ui/` — add new ones with `npx shadcn@latest add <component>`, don't edit existing ones directly
- **D3 / force-graph**: must use `dynamic()` with `{ ssr: false }`
- **Deletes**: consultant DELETE is soft-delete (status → `departed`); engagement DELETE is hard-delete with cascade
- **Component files**: PascalCase. Store files: camelCase with `use*` prefix. Type files: snake_case interfaces
