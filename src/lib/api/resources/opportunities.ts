import type {
  Opportunity,
  OpportunityCreateInput,
  OpportunityUpdateInput,
  Scenario,
  TentativeAssignment,
  TentativeAssignmentInput,
} from '@/lib/contracts/opportunity';
import { authFetchJson, jsonRequestInit, withQuery } from './shared';

export function fetchOpportunities(params?: { stage?: string | null }) {
  return authFetchJson<Opportunity[]>(
    withQuery('/api/opportunities', {
      stage: params?.stage,
    })
  );
}

export function fetchAllScenarios() {
  return authFetchJson<Scenario[]>('/api/opportunities/scenarios');
}

export function fetchScenarios(opportunityId: string) {
  return authFetchJson<Scenario[]>(
    `/api/opportunities/${opportunityId}/scenarios`
  );
}

export function createOpportunity(data: OpportunityCreateInput) {
  return authFetchJson<Opportunity>(
    '/api/opportunities',
    jsonRequestInit('POST', data)
  );
}

export function updateOpportunity(id: string, data: OpportunityUpdateInput) {
  return authFetchJson<Opportunity>(
    `/api/opportunities/${id}`,
    jsonRequestInit('PATCH', data)
  );
}

export function deleteOpportunity(id: string) {
  return authFetchJson<{ success: boolean }>(
    `/api/opportunities/${id}`,
    jsonRequestInit('DELETE')
  );
}

export function createScenario(
  opportunityId: string,
  data: { name: string; is_default?: boolean }
) {
  return authFetchJson<Scenario>(
    `/api/opportunities/${opportunityId}/scenarios`,
    jsonRequestInit('POST', data)
  );
}

export function updateScenario(
  opportunityId: string,
  scenarioId: string,
  data: Partial<Scenario>
) {
  return authFetchJson<Scenario>(
    `/api/opportunities/${opportunityId}/scenarios/${scenarioId}`,
    jsonRequestInit('PUT', data)
  );
}

export function deleteScenario(opportunityId: string, scenarioId: string) {
  return authFetchJson<{ success: boolean }>(
    `/api/opportunities/${opportunityId}/scenarios/${scenarioId}`,
    jsonRequestInit('DELETE')
  );
}

export function createTentativeAssignment(
  opportunityId: string,
  scenarioId: string,
  data: TentativeAssignmentInput
) {
  return authFetchJson<TentativeAssignment>(
    `/api/opportunities/${opportunityId}/scenarios/${scenarioId}/assignments`,
    jsonRequestInit('POST', data)
  );
}

export function updateTentativeAssignment(
  opportunityId: string,
  scenarioId: string,
  assignmentId: string,
  data: Partial<TentativeAssignment>
) {
  return authFetchJson<TentativeAssignment>(
    `/api/opportunities/${opportunityId}/scenarios/${scenarioId}/assignments/${assignmentId}`,
    jsonRequestInit('PATCH', data)
  );
}

export function deleteTentativeAssignment(
  opportunityId: string,
  scenarioId: string,
  assignmentId: string
) {
  return authFetchJson<{ success: boolean }>(
    `/api/opportunities/${opportunityId}/scenarios/${scenarioId}/assignments/${assignmentId}`,
    jsonRequestInit('DELETE')
  );
}
