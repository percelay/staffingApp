import { describe, expect, it } from 'vitest';
import {
  buildLaneLayout,
  groupAndSortConsultants,
} from '@/lib/selectors/timeline-layout';

describe('timeline layout selectors', () => {
  it('groups consultants by practice area and sorts each group by seniority', () => {
    const groups = groupAndSortConsultants([
      {
        id: 'consultant-1',
        name: 'Alex Morgan',
        role: 'Consultant',
        practice_area: 'digital',
        seniority_level: 'consultant',
        status: 'active',
        skills: [],
        goals: [],
        avatar_url: 'https://example.com/alex.svg',
      },
      {
        id: 'consultant-2',
        name: 'Jordan Lee',
        role: 'Manager',
        practice_area: 'strategy',
        seniority_level: 'manager',
        status: 'active',
        skills: [],
        goals: [],
        avatar_url: 'https://example.com/jordan.svg',
      },
      {
        id: 'consultant-3',
        name: 'Sam Patel',
        role: 'Analyst',
        practice_area: 'strategy',
        seniority_level: 'analyst',
        status: 'active',
        skills: [],
        goals: [],
        avatar_url: 'https://example.com/sam.svg',
      },
    ]);

    expect(groups.map((group) => group.practiceArea)).toEqual([
      'digital',
      'strategy',
    ]);
    expect(groups[1].consultants.map((consultant) => consultant.id)).toEqual([
      'consultant-2',
      'consultant-3',
    ]);
  });

  it('stacks overlapping assignments into separate vertical slots', () => {
    const laneLayout = buildLaneLayout(
      [
        {
          id: 'assignment-1',
          consultant_id: 'consultant-1',
          engagement_id: 'engagement-1',
          role: 'manager',
          start_date: '2026-04-01',
          end_date: '2026-04-14',
          allocation_percentage: 100,
        },
        {
          id: 'assignment-2',
          consultant_id: 'consultant-1',
          engagement_id: 'engagement-2',
          role: 'consultant',
          start_date: '2026-04-05',
          end_date: '2026-04-20',
          allocation_percentage: 50,
        },
      ],
      new Date('2026-04-01T00:00:00.000Z'),
      new Date('2026-04-30T00:00:00.000Z')
    );

    const first = laneLayout.assignmentLayouts.get('assignment-1');
    const second = laneLayout.assignmentLayouts.get('assignment-2');

    expect(first?.yOffset).toBe(0);
    expect(second?.yOffset).toBeGreaterThan(0);
    expect(laneLayout.height).toBeGreaterThan(64);
  });
});
