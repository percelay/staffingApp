import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/resources/opportunities', () => ({
  createOpportunity: vi.fn(),
  createScenario: vi.fn(),
  createTentativeAssignment: vi.fn(),
  deleteOpportunity: vi.fn(),
  deleteScenario: vi.fn(),
  deleteTentativeAssignment: vi.fn(),
  fetchAllScenarios: vi.fn(),
  fetchOpportunities: vi.fn(),
  fetchScenarios: vi.fn(),
  updateOpportunity: vi.fn(),
  updateScenario: vi.fn(),
  updateTentativeAssignment: vi.fn(),
}));

import {
  createOpportunity,
  updateOpportunity,
} from '@/lib/api/resources/opportunities';
import { useAppStore } from '@/lib/stores/app-store';
import { useOpportunityStore } from '@/lib/stores/opportunity-store';

describe('useOpportunityStore demo mode', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAppStore.getState().resetBootstrap();
    useOpportunityStore.getState().reset();
  });

  it('creates opportunities locally when bootstrap source is demo', async () => {
    useAppStore.getState().setBootstrapReady('demo');

    const created = await useOpportunityStore.getState().addOpportunity({
      client_name: 'Acme Corp',
      project_name: 'Platform Reset',
      start_date: '2026-06-01',
      end_date: '2026-07-15',
      stage: 'identified',
      probability: 40,
      estimated_value: 250000,
      required_skills: ['Cloud Migration'],
      color: '#0891B2',
      is_bet: true,
      notes: 'Demo opportunity',
      converted_engagement_id: null,
      default_scenario: {
        name: 'Primary Team',
        tentative_assignments: [
          {
            consultant_id: 'consultant-1',
            role: 'manager',
            start_date: '2026-06-01',
            end_date: '2026-07-15',
            allocation_percentage: 60,
          },
        ],
      },
    });

    expect(createOpportunity).not.toHaveBeenCalled();
    expect(created.client_name).toBe('Acme Corp');
    expect(useOpportunityStore.getState().opportunities).toHaveLength(1);
    expect(useOpportunityStore.getState().scenarios).toHaveLength(1);
    expect(
      useOpportunityStore.getState().scenarios[0].tentative_assignments
    ).toHaveLength(1);
  });

  it('updates opportunities and default scenarios locally in demo mode', async () => {
    useAppStore.getState().setBootstrapReady('demo');
    useOpportunityStore.getState().setOpportunities([
      {
        id: 'opportunity-1',
        client_name: 'Acme Corp',
        project_name: 'Platform Reset',
        start_date: '2026-06-01',
        end_date: '2026-07-15',
        stage: 'identified',
        probability: 40,
        estimated_value: 250000,
        required_skills: ['Cloud Migration'],
        color: '#0891B2',
        is_bet: false,
        notes: null,
        converted_engagement_id: null,
      },
    ]);
    useOpportunityStore.getState().setScenarios([
      {
        id: 'scenario-1',
        opportunity_id: 'opportunity-1',
        name: 'Primary Team',
        is_default: true,
        fit_score: null,
        burnout_impact: null,
        tentative_assignments: [
          {
            id: 'assignment-1',
            scenario_id: 'scenario-1',
            consultant_id: 'consultant-1',
            role: 'manager',
            start_date: '2026-06-01',
            end_date: '2026-07-15',
            allocation_percentage: 60,
          },
        ],
      },
    ]);

    await useOpportunityStore.getState().updateOpportunity('opportunity-1', {
      project_name: 'Platform Reset Phase 2',
      is_bet: true,
      default_scenario: {
        name: 'Revised Team',
        tentative_assignments: [
          {
            consultant_id: 'consultant-2',
            role: 'consultant',
            start_date: '2026-06-10',
            end_date: '2026-07-15',
            allocation_percentage: 80,
          },
        ],
      },
    });

    expect(updateOpportunity).not.toHaveBeenCalled();
    expect(useOpportunityStore.getState().opportunities[0].project_name).toBe(
      'Platform Reset Phase 2'
    );
    expect(useOpportunityStore.getState().opportunities[0].is_bet).toBe(true);
    expect(useOpportunityStore.getState().scenarios[0].name).toBe('Revised Team');
    expect(
      useOpportunityStore.getState().scenarios[0].tentative_assignments[0]
        .consultant_id
    ).toBe('consultant-2');
  });
});
