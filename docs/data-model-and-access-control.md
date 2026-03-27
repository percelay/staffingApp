# StaffingHub — Data Model & Access Control

## 1. System Overview

StaffingHub is a staffing management tool for consulting firms. It tracks **who** (consultants) is assigned to **what** (engagements), at **what capacity** (allocation percentage), and monitors **burnout risk** (wellbeing signals). All data lives in a PostgreSQL database accessed through Prisma ORM.

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Browser   │────▶│  Next.js API │────▶│   PostgreSQL     │
│  (React 19) │     │  Route Layer │     │   (via Prisma)   │
└─────────────┘     └──────────────┘     └─────────────────┘
       │                    │
  Zustand stores       RBAC middleware
  (client state)    (auth + permissions)
```

---

## 2. Data Model

### 2.1 Entity Relationship Diagram

```
┌──────────────┐        ┌──────────────────┐        ┌──────────────┐
│  Consultant  │───M:N──│ ConsultantSkill   │───M:N──│    Skill     │
│──────────────│        └──────────────────┘        │──────────────│
│ id           │                                     │ id           │
│ name         │        ┌──────────────────┐        │ name         │
│ role         │───M:N──│ EngagementSkill   │───M:N──│ category     │
│ practice_area│        └──────────────────┘        └──────────────┘
│ seniority    │
│ status       │        ┌──────────────────┐        ┌──────────────┐
│ avatar_url   │───1:N──│   Assignment     │──N:1───│  Engagement  │
└──────────────┘        │──────────────────│        │──────────────│
       │                │ role             │        │ id           │
       │                │ start_date       │        │ client_name  │
       │                │ end_date         │        │ project_name │
       │                │ allocation_%     │        │ start_date   │
       │                │ notes            │        │ end_date     │
       │                └──────────────────┘        │ status       │
       │                                            │ color        │
       │                                            └──────┬───────┘
       │                                                   │
       │                ┌──────────────────┐               │
       └───1:N──────────│ WellbeingSignal  │        ┌──────┴───────┐
                        │──────────────────│        │   Proposal   │
                        │ signal_type      │        │──────────────│
                        │ severity         │        │ fit_score    │
                        │ recorded_at      │        │ burnout_risk │
                        │ notes            │        │ created_at   │
                        └──────────────────┘        └──────┬───────┘
                                                           │
                                                    ┌──────┴───────┐
                                                    │ ProposalSlot │
                                                    │──────────────│
                                                    │ role         │
                                                    │ consultant_id│
                                                    │ required     │
                                                    │ sort_order   │
                                                    └──────────────┘
```

### 2.2 Entity Descriptions

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| **Consultant** | A person in the firm | `name`, `practice_area`, `seniority_level`, `status` (active/on_leave/departed) |
| **Engagement** | A client project | `client_name`, `project_name`, `start_date`, `end_date`, `status` |
| **Assignment** | Links consultant to engagement | `allocation_percentage` (0–100), `role`, date range |
| **Skill** | Normalized skill taxonomy | `name` (unique), `category` |
| **WellbeingSignal** | Burnout/stress indicator | `signal_type` (overwork, weekend_work, no_break, high_travel), `severity` |
| **Proposal** | Suggested team composition | `fit_score`, `burnout_risk`, linked `ProposalSlot[]` |

### 2.3 Key Computed Values

- **Utilization Rate** = `SUM(allocation_percentage)` across all active assignments for a consultant in a given week. Never stored — always computed on read.
- **Burnout Score** (0–100) = Weighted composite of wellbeing signal frequency and severity. Computed client-side from `src/lib/utils/burnout.ts`.

### 2.4 Deletion Behavior

| Entity | Delete Type | Cascade Behavior |
|--------|-------------|------------------|
| Consultant | **Soft delete** (status → `departed`) | Assignments preserved for historical reporting |
| Engagement | **Hard delete** | Cascades to assignments, proposals, engagement_skills |
| Assignment | **Hard delete** | No cascades |
| WellbeingSignal | **Hard delete** | No cascades |

---

## 3. Data Flow

### 3.1 Read Path (page load)

```
1. User logs in (selects demo user on /login)
2. Auth store sets currentUser { id, role, practice_area }
3. StoreProvider fires on mount:
     GET /api/consultants   ─┐
     GET /api/engagements   ─┤  All include X-User-Id + X-User-Role headers
     GET /api/assignments   ─┤
     GET /api/wellbeing     ─┘
