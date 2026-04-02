import { create } from 'zustand';
import { authFetch } from '../api/auth-fetch';
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

function mergeScenarios(
  existing: Scenario[],
  opportunityId: string,
  incoming: Scenario[]
) {
  return [
    ...existing.filter((scenario) => scenario.opportunity_id !== opportunityId),
    ...incoming,
  ];
}

function buildLocalDefaultScenario(
  opportunityId: string,
  defaultScenario: OpportunityCreateInput['default_scenario'],
  startDate: string,
  endDate: string
): Scenario {
  const scenarioId = crypto.randomUUID();

  return {
    id: scenarioId,
    opportunity_id: opportunityId,
    name: defaultScenario?.name?.trim() || 'Primary Team',
    is_default: true,
    fit_score: null,
    burnout_impact: null,
    tentative_assignments: (defaultScenario?.tentative_assignments ?? []).map(
      (assignment) => ({
        id: crypto.randomUUID(),
        scenario_id: scenarioId,
        consultant_id: assignment.consultant_id,
        role: assignment.role,
        start_date: assignment.start_date || startDate,
        end_date: assignment.end_date || endDate,
        allocation_percentage: assignment.allocation_percentage ?? 100,
      })
    ),
  };
}

export const useOpportunityStore = create<OpportunityStore>((set, get) => ({
  opportunities: [],
  loading: false,
  selectedOpportunityId: null,
  activeScenarioId: null,
  scenarios: [],

  setOpportunities: (opportunities) =>
    set({
      opportunities: opportunities.map((opportunity) => ({
        ...opportunity,
        stage: normalizePipelineStage(opportunity.stage),
      })),
    }),

  setScenarios: (scenarios) => set({ scenarios }),

  fetchOpportunities: async () => {
    set({ loading: true });
    try {
      const res = await authFetch('/api/opportunities');
      if (res.ok) {
        const data = await res.json();
        set({
          opportunities: data.map((opportunity: Opportunity) => ({
            ...opportunity,
            stage: normalizePipelineStage(opportunity.stage),
          })),
          loading: false,
        });
        return;
      }
    } catch {
      // Keep current state if API is unavailable
    }
    set({ loading: false });
  },

  fetchAllScenarios: async () => {
    try {
      const res = await authFetch('/api/opportunities/scenarios');
      if (res.ok) {
        const data = await res.json();
        set({ scenarios: data });
      }
    } catch {
      // Keep current scenarios if API is unavailable
    }
  },

  fetchScenarios: async (opportunityId) => {
    try {
      const res = await authFetch(`/api/opportunities/${opportunityId}/scenarios`);
      if (res.ok) {
        const data = await res.json();
        set((state) => ({
          scenarios: mergeScenarios(state.scenarios, opportunityId, data),
        }));
      }
    } catch {
      // Keep current scenarios if API is unavailable
    }
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
    try {
      const res = await authFetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created = await res.json();
        set((state) => ({
          opportunities: [...state.opportunities, created],
        }));
        await get().fetchScenarios(created.id);
        return created;
      }
    } catch {
      // Fall through to local-only creation
    }

    const { default_scenario, ...opportunityData } = data;
    const localOpportunity: Opportunity = {
      ...opportunityData,
      id: crypto.randomUUID(),
      stage: normalizePipelineStage(data.stage),
      is_bet: data.is_bet ?? false,
      notes: data.notes ?? null,
      estimated_value: data.estimated_value ?? null,
      converted_engagement_id: data.converted_engagement_id ?? null,
    };
    const localScenario = buildLocalDefaultScenario(
      localOpportunity.id,
      default_scenario,
      localOpportunity.start_date,
      localOpportunity.end_date
    );

    set((state) => ({
      opportunities: [...state.opportunities, localOpportunity],
      scenarios: [...state.scenarios, localScenario],
    }));

    return localOpportunity;
  },

  updateOpportunity: async (id, data) => {
    try {
      const res = await authFetch(`/api/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        set((state) => ({
          opportunities: state.opportunities.map((opportunity) =>
            opportunity.id === id ? updated : opportunity
          ),
        }));
        if (data.default_scenario !== undefined) {
          await get().fetchScenarios(id);
        }
        return;
      }
    } catch {
      // Fall through to local-only update
    }

    set((state) => {
      const opportunityData = { ...data };
      delete opportunityData.default_scenario;
      const opportunities = state.opportunities.map((opportunity) =>
        opportunity.id === id
          ? ({
              ...opportunity,
              ...opportunityData,
              stage:
                data.stage !== undefined
                  ? normalizePipelineStage(data.stage)
                  : opportunity.stage,
            } as Opportunity)
          : opportunity
      );

      if (data.default_scenario === undefined) {
        return { opportunities };
      }

      const existingDefaultScenario =
        state.scenarios.find(
          (scenario) => scenario.opportunity_id === id && scenario.is_default
        ) ??
        null;
      const baseOpportunity =
        opportunities.find((opportunity) => opportunity.id === id) ??
        state.opportunities.find((opportunity) => opportunity.id === id);

      if (!baseOpportunity) {
        return { opportunities };
      }

      const nextScenarioId = existingDefaultScenario?.id ?? crypto.randomUUID();

      const nextScenario: Scenario = {
        id: nextScenarioId,
        opportunity_id: id,
        name: data.default_scenario?.name?.trim() || existingDefaultScenario?.name || 'Primary Team',
        is_default: true,
        fit_score: existingDefaultScenario?.fit_score ?? null,
        burnout_impact: existingDefaultScenario?.burnout_impact ?? null,
        tentative_assignments: (
          data.default_scenario?.tentative_assignments ?? []
        ).map((assignment) => ({
          id: crypto.randomUUID(),
          scenario_id: nextScenarioId,
          consultant_id: assignment.consultant_id,
          role: assignment.role,
          start_date: assignment.start_date || baseOpportunity.start_date,
          end_date: assignment.end_date || baseOpportunity.end_date,
          allocation_percentage: assignment.allocation_percentage ?? 100,
        })),
      };

      return {
        opportunities,
        scenarios: [
          ...state.scenarios.filter(
            (scenario) => scenario.id !== existingDefaultScenario?.id
          ),
          nextScenario,
        ],
      };
    });
  },

  removeOpportunity: async (id) => {
    try {
      await authFetch(`/api/opportunities/${id}`, { method: 'DELETE' });
    } catch {
      // Still remove locally
    }
    set((state) => ({
      opportunities: state.opportunities.filter((opportunity) => opportunity.id !== id),
      scenarios: state.scenarios.filter((scenario) => scenario.opportunity_id !== id),
      selectedOpportunityId:
        state.selectedOpportunityId === id ? null : state.selectedOpportunityId,
      activeScenarioId:
        state.scenarios.some(
          (scenario) =>
            scenario.opportunity_id === id && scenario.id === state.activeScenarioId
        )
          ? null
          : state.activeScenarioId,
    }));
  },

  addScenario: async (opportunityId, data) => {
    try {
      const res = await authFetch(`/api/opportunities/${opportunityId}/scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created = await res.json();
        set((state) => ({ scenarios: [...state.scenarios, created] }));
        return created;
      }
    } catch {
      // Fall through to local-only creation
    }

    const localScenario: Scenario = {
      id: crypto.randomUUID(),
      opportunity_id: opportunityId,
      name: data.name,
      is_default: data.is_default ?? false,
      fit_score: null,
      burnout_impact: null,
      tentative_assignments: [],
    };
    set((state) => ({ scenarios: [...state.scenarios, localScenario] }));
    return localScenario;
  },

  updateScenario: async (scenarioId, data) => {
    const scenario = get().scenarios.find((candidate) => candidate.id === scenarioId);
    if (!scenario) {
      return;
    }

    try {
      const res = await authFetch(
        `/api/opportunities/${scenario.opportunity_id}/scenarios/${scenarioId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            is_default: data.is_default,
            fit_score: data.fit_score,
            burnout_impact: data.burnout_impact,
          }),
        }
      );
      if (res.ok) {
        const updated = await res.json();
        set((state) => ({
          scenarios: state.scenarios.map((candidate) =>
            candidate.id === scenarioId ? updated : candidate
          ),
        }));
        return;
      }
    } catch {
      // Fall through to local-only update
    }

    set((state) => ({
      scenarios: state.scenarios.map((candidate) =>
        candidate.id === scenarioId ? { ...candidate, ...data } : candidate
      ),
    }));
  },

  removeScenario: async (scenarioId) => {
    const scenario = get().scenarios.find((candidate) => candidate.id === scenarioId);
    try {
      if (scenario) {
        await authFetch(
          `/api/opportunities/${scenario.opportunity_id}/scenarios/${scenarioId}`,
          { method: 'DELETE' }
        );
      }
    } catch {
      // Still remove locally
    }

    set((state) => ({
      scenarios: state.scenarios.filter((candidate) => candidate.id !== scenarioId),
      activeScenarioId:
        state.activeScenarioId === scenarioId ? null : state.activeScenarioId,
    }));
  },

  addTentativeAssignment: async (scenarioId, data) => {
    const scenario = get().scenarios.find((candidate) => candidate.id === scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    try {
      const res = await authFetch(
        `/api/opportunities/${scenario.opportunity_id}/scenarios/${scenarioId}/assignments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      if (res.ok) {
        const created = await res.json();
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
      }
    } catch {
      // Fall through to local-only update
    }

    const localAssignment: TentativeAssignment = {
      id: crypto.randomUUID(),
      scenario_id: scenarioId,
      ...data,
    };
    set((state) => ({
      scenarios: state.scenarios.map((candidate) =>
        candidate.id === scenarioId
          ? {
              ...candidate,
              tentative_assignments: [
                ...candidate.tentative_assignments,
                localAssignment,
              ],
            }
          : candidate
      ),
    }));
    return localAssignment;
  },

  removeTentativeAssignment: async (scenarioId, assignmentId) => {
    const scenario = get().scenarios.find((candidate) => candidate.id === scenarioId);
    try {
      if (scenario) {
        await authFetch(
          `/api/opportunities/${scenario.opportunity_id}/scenarios/${scenarioId}/assignments/${assignmentId}`,
          { method: 'DELETE' }
        );
      }
    } catch {
      // Still remove locally
    }

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
    try {
      if (scenario) {
        const res = await authFetch(
          `/api/opportunities/${scenario.opportunity_id}/scenarios/${scenarioId}/assignments/${assignmentId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          }
        );
        if (res.ok) {
          const updated = await res.json();
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
          return;
        }
      }
    } catch {
      // Fall through to local-only update
    }

    set((state) => ({
      scenarios: state.scenarios.map((candidate) =>
        candidate.id === scenarioId
          ? {
              ...candidate,
              tentative_assignments: candidate.tentative_assignments.map(
                (assignment) =>
                  assignment.id === assignmentId
                    ? { ...assignment, ...data }
                    : assignment
              ),
            }
          : candidate
      ),
    }));
  },
}));
