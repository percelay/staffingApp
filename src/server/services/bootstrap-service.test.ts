import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/repositories', () => ({
  listAssignments: vi.fn(),
  listConsultants: vi.fn(),
  listEngagements: vi.fn(),
  listOpportunities: vi.fn(),
  listScenarios: vi.fn(),
  listWellbeingSignals: vi.fn(),
}));

vi.mock('@/server/demo/seed-data', () => ({
  generateDemoSeedData: vi.fn(),
}));

import { generateDemoSeedData } from '@/server/demo/seed-data';
import {
  listAssignments,
  listConsultants,
  listEngagements,
  listOpportunities,
  listScenarios,
  listWellbeingSignals,
} from '@/server/repositories';
import { getBootstrapPayload } from '@/server/services/bootstrap-service';

describe('getBootstrapPayload', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('falls back to demo data when the database has no staffing records', async () => {
    vi.mocked(listConsultants).mockResolvedValue([]);
    vi.mocked(listEngagements).mockResolvedValue([]);
    vi.mocked(listAssignments).mockResolvedValue([]);
    vi.mocked(listWellbeingSignals).mockResolvedValue([]);
    vi.mocked(listOpportunities).mockResolvedValue([]);
    vi.mocked(listScenarios).mockResolvedValue([]);

    vi.mocked(generateDemoSeedData).mockReturnValue({
      consultants: [
        {
          id: 'demo-consultant',
          name: 'Demo Consultant',
          role: 'Consultant',
          practice_area: 'strategy',
          seniority_level: 'consultant',
          status: 'active',
          skills: ['Financial Modeling'],
          goals: ['Digital Strategy'],
          avatar_url: 'https://example.com/demo.svg',
        },
      ],
      engagements: [],
      assignments: [],
      wellbeingSignals: [],
      opportunities: [],
      scenarios: [],
    });

    const payload = await getBootstrapPayload();

    expect(payload.source).toBe('demo');
    expect(payload.consultants).toHaveLength(1);
    expect(payload.consultants[0].id).toBe('demo-consultant');
  });

  it('uses database records when any staffing data exists', async () => {
    vi.mocked(listConsultants).mockResolvedValue([
      {
        id: 'db-consultant',
        name: 'Database Consultant',
        role: 'Manager',
        practiceArea: 'operations',
        seniorityLevel: 'manager',
        avatarUrl: 'https://example.com/db.svg',
        status: 'active',
        skills: [{ skill: { id: 'skill-1', name: 'Process Optimization' } }],
        goals: [{ skill: { id: 'skill-2', name: 'Digital Strategy' } }],
      },
    ]);
    vi.mocked(listEngagements).mockResolvedValue([]);
    vi.mocked(listAssignments).mockResolvedValue([]);
    vi.mocked(listWellbeingSignals).mockResolvedValue([]);
    vi.mocked(listOpportunities).mockResolvedValue([]);
    vi.mocked(listScenarios).mockResolvedValue([]);

    const payload = await getBootstrapPayload();

    expect(payload.source).toBe('database');
    expect(payload.consultants).toEqual([
      {
        id: 'db-consultant',
        name: 'Database Consultant',
        role: 'Manager',
        practice_area: 'operations',
        seniority_level: 'manager',
        status: 'active',
        skills: ['Process Optimization'],
        goals: ['Digital Strategy'],
        avatar_url: 'https://example.com/db.svg',
      },
    ]);
    expect(generateDemoSeedData).not.toHaveBeenCalled();
  });
});
