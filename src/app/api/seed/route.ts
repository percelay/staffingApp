import { withAuth } from '@/lib/api/rbac';

export const dynamic = 'force-dynamic';

/**
 * POST /api/seed
 * Triggers database seeding via the API (dev only).
 * In production, use `npx prisma db seed` instead.
 */
export const POST = withAuth('seed', async () => {
  if (process.env.NODE_ENV === 'production') {
    return Response.json(
      { error: 'Seeding is disabled in production' },
      { status: 403 }
    );
  }

  return Response.json({
    message: 'Use `npx prisma db seed` to seed the database.',
    hint: 'Run this from the terminal, not via API.',
  });
});
