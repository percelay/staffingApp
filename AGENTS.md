<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before changing framework behavior, and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repo Entry Point

Read `CLAUDE.md` before making architectural changes. It is the source of truth for the current codebase shape.

## Non-Negotiable Repo Rules

- Use the `src/server/` boundary for server-side work:
  - repositories own Prisma
  - services own workflows
  - serializers own DTO mapping
  - schemas own request validation
- Do not query Prisma directly from pages or client components.
- Shared DTOs and enums live in `src/lib/contracts/*`; `src/lib/types/*` is for UI-facing helpers.
- Keep DTOs in snake_case at the API/frontend boundary.
- New route handlers should use:
  - `withAuth()` from `src/lib/api/rbac.ts`
  - `parseRequestBody()` from `src/server/http.ts`
  - `RouteContext<'/api/...'>` with awaited `ctx.params`
- Dashboard data hydrates through `/api/bootstrap` inside `src/lib/stores/store-provider.tsx`.
- Client stores should use typed API clients from `src/lib/api/resources/*`, not inline `fetch()` calls.
- Demo-vs-database selection happens in `src/server/services/bootstrap-service.ts`, not inside individual stores.
- Canonical demo/seed data lives in `src/server/demo/seed-data.ts`; keep Prisma seed paths aligned with it.
- ESLint guardrails enforce: no `@/lib/db` outside repositories and no repository imports inside route handlers.

## Documentation Rule

If you materially change architecture, bootstrap flow, route conventions, or the state/data boundary, update `CLAUDE.md` and keep this file aligned.
