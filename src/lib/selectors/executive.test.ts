import { describe, expect, it } from 'vitest';
import { buildExecutiveSummary } from '@/lib/selectors/executive';
import type { Assignment } from '@/lib/types/assignment';
import type { Consultant } from '@/lib/types/consultant';
import type { Engagement } from '@/lib/types/engagement';
import type { WellbeingSignal } from '@/lib/types/wellbeing';

describe('buildExecutiveSummary', () => {
  it('computes metrics from active consultants and shared staffing data', () => {
    const consultants: Consultant[] = [
      {
        id: 'consultant-1',
        name: 'Alex Morgan',
        role: 'Consultant',
        practice_area: 'strategy',
        seniority_level: 'consultant',
        status: 'active',
        skills: ['Financial Modeling'],
        goals: ['Digital Strategy'],
        avatar_url: 'https://example.com/alex.svg',
      },
      {
        id: 'consultant-2',
        name: 'Taylor Reed',
        role: 'Manager',
        practice_area: 'operations',
        seniority_level: 'manager',
        status: 'on_leave',
        skills: ['Process Optimization'],
        goals: [],
        avatar_url: 'https://example.com/taylor.svg',
      },
    ];

    const engagements: Engagement[] = [
      {
        id: 'engagement-1',
        client_name: 'Acme Corp',
        project_name: 'Transformation',
        start_date: '2026-04-01',
        end_date: '2026-04-30',
        required_skills: ['Financial Modeling'],
        status: 'active',
        color: '#4F46E5',
        is_bet: false,
      },
      {
        id: 'engagement-2',
        client_name: 'Beta LLC',
        project_name: 'Future Work',
        start_date: '2026-05-10',
        end_date: '2026-06-15',
        required_skills: ['Digital Strategy'],
        status: 'upcoming',
        color: '#0891B2',
        is_bet: true,
      },
    ];

    const assignments: Assignment[] = [
      {
        id: 'assignment-1',
        consultant_id: 'consultant-1',
        engagement_id: 'engagement-1',
        role: 'consultant',
        start_date: '2026-02-01',
        end_date: '2026-03-31',
        allocation_percentage: 60,
      },
      {
        id: 'assignment-2',
        consultant_id: 'consultant-1',
        engagement_id: 'engagement-1',
        role: 'consultant',
        start_date: '2026-04-01',
        end_date: '2026-04-30',
        allocation_percentage: 120,
      },
    ];

    const signals: WellbeingSignal[] = [
      {
        id: 'signal-1',
        consultant_id: 'consultant-1',
        signal_type: 'overwork',
        severity: 'high',
        recorded_at: '2026-04-04',
      },
      {
        id: 'signal-2',
        consultant_id: 'consultant-1',
        signal_type: 'weekend_work',
        severity: 'high',
        recorded_at: '2026-04-05',
      },
      {
        id: 'signal-3',
        consultant_id: 'consultant-1',
        signal_type: 'no_break',
        severity: 'high',
        recorded_at: '2026-04-06',
      },
      {
        id: 'signal-4',
        consultant_id: 'consultant-1',
        signal_type: 'high_travel',
        severity: 'high',
        recorded_at: '2026-04-07',
      },
    ];

    const summary = buildExecutiveSummary({
      consultants,
      engagements,
      assignments,
      signals,
      now: new Date('2026-04-08T12:00:00.000Z'),
    });

    expect(summary.current.total_consultants).toBe(1);
    expect(summary.current.avg_utilization).toBe(120);
    expect(summary.current.active_engagements).toBe(1);
    expect(summary.current.upcoming_engagements).toBe(1);
    expect(summary.current.bench_count).toBe(0);
    expect(summary.current.at_risk_count).toBe(1);
    expect(summary.current.total_man_days).toBe(6);

    expect(summary.practice_areas.find((area) => area.area === 'strategy')).toMatchObject({
      consultant_count: 1,
      avg_utilization: 120,
      at_risk_count: 1,
    });
    expect(summary.practice_areas.find((area) => area.area === 'operations')).toMatchObject({
      consultant_count: 0,
      avg_utilization: 0,
      at_risk_count: 0,
    });

    expect(summary.engagements[0]).toMatchObject({
      id: 'engagement-1',
      team_size: 1,
      total_allocation: 180,
      man_days: 9,
    });

    expect(summary.at_risk).toHaveLength(1);
    expect(summary.at_risk[0]).toMatchObject({
      id: 'consultant-1',
      burnout_score: 74,
      status: 'at_risk',
      signal_count: 4,
    });
    expect(summary.at_risk[0].signals).toHaveLength(4);
    expect(summary.trends).toHaveLength(12);
    expect(summary.deltas).toEqual(
      expect.objectContaining({
        utilization: expect.any(Number),
        engagements: expect.any(Number),
        bench: expect.any(Number),
        risk: expect.any(Number),
      })
    );
  });
});