4. RBAC middleware validates auth headers on each request
5. Prisma queries PostgreSQL
6. Transformers convert camelCase DB records → snake_case DTOs
7. Zustand stores hydrate with the response data
8. If API/DB unavailable → fallback to deterministic Faker seed data
```

### 3.2 Write Path (mutation)

```
1. User action (e.g., assign consultant to engagement)
2. Store method calls authFetch() with mutation payload
3. authFetch() injects X-User-Id and X-User-Role headers
4. API route handler:
     a. withAuth() extracts auth context from headers
     b. withAuth() checks RBAC permission matrix
     c. If forbidden → 403 response
     d. If allowed → Prisma writes to PostgreSQL
5. Transformer converts result → snake_case DTO
6. Store updates local state with server response
```

### 3.3 Casing Convention

| Layer | Casing | Reason |
|-------|--------|--------|
| PostgreSQL columns | snake_case | Database convention |
| Prisma models | camelCase | ORM convention (mapped via `@map`) |
| API responses | snake_case | Frontend convention |
| React components | snake_case | Matches API types |

The `transformers.ts` layer handles all Prisma → API conversions. Incoming request bodies arrive in snake_case and are manually mapped to camelCase for Prisma.

---

## 4. Access Control (RBAC)

### 4.1 Roles

| Role | Description | Typical User |
|------|-------------|--------------|
| **Partner** | Full access to all resources. Can create/delete engagements and consultants. | Senior leadership, practice leads |
| **Manager** | Operational access. Can manage assignments and update records, but cannot create or delete consultants or engagements. | Project managers, team leads |

### 4.2 Permission Matrix

| Resource | Action | Partner | Manager |
|----------|--------|:-------:|:-------:|
| **Consultants** | Read | Yes | Yes |
| | Create | Yes | **No** |
| | Update | Yes | Yes |
| | Delete (soft) | Yes | **No** |
| **Engagements** | Read | Yes | Yes |
| | Create | Yes | **No** |
| | Update | Yes | Yes |
| | Delete | Yes | **No** |
| **Assignments** | Read | Yes | Yes |
| | Create | Yes | Yes |
| | Update | Yes | Yes |
| | Delete | Yes | Yes |
| **Proposals** | Read | Yes | Yes |
| | Create | Yes | Yes |
| **Wellbeing** | Read | Yes | Yes |
| | Create | Yes | Yes |
| **Skills** | Read | Yes | Yes |
| **Seed (dev only)** | Create | Yes | **No** |

### 4.3 Enforcement Architecture

```
┌────────────────────┐
│   authFetch()      │  Client-side: injects X-User-Id + X-User-Role
│   (auth-fetch.ts)  │  headers into every API request
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│   withAuth()       │  Server-side: extracts headers, validates role,
│   (rbac.ts)        │  checks permission matrix, returns 401/403 if denied
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│   Route Handler    │  Business logic executes only after
│   (route.ts)       │  authorization passes
└────────────────────┘
```

**Key design decisions:**
- Auth context is transmitted via HTTP headers (`X-User-Id`, `X-User-Role`), making the API stateless and testable.
- Every API route is wrapped with `withAuth(resource, handler)` — there is no unauthenticated API access.
- Permission checks happen server-side. Client-side role checks (e.g., hiding buttons for managers) are UX conveniences, not security boundaries.

### 4.4 Authentication (Current: Demo Mode)

The current system uses hardcoded demo users for demonstration purposes. In production, this layer would be replaced with:
- **SSO/SAML** integration (e.g., Okta, Azure AD) for enterprise environments
- **JWT tokens** replacing the header-based auth context
- **Session management** with secure, httpOnly cookies

The RBAC permission layer is designed to work independently of the authentication mechanism — swapping the auth provider requires only changing `extractAuth()` in `rbac.ts`.

---

## 5. Data Sensitivity Classification

| Data Category | Sensitivity | Handling |
|--------------|-------------|----------|
| Consultant PII (name, avatar) | **Medium** | Display only within authenticated sessions |
| Engagement details (client name, project) | **High** | Client-confidential; no external exposure |
| Allocation percentages | **Medium** | Internal capacity data |
| Wellbeing/burnout signals | **High** | Employee health indicators; restricted to authorized roles |
| Skills taxonomy | **Low** | Non-sensitive reference data |

---

## 6. Production Readiness Checklist

| Area | Current State | Production Target |
|------|--------------|-------------------|
| Authentication | Demo (hardcoded users) | SSO/SAML with JWT |
| Authorization | RBAC with 2 roles (enforced server-side) | Extend with practice-area scoping |
| Audit trail | Not implemented | Append-only audit_log table |
| Data encryption | PostgreSQL TLS in transit | + encryption at rest |
| Input validation | Basic type checking | Zod schemas on all API inputs |
| Rate limiting | None | Per-user rate limits on mutations |
| Backup/recovery | Provider-managed (Vercel/Supabase) | Documented RPO/RTO targets |
