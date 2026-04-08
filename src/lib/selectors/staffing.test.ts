import { describe, expect, it } from 'vitest';
import {
  getAvailableConsultants,
  getConsultantMatches,
  getTeamSkillCoverage,
  getTotalAllocation,
  hasNormalizedValue,
} from '@/lib/selectors/staffing';

const consultants = [
  {
    id: 'consultant-1',
    name: 'Alex Morgan',
    role: 'Manager',
    practice_area: 'strategy',
    seniority_level: 'manager',
    status: 'active',
    skills: ['Cloud Migration', 'Change Management'],
    goals: ['Digital Strategy'],
    avatar_url: 'https://example.com/alex.svg',
  },
  {
    id: 'consultant-2',
    name: 'Jordan Lee',
    role: 'Consultant',
    practice_area: 'digital',
    seniority_level: 'consultant',
    status: 'active',
    skills: ['Data Analytics'],
    goals: ['Cloud Migration'],
    avatar_url: 'https://example.com/jordan.svg',
  },
  {
    id: 'consultant-3',
    name: 'Sam Patel',
    role: 'Analyst',
    practice_area: 'strategy',
    seniority_level: 'analyst',
    status: 'active',
    skills: ['Market Analysis'],
    goals: [],
    avatar_url: 'https://example.com/sam.svg',
  },
] as const;

describe('staffing selectors', () => {
  it('filters available consultants by assignment and practice area', () => {
    const result = getAvailableConsultants(
      [...consultants],
      [{ consultant_id: 'consultant-1' }],
      'strategy'
    );

    expect(result.map((consultant) => consultant.id)).toEqual(['consultant-3']);
  });

  it('normalizes consultant skill matching and team coverage', () => {
    expect(
      getConsultantMatches(
        [' Cloud Migration ', 'Change Management'],
        ['cloud migration', 'data analytics']
      )
    ).toEqual([' Cloud Migration ']);
    expect(hasNormalizedValue(['Digital Strategy'], ' digital strategy ')).toBe(
      true
    );

    const coverage = getTeamSkillCoverage(
      [...consultants],
      [{ consultant_id: 'consultant-1' }, { consultant_id: 'consultant-2' }],
      ['cloud migration', 'Data Analytics', 'Organizational Design']
    );

    expect(coverage.coveredSkills).toEqual([
      'cloud migration',
      'Data Analytics',
    ]);
    expect(coverage.missingSkills).toEqual(['Organizational Design']);
  });

  it('sums team allocation across assignments and tentative assignments', () => {
    expect(
      getTotalAllocation([
        { allocation_percentage: 40 },
        { allocation_percentage: 60 },
        { allocation_percentage: 20 },
      ])
    ).toBe(120);
  });
});
