import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/repositories/scenarios-repository', () => ({
  createScenario: vi.fn(),
  createTentativeAssignment: vi.fn(),
  deleteScenario: vi.fn(),
  deleteTentativeAssignment: vi.fn(),
  getScenarioForOpportunity: vi.fn(),
  getTentativeAssignmentForScenario: vi.fn(),
  listScenarios: vi.fn(),
  updateScenario: vi.fn(),
  updateTentativeAssignment: vi.fn(),
}));

import {
  getTentativeAssignmentForScenario,
  updateTentativeAssignment,
} from '@/server/repositories/scenarios-repository';
import { PATCH } from '@/app/api/opportunities/[id]/scenarios/[scenarioId]/assignments/[assignmentId]/route';

describe(
  'PATCH /api/opportunities/[id]/scenarios/[scenarioId]/assignments/[assignmentId]',
  () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('returns 404 when the assignment does not belong to the requested opportunity scenario', async () => {
      vi.mocked(getTentativeAssignmentForScenario).mockResolvedValue(null);

      const request = new Request(
        'http://localhost/api/opportunities/opportunity-1/scenarios/scenario-1/assignments/assignment-1',
        {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
            'x-user-id': 'manager-1',
            'x-user-role': 'manager',
          },
          body: JSON.stringify({ allocation_percentage: 80 }),
        }
      );

      const response = await PATCH(request as never, {
        params: Promise.resolve({
          id: 'opportunity-1',
          scenarioId: 'scenario-1',
          assignmentId: 'assignment-1',
        }),
      } as never);

      expect(response.status).toBe(404);
      expect(updateTentativeAssignment).not.toHaveBeenCalled();
    });

    it('updates the assignment after validating nested ownership', async () => {
      vi.mocked(getTentativeAssignmentForScenario).mockResolvedValue({
        id: 'assignment-1',
        scenarioId: 'scenario-1',
        consultantId: 'consultant-1',
        role: 'consultant',
        startDate: new Date('2026-05-01T00:00:00.000Z'),
        endDate: new Date('2026-05-31T00:00:00.000Z'),
        allocationPercentage: 60,
      });
      vi.mocked(updateTentativeAssignment).mockResolvedValue({
        id: 'assignment-1',
        scenarioId: 'scenario-1',
        consultantId: 'consultant-1',
        role: 'manager',
        startDate: new Date('2026-05-01T00:00:00.000Z'),
        endDate: new Date('2026-05-31T00:00:00.000Z'),
        allocationPercentage: 80,
      });

      const request = new Request(
        'http://localhost/api/opportunities/opportunity-1/scenarios/scenario-1/assignments/assignment-1',
        {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
            'x-user-id': 'manager-1',
            'x-user-role': 'manager',
          },
          body: JSON.stringify({
            allocation_percentage: 80,
            role: 'manager',
          }),
        }
      );

      const response = await PATCH(request as never, {
        params: Promise.resolve({
          id: 'opportunity-1',
          scenarioId: 'scenario-1',
          assignmentId: 'assignment-1',
        }),
      } as never);

      expect(getTentativeAssignmentForScenario).toHaveBeenCalledWith(
        'opportunity-1',
        'scenario-1',
        'assignment-1'
      );
      expect(updateTentativeAssignment).toHaveBeenCalledWith('assignment-1', {
        allocationPercentage: 80,
        role: 'manager',
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        id: 'assignment-1',
        scenario_id: 'scenario-1',
        consultant_id: 'consultant-1',
        role: 'manager',
        start_date: '2026-05-01',
        end_date: '2026-05-31',
        allocation_percentage: 80,
      });
    });
  }
);
