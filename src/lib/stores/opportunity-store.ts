import { create } from 'zustand';
import {
  createOpportunity as createOpportunityResource,
  createScenario as createScenarioResource,
  createTentativeAssignment as createTentativeAssignmentResource,
  deleteOpportunity as deleteOpportunityResource,
  deleteScenario as deleteScenarioResource,
  deleteTentativeAssignment as deleteTentativeAssignmentResource,
  fetchAllScenarios as fetchAllScenariosResource,
  fetchOpportunities as fetchOpportunitiesResource,
  fetchScenarios as fetchScenariosResource,
  updateOpportunity as updateOpportunityResource,
  updateScenario as updateScenarioResource,
  updateTentativeAssignment as updateTentativeAssignmentResource,
} from '@/lib/api/resources/opportunities';
import {
  ACTIVE_PIPELINE_STAGES,
  normalizePipelineStage,
  type Opportunity,
  type OpportunityCreateInput,
  type OpportunityUpdateInput,
  type PipelineStage,
  type Scenario,
  type TentativeAssignment,
  type TentativeAssignmentInput,
} from '../types/opportunity';
import { getErrorMessage, type ResourceStatus } from './resource-state';

interface OpportunityStore {
  opportunities: Opportunity[];
  scenarios: Scenario[];
  status: ResourceStatus;
  error: string | null;

  setOpportunities: (opportunities: Opportunity[]) => void;
  setScenarios: (scenarios: Scenario[]) => void;
  fetchOpportunities: () => Promise<void>;
  fetchAllScenarios: () => Promise<void>;
  fetchScenarios: (opportunityId: string) => Promise<void>;
  refetch: () => Promise<void>;
  reset: () => void;

  getById: (id: string) => Opportunity | undefined;
  getByStage: (stage: PipelineStage) => Opportunity[];
  getActive: () => Opportunity[];
  getDefaultScenario: (opportunityId: string) => Scenario | undefined;

  addOpportunity: (data: OpportunityCreateInput) => Promise<Opportunity>;
  updateOpportunity: (id: string, data: OpportunityUpdateInput) => Promise<void>;
  removeOpportunity: (id: string) => Promise<void>;

  addScenario: (
    opportunityId: string,
    data: { name: string; is_default?: boolean }
  ) => Promise<Scenario>;
  updateScenario: (scenarioId: string, data: Partial<Scenario>) => Promise<void>;
  removeScenario: (scenarioId: string) => Promise<void>;

  addTentativeAssignment: (
    scenarioId: string,
    data: TentativeAssignmentInput
  ) => Promise<TentativeAssignment>;
  removeTentativeAssignment: (
    scenarioId: string,
    assignmentId: string
  ) => Promise<void>;
  updateTentativeAssignment: (
    scenarioId: string,
    assignmentId: string,
    data: Partial<TentativeAssignment>
  ) => Promise<void>;
}

function normalizeOpportunity(opportunity: Opportunity): Opportunity {
  return {
    ...opportunity,
    stage: normalizePipelineStage(opportunity.stage),
    required_skills: opportunity.required_skills ?? [],
  };
}

function normalizeScenario(scenario: Scenario): Scenario {
  return {
    ...scenario,
    tentative_assignments: scenario.tentative_assignments ?? [],
  };
}

function mergeScenarios(
  existing: Scenario[],
  opportunityId: string,
  incoming: Scenario[]
) {
  return [
    ...existing.filter((scenario) => scenario.opportunity_id !== opportunityId),
    ...incoming.map(normalizeScenario),
  ];
}

