import { withAuth } from '@/lib/api/rbac';
import { getSkills } from '@/server/services/staffing-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/skills
 * Returns all skills in the system.
 * Used for autocomplete/dropdown in forms.
 */
export const GET = withAuth('skills', async () => {
  const skills = await getSkills();
  return Response.json(skills);
});
