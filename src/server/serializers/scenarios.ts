import type {
  Scenario,
  TentativeAssignment,
} from '@/lib/contracts/opportunity';
import { formatDate } from './utils';

type TentativeAssignmentRecord = {
  id: string;
  scenarioId: string;
  consultantId: string;
  role: string;
  startDate: Date;
  endDate: Date;
  allocationPercentage: number;
};

type ScenarioRecord = {
  id: string;
  opportunityId: string;
  name: string;
  isDefault: boolean;
  fitScore: number | null;
  burnoutImpact: number | null;
  tentativeAssignments?: TentativeAssignmentRecord[];
};

export function serializeTentativeAssignment(
  record: TentativeAssignmentRecord
): TentativeAssignment {
  return {
    id: record.id,
    scenario_id: record.scenarioId,
    consultant_id: record.consultantId,
    role: record.role as TentativeAssignment['role'],
    start_date: formatDate(record.startDate),
    end_date: formatDate(record.endDate),
    allocation_percentage: record.allocationPercentage,
  };
}

export function serializeScenario(record: ScenarioRecord): Scenario {
  return {
    id: record.id,
    opportunity_id: record.opportunityId,
    name: record.name,
    is_default: record.isDefault,
    fit_score: record.fitScore,
    burnout_impact: record.burnoutImpact,
    tentative_assignments: (record.tentativeAssignments ?? []).map(
      serializeTentativeAssignment
    ),
  };
}
