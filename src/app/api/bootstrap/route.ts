import { withAuth } from '@/lib/api/rbac';
import { getBootstrapPayload } from '@/server/services/bootstrap-service';

export const dynamic = 'force-dynamic';

export const GET = withAuth('bootstrap', async () => {
  const payload = await getBootstrapPayload();
  return Response.json(payload);
});
