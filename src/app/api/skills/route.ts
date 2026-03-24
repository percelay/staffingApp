import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/skills
 * Returns all skills in the system.
 * Used for autocomplete/dropdown in forms.
 */
export async function GET() {
  const skills = await prisma.skill.findMany({
    orderBy: { name: 'asc' },
  });

  return Response.json(skills.map((s) => s.name));
}
