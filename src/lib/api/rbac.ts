/**
 * Role-Based Access Control (RBAC)
 *
 * Enforces server-side authorization on all API routes.
 * Auth context is passed via the X-User-Id and X-User-Role headers,
 * set by the frontend on every fetch call.
 *
 * Roles:
 *   partner  — Full access. Can create/delete engagements, manage all consultants,
 *              view wellbeing data, and approve proposals.
 *   manager  — Operational access. Can view everything, manage assignments and
 *              consultants within their scope, but cannot delete engagements
 *              or create/remove consultants.
 */

export type Role = 'partner' | 'manager';

export interface AuthContext {
  user_id: string;
  role: Role;
}

// ─── Permission Definitions ───────────────────────────────────────────────

type Resource = 'consultants' | 'engagements' | 'assignments' | 'proposals' | 'wellbeing' | 'skills' | 'seed' | 'executive_summary';
type Action = 'read' | 'create' | 'update' | 'delete';

const PERMISSIONS: Record<Role, Record<Resource, Action[]>> = {
  partner: {
    consultants: ['read', 'create', 'update', 'delete'],
    engagements: ['read', 'create', 'update', 'delete'],
    assignments: ['read', 'create', 'update', 'delete'],
    proposals:   ['read', 'create'],
    wellbeing:   ['read', 'create'],
    skills:      ['read'],
    seed:        ['create'],
    executive_summary: ['read'],
  },
  manager: {
    consultants: ['read', 'update'],
    engagements: ['read', 'update'],
    assignments: ['read', 'create', 'update', 'delete'],
    proposals:   ['read', 'create'],
    wellbeing:   ['read', 'create'],
    skills:      ['read'],
    seed:        [],
    executive_summary: [],
  },
};

const METHOD_TO_ACTION: Record<string, Action> = {
  GET: 'read',
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

// ─── Auth Extraction ──────────────────────────────────────────────────────

export function extractAuth(request: Request): AuthContext | null {
  const userId = request.headers.get('x-user-id');
  const role = request.headers.get('x-user-role') as Role | null;

  if (!userId || !role || !['partner', 'manager'].includes(role)) {
    return null;
  }

  return { user_id: userId, role };
}

// ─── Permission Check ─────────────────────────────────────────────────────

export function hasPermission(role: Role, resource: Resource, action: Action): boolean {
  return PERMISSIONS[role]?.[resource]?.includes(action) ?? false;
}

// ─── Route Wrapper ────────────────────────────────────────────────────────

/**
 * Wraps an API route handler with authentication and authorization checks.
 *
 * Usage:
 *   export const GET = withAuth('consultants', async (request, auth) => {
 *     // auth.user_id and auth.role are guaranteed valid here
 *     return Response.json({ ... });
 *   });
 */
export function withAuth<T extends unknown[]>(
  resource: Resource,
  handler: (request: Request, auth: AuthContext, ...args: T) => Promise<Response>,
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    const auth = extractAuth(request);

    if (!auth) {
      return Response.json(
        { error: 'Authentication required. Provide X-User-Id and X-User-Role headers.' },
        { status: 401 },
      );
    }

    const action = METHOD_TO_ACTION[request.method] || 'read';

    if (!hasPermission(auth.role, resource, action)) {
      return Response.json(
        {
          error: 'Forbidden',
          detail: `Role "${auth.role}" cannot ${action} ${resource}.`,
        },
        { status: 403 },
      );
    }

    return handler(request, auth, ...args);
  };
}
