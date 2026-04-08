import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/services/staffing-service', () => ({
  replaceConsultantSkillsFromInput: vi.fn(),
}));

import { replaceConsultantSkillsFromInput } from '@/server/services/staffing-service';
import { PUT } from '@/app/api/consultants/[id]/skills/route';

describe('PUT /api/consultants/[id]/skills', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('requires authentication headers', async () => {
    const request = new Request('http://localhost/api/consultants/consultant-1/skills', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ skills: ['Cloud Migration'] }),
    });

    const response = await PUT(
      request as never,
      { params: Promise.resolve({ id: 'consultant-1' }) } as never
    );

    expect(response.status).toBe(401);
    expect(replaceConsultantSkillsFromInput).not.toHaveBeenCalled();
  });

  it('replaces consultant skills through the shared service layer', async () => {
    const consultant = {
      id: 'consultant-1',
      name: 'Alex Morgan',
      role: 'Consultant',
      practice_area: 'strategy' as const,
      seniority_level: 'consultant' as const,
      status: 'active' as const,
      skills: ['Cloud Migration'],
      goals: ['Digital Strategy'],
      avatar_url: 'https://example.com/alex.svg',
    };
    vi.mocked(replaceConsultantSkillsFromInput).mockResolvedValue(consultant);

    const request = new Request('http://localhost/api/consultants/consultant-1/skills', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'manager-1',
        'x-user-role': 'manager',
      },
      body: JSON.stringify({ skills: ['Cloud Migration'] }),
    });

    const response = await PUT(
      request as never,
      { params: Promise.resolve({ id: 'consultant-1' }) } as never
    );

    expect(response.status).toBe(200);
    expect(replaceConsultantSkillsFromInput).toHaveBeenCalledWith(
      'consultant-1',
      { skills: ['Cloud Migration'] }
    );
    expect(await response.json()).toEqual(consultant);
  });
});
