import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/rbac';

export const dynamic = 'force-dynamic';

/**
 * GET /api/skills
 * Returns all skills in the system.
 * Used for autocomplete/dropdown in forms.
 */
export const GET = withAuth('skills', async () => {
  const skills = await prisma.skill.findMany({
    orderBy: { name: 'asc' },
  });

  return Response.json(skills.map((s) => s.name));
});