export const useOpportunityStore = create<OpportunityStore>((set, get) => ({
  opportunities: [],
  scenarios: [],
  status: 'idle',
  error: null,

  setOpportunities: (opportunities) =>
    set({
      opportunities: opportunities.map(normalizeOpportunity),
      status: 'ready',
      error: null,
    }),

  setScenarios: (scenarios) =>
    set({
      scenarios: scenarios.map(normalizeScenario),
      status: 'ready',
      error: null,
    }),

  fetchOpportunities: async () => {
    set({ status: 'loading', error: null });
    try {
      const opportunities = await fetchOpportunitiesResource();
      set({
        opportunities: opportunities.map(normalizeOpportunity),
        status: 'ready',
        error: null,
      });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error) });
      throw error;
    }
  },

  fetchAllScenarios: async () => {
    set({ status: 'loading', error: null });
    try {
      const scenarios = await fetchAllScenariosResource();
      set({
        scenarios: scenarios.map(normalizeScenario),
        status: 'ready',
        error: null,
      });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error) });
      throw error;
    }
  },

  fetchScenarios: async (opportunityId) => {
    set({ status: 'loading', error: null });
    try {
      const scenarios = await fetchScenariosResource(opportunityId);
      set((state) => ({
        scenarios: mergeScenarios(state.scenarios, opportunityId, scenarios),
        status: 'ready',
        error: null,
      }));
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error) });
      throw error;
    }
  },

  refetch: async () => {
    await Promise.all([get().fetchOpportunities(), get().fetchAllScenarios()]);
  },

  reset: () =>
    set({
      opportunities: [],
      scenarios: [],
      status: 'idle',
      error: null,
    }),

  getById: (id) => get().opportunities.find((opportunity) => opportunity.id === id),
  getByStage: (stage) =>
    get().opportunities.filter((opportunity) => opportunity.stage === stage),
  getActive: () =>
    get().opportunities.filter((opportunity) =>
      ACTIVE_PIPELINE_STAGES.includes(opportunity.stage)
    ),
  getDefaultScenario: (opportunityId) =>
    get().scenarios.find(
      (scenario) => scenario.opportunity_id === opportunityId && scenario.is_default
    ) ??
    get().scenarios.find((scenario) => scenario.opportunity_id === opportunityId),

  addOpportunity: async (data) => {
    const opportunity = normalizeOpportunity(
      await createOpportunityResource(data)
    );

    set((state) => ({
      opportunities: [...state.opportunities, opportunity],
    }));

    await get().fetchScenarios(opportunity.id);
    return opportunity;
  },

  updateOpportunity: async (id, data) => {
    const opportunity = normalizeOpportunity(
      await updateOpportunityResource(id, data)
    );

    set((state) => ({
      opportunities: state.opportunities.map((candidate) =>
        candidate.id === id ? opportunity : candidate
      ),
    }));

    if (data.default_scenario !== undefined) {
      await get().fetchScenarios(id);
    }
  },

  removeOpportunity: async (id) => {
    await deleteOpportunityResource(id);
    set((state) => ({
      opportunities: state.opportunities.filter(
        (opportunity) => opportunity.id !== id
      ),
      scenarios: state.scenarios.filter(
        (scenario) => scenario.opportunity_id !== id
      ),
    }));
  },

  addScenario: async (opportunityId, data) => {
    const scenario = normalizeScenario(
      await createScenarioResource(opportunityId, data)
    );

    set((state) => ({
      scenarios: [...state.scenarios, scenario],
    }));
    return scenario;
  },

  updateScenario: async (scenarioId, data) => {
    const scenario = get().scenarios.find((candidate) => candidate.id === scenarioId);
    if (!scenario) {
      throw new Error('Scenario not found');
    }

    const updatedScenario = normalizeScenario(
      await updateScenarioResource(scenario.opportunity_id, scenarioId, data)
    );

    set((state) => ({
      scenarios: state.scenarios.map((candidate) =>
        candidate.id === scenarioId ? updatedScenario : candidate
      ),
    }));
  },

  removeScenario: async (scenarioId) => {
    const scenario = get().scenarios.find((candidate) => candidate.id === scenarioId);
    if (!scenario) {
      throw new Error('Scenario not found');
    }

    await deleteScenarioResource(scenario.opportunity_id, scenarioId);
    set((state) => ({
      scenarios: state.scenarios.filter(
        (candidate) => candidate.id !== scenarioId
      ),
    }));
  },

  addTentativeAssignment: async (scenarioId, data) => {
    const scenario = get().scenarios.find((candidate) => candidate.id === scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const assignment = await createTentativeAssignmentResource(
      scenario.opportunity_id,
      scenarioId,
      data
    );

    set((state) => ({
      scenarios: state.scenarios.map((candidate) =>
        candidate.id === scenarioId
          ? {
              ...candidate,
              tentative_assignments: [
                ...candidate.tentative_assignments,
                assignment,
              ],
            }
          : candidate
      ),
    }));

    return assignment;
  },

  removeTentativeAssignment: async (scenarioId, assignmentId) => {
    const scenario = get().scenarios.find((candidate) => candidate.id === scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    await deleteTentativeAssignmentResource(
      scenario.opportunity_id,
      scenarioId,
      assignmentId
    );

    set((state) => ({
      scenarios: state.scenarios.map((candidate) =>
        candidate.id === scenarioId
          ? {
              ...candidate,
              tentative_assignments: candidate.tentative_assignments.filter(
                (assignment) => assignment.id !== assignmentId
              ),
            }
          : candidate
      ),
    }));
  },

  updateTentativeAssignment: async (scenarioId, assignmentId, data) => {
    const scenario = get().scenarios.find((candidate) => candidate.id === scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const assignment = await updateTentativeAssignmentResource(
      scenario.opportunity_id,
      scenarioId,
      assignmentId,
      data
    );

    set((state) => ({
      scenarios: state.scenarios.map((candidate) =>
        candidate.id === scenarioId
          ? {
              ...candidate,
              tentative_assignments: candidate.tentative_assignments.map(
                (current) =>
                  current.id === assignmentId ? assignment : current
              ),
            }
          : candidate
      ),
    }));
  },
}));
