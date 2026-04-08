import { create } from 'zustand';
import { authFetchJson } from '../api/json-fetch';
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

interface OpportunityStore {
  opportunities: Opportunity[];
  loading: boolean;
  selectedOpportunityId: string | null;
  activeScenarioId: string | null;
  scenarios: Scenario[];

  setOpportunities: (opportunities: Opportunity[]) => void;
  setScenarios: (scenarios: Scenario[]) => void;
  fetchOpportunities: () => Promise<void>;
  fetchAllScenarios: () => Promise<void>;
  fetchScenarios: (opportunityId: string) => Promise<void>;

  getById: (id: string) => Opportunity | undefined;
  getByStage: (stage: PipelineStage) => Opportunity[];
  getActive: () => Opportunity[];
  getDefaultScenario: (opportunityId: string) => Scenario | undefined;

  setSelectedOpportunityId: (id: string | null) => void;
  setActiveScenarioId: (id: string | null) => void;

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
  loading: false,
  selectedOpportunityId: null,
  activeScenarioId: null,
  scenarios: [],

  setOpportunities: (opportunities) =>
    set({ opportunities: opportunities.map(normalizeOpportunity) }),

  setScenarios: (scenarios) =>
    set({ scenarios: scenarios.map(normalizeScenario) }),

  fetchOpportunities: async () => {
    set({ loading: true });
    try {
      const opportunities = await authFetchJson<Opportunity[]>('/api/opportunities');
      set({
        opportunities: opportunities.map(normalizeOpportunity),
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchAllScenarios: async () => {
    const scenarios = await authFetchJson<Scenario[]>('/api/opportunities/scenarios');
    set({ scenarios: scenarios.map(normalizeScenario) });
  },

  fetchScenarios: async (opportunityId) => {
    const scenarios = await authFetchJson<Scenario[]>(
      `/api/opportunities/${opportunityId}/scenarios`
    );
    set((state) => ({
      scenarios: mergeScenarios(state.scenarios, opportunityId, scenarios),
    }));
  },

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

  setSelectedOpportunityId: (id) => set({ selectedOpportunityId: id }),
  setActiveScenarioId: (id) => set({ activeScenarioId: id }),

  addOpportunity: async (data) => {
    const created = normalizeOpportunity(
      await authFetchJson<Opportunity>('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    );

    set((state) => ({
      opportunities: [...state.opportunities, created],
    }));

    await get().fetchScenarios(created.id);
    return created;
  },

  updateOpportunity: async (id, data) => {
    const updated = normalizeOpportunity(
      await authFetchJson<Opportunity>(`/api/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    );

    set((state) => ({
      opportunities: state.opportunities.map((opportunity) =>
        opportunity.id === id ? updated : opportunity
      ),
    }));

    if (data.default_scenario !== undefined) {
      await get().fetchScenarios(id);
    }
  },

  removeOpportunity: async (id) => {
    await authFetchJson<{ success: boolean }>(`/api/opportunities/${id}`, {
      method: 'DELETE',
    });

    set((state) => {
      const nextScenarios = state.scenarios.filter(
        (scenario) => scenario.opportunity_id !== id
      );

      return {
        opportunities: state.opportunities.filter(
          (opportunity) => opportunity.id !== id
        ),
        scenarios: nextScenarios,
        selectedOpportunityId:
          state.selectedOpportunityId === id ? null : state.selectedOpportunityId,
        activeScenarioId: nextScenarios.some(
          (scenario) => scenario.id === state.activeScenarioId
        )
          ? state.activeScenarioId
          : null,
      };
    });
  },

  addScenario: async (opportunityId, data) => {
    const created = normalizeScenario(
      await authFetchJson<Scenario>(`/api/opportunities/${opportunityId}/scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    );

    set((state) => ({ scenarios: [...state.scenarios, created] }));
    return created;
  },

  updateScenario: async (scenarioId, data) => {
    const scenario = get().scenarios.find((candidate) => candidate.id === scenarioId);
    if (!scenario) {
      throw new Error('Scenario not found');
    }

    const updated = normalizeScenario(
      await authFetchJson<Scenario>(
        `/api/opportunities/${scenario.opportunity_id}/scenarios/${scenarioId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )
    );

    set((state) => ({
      scenarios: state.scenarios.map((candidate) =>
        candidate.id === scenarioId ? updated : candidate
      ),
    }));
  },

  removeScenario: async (scenarioId) => {
    const scenario = get().scenarios.find((candidate) => candidate.id === scenarioId);
    if (!scenario) {
      throw new Error('Scenario not found');
    }

    await authFetchJson<{ success: boolean }>(
      `/api/opportunities/${scenario.opportunity_id}/scenarios/${scenarioId}`,
      { method: 'DELETE' }
    );

    set((state) => {
      const nextScenarios = state.scenarios.filter(
        (candidate) => candidate.id !== scenarioId
      );

      return {
        scenarios: nextScenarios,
        activeScenarioId:
          state.activeScenarioId === scenarioId ? null : state.activeScenarioId,
      };
    });
  },

  addTentativeAssignment: async (scenarioId, data) => {
    const scenario = get().scenarios.find((candidate) => candidate.id === scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const created = await authFetchJson<TentativeAssignment>(
      `/api/opportunities/${scenario.opportunity_id}/scenarios/${scenarioId}/assignments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );

    set((state) => ({
      scenarios: state.scenarios.map((candidate) =>
        candidate.id === scenarioId
          ? {
              ...candidate,
              tentative_assignments: [
                ...candidate.tentative_assignments,
                created,
              ],
            }
          : candidate
      ),
    }));

    return created;
  },

  removeTentativeAssignment: async (scenarioId, assignmentId) => {
    const scenario = get().scenarios.find((candidate) => candidate.id === scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    await authFetchJson<{ success: boolean }>(
      `/api/opportunities/${scenario.opportunity_id}/scenarios/${scenarioId}/assignments/${assignmentId}`,
      { method: 'DELETE' }
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

    const updated = await authFetchJson<TentativeAssignment>(
      `/api/opportunities/${scenario.opportunity_id}/scenarios/${scenarioId}/assignments/${assignmentId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );

    set((state) => ({
      scenarios: state.scenarios.map((candidate) =>
        candidate.id === scenarioId
          ? {
              ...candidate,
              tentative_assignments: candidate.tentative_assignments.map(
                (assignment) =>
                  assignment.id === assignmentId ? updated : assignment
              ),
            }
          : candidate
      ),
    }));
  },
}));
