import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/services/bootstrap-service', () => ({
  getBootstrapPayload: vi.fn(),
}));

import { getBootstrapPayload } from '@/server/services/bootstrap-service';
import { GET } from '@/app/api/bootstrap/route';

describe('GET /api/bootstrap', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('requires authentication headers', async () => {
    const response = await GET(new Request('http://localhost/api/bootstrap'));

    expect(response.status).toBe(401);
    expect(getBootstrapPayload).not.toHaveBeenCalled();
  });

  it('returns the bootstrap payload for an authorized request', async () => {
    const payload = {
      source: 'database' as const,
      consultants: [],
      engagements: [],
      assignments: [],
      signals: [],
      opportunities: [],
      scenarios: [],
    };
    vi.mocked(getBootstrapPayload).mockResolvedValue(payload);

    const request = new Request('http://localhost/api/bootstrap', {
      headers: {
        'x-user-id': 'manager-1',
        'x-user-role': 'manager',
      },
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(payload);
  });
});
