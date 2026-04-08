import { describe, expect, it } from 'vitest';
import {
  serializeConsultant,
  serializeEngagement,
} from '@/server/serializers/staffing';

describe('staffing serializers', () => {
  it('serializes consultants into the shared DTO shape including status', () => {
    const consultant = serializeConsultant({
      id: 'consultant-1',
      name: 'Alex Morgan',
      role: 'Consultant',
      practiceArea: 'strategy',
      seniorityLevel: 'consultant',
      avatarUrl: 'https://example.com/alex.svg',
      status: 'on_leave',
      skills: [{ skill: { id: 'skill-1', name: 'Financial Modeling' } }],
      goals: [{ skill: { id: 'skill-2', name: 'Digital Strategy' } }],
    });

    expect(consultant).toEqual({
      id: 'consultant-1',
      name: 'Alex Morgan',
      role: 'Consultant',
      practice_area: 'strategy',
      seniority_level: 'consultant',
      status: 'on_leave',
      skills: ['Financial Modeling'],
      goals: ['Digital Strategy'],
      avatar_url: 'https://example.com/alex.svg',
    });
  });

  it('normalizes at-risk engagement status while flattening required skills', () => {
    const engagement = serializeEngagement({
      id: 'engagement-1',
      clientName: 'Acme Corp',
      projectName: 'Recovery Plan',
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2026-04-30T00:00:00.000Z'),
      status: 'at_risk',
      color: '#DC2626',
      isBet: true,
      requiredSkills: [{ skill: { id: 'skill-1', name: 'Change Management' } }],
    });

    expect(engagement).toEqual({
      id: 'engagement-1',
      client_name: 'Acme Corp',
      project_name: 'Recovery Plan',
      start_date: '2026-04-01',
      end_date: '2026-04-30',
      required_skills: ['Change Management'],
      status: 'at_risk',
      color: '#DC2626',
      is_bet: true,
    });
  });
});
