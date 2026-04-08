import { create } from 'zustand';
import { OPPORTUNITY_COLOR_PALETTE } from '@/lib/constants/staffing';
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
import { useAppStore } from './app-store';
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

function createLocalId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function buildDemoTentativeAssignment(
  scenarioId: string,
  assignment: TentativeAssignmentInput
): TentativeAssignment {
  return {
    id: createLocalId('tentative-assignment'),
    scenario_id: scenarioId,
    consultant_id: assignment.consultant_id,
    role: assignment.role,
    start_date: assignment.start_date,
    end_date: assignment.end_date,
    allocation_percentage: assignment.allocation_percentage,
  };
}

function isDemoBootstrapSource() {
  return useAppStore.getState().bootstrapSource === 'demo';
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
    if (isDemoBootstrapSource()) {
      const opportunityId = createLocalId('opportunity');
      const defaultScenarioInput =
        data.default_scenario === undefined || data.default_scenario === null
          ? null
          : data.default_scenario;
      const opportunity = normalizeOpportunity({
        id: opportunityId,
        client_name: data.client_name,
        project_name: data.project_name,
        start_date: data.start_date,
        end_date: data.end_date,
        stage: normalizePipelineStage(data.stage ?? 'identified'),
        probability: data.probability ?? 25,
        estimated_value: data.estimated_value ?? null,
        required_skills: data.required_skills ?? [],
        color: data.color ?? OPPORTUNITY_COLOR_PALETTE[0],
        is_bet: data.is_bet ?? false,
        notes: data.notes ?? null,
        converted_engagement_id: data.converted_engagement_id ?? null,
      });

      const scenarios =
        defaultScenarioInput === null
          ? []
          : (() => {
              const scenarioId = createLocalId('scenario');

              return [
                normalizeScenario({
                  id: scenarioId,
                  opportunity_id: opportunityId,
                  name: defaultScenarioInput.name?.trim() || 'Primary Team',
                  is_default: true,
                  fit_score: null,
                  burnout_impact: null,
                  tentative_assignments:
                    defaultScenarioInput.tentative_assignments.map(
                      (assignment) =>
                        buildDemoTentativeAssignment(scenarioId, assignment)
                    ),
                }),
              ];
            })();

      set((state) => ({
        opportunities: [...state.opportunities, opportunity],
        scenarios: [...state.scenarios, ...scenarios],
      }));

      return opportunity;
    }

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
    if (isDemoBootstrapSource()) {
      const existingOpportunity = get().opportunities.find(
        (candidate) => candidate.id === id
      );

      if (!existingOpportunity) {
        throw new Error('Opportunity not found');
      }

      const updatedOpportunity = normalizeOpportunity({
        ...existingOpportunity,
        ...(data.client_name !== undefined
          ? { client_name: data.client_name }
          : {}),
        ...(data.project_name !== undefined
          ? { project_name: data.project_name }
          : {}),
        ...(data.start_date !== undefined
          ? { start_date: data.start_date }
          : {}),
        ...(data.end_date !== undefined ? { end_date: data.end_date } : {}),
        ...(data.stage !== undefined
          ? { stage: normalizePipelineStage(data.stage) }
          : {}),
        ...(data.probability !== undefined
          ? { probability: data.probability }
          : {}),
        ...(data.estimated_value !== undefined
          ? { estimated_value: data.estimated_value }
          : {}),
        ...(data.required_skills !== undefined
          ? { required_skills: data.required_skills }
          : {}),
        ...(data.color !== undefined ? { color: data.color } : {}),
        ...(data.is_bet !== undefined ? { is_bet: data.is_bet } : {}),
        ...(data.notes !== undefined ? { notes: data.notes ?? null } : {}),
        ...(data.converted_engagement_id !== undefined
          ? { converted_engagement_id: data.converted_engagement_id }
          : {}),
      });

      set((state) => {
        let scenarios = state.scenarios;

        if (data.default_scenario !== undefined && data.default_scenario !== null) {
          const defaultScenarioInput = data.default_scenario;
          const existingDefaultScenario =
            state.scenarios.find(
              (scenario) => scenario.opportunity_id === id && scenario.is_default
            ) ??
            state.scenarios.find((scenario) => scenario.opportunity_id === id);

          if (existingDefaultScenario) {
            scenarios = state.scenarios.map((scenario) =>
              scenario.id === existingDefaultScenario.id
                ? normalizeScenario({
                    ...scenario,
                    name: defaultScenarioInput.name?.trim() || 'Primary Team',
                    is_default: true,
                    tentative_assignments:
                      defaultScenarioInput.tentative_assignments.map(
                        (assignment) =>
                          buildDemoTentativeAssignment(scenario.id, assignment)
                      ),
                  })
                : scenario
            );
          } else {
            const scenarioId = createLocalId('scenario');
            scenarios = [
              ...state.scenarios,
              normalizeScenario({
                id: scenarioId,
                opportunity_id: id,
                name: defaultScenarioInput.name?.trim() || 'Primary Team',
                is_default: true,
                fit_score: null,
                burnout_impact: null,
                tentative_assignments:
                  defaultScenarioInput.tentative_assignments.map((assignment) =>
                    buildDemoTentativeAssignment(scenarioId, assignment)
                  ),
              }),
            ];
          }
        }

        return {
          opportunities: state.opportunities.map((candidate) =>
            candidate.id === id ? updatedOpportunity : candidate
          ),
          scenarios,
        };
      });

      return;
    }

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
    if (isDemoBootstrapSource()) {
      set((state) => ({
        opportunities: state.opportunities.filter(
          (opportunity) => opportunity.id !== id
        ),
        scenarios: state.scenarios.filter(
          (scenario) => scenario.opportunity_id !== id
        ),
      }));
      return;
    }

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
    if (isDemoBootstrapSource()) {
      const scenario = normalizeScenario({
        id: createLocalId('scenario'),
        opportunity_id: opportunityId,
        name: data.name.trim(),
        is_default: data.is_default ?? false,
        fit_score: null,
        burnout_impact: null,
        tentative_assignments: [],
      });

      set((state) => ({
        scenarios: state.scenarios.map((candidate) =>
          scenario.is_default && candidate.opportunity_id === opportunityId
            ? { ...candidate, is_default: false }
            : candidate
        ).concat(scenario),
      }));

      return scenario;
    }

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

    if (isDemoBootstrapSource()) {
      set((state) => ({
        scenarios: state.scenarios.map((candidate) => {
          if (data.is_default && candidate.opportunity_id === scenario.opportunity_id) {
            return { ...candidate, is_default: candidate.id === scenarioId };
          }

          if (candidate.id !== scenarioId) {
            return candidate;
          }

          return normalizeScenario({
            ...candidate,
            ...data,
          });
        }),
      }));
      return;
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

    if (isDemoBootstrapSource()) {
      set((state) => ({
        scenarios: state.scenarios.filter(
          (candidate) => candidate.id !== scenarioId
        ),
      }));
      return;
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

    if (isDemoBootstrapSource()) {
      const assignment = buildDemoTentativeAssignment(scenarioId, data);

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

    if (isDemoBootstrapSource()) {
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
      return;
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

    if (isDemoBootstrapSource()) {
      set((state) => ({
        scenarios: state.scenarios.map((candidate) =>
          candidate.id === scenarioId
            ? {
                ...candidate,
                tentative_assignments: candidate.tentative_assignments.map(
                  (current) =>
                    current.id === assignmentId
                      ? {
                          ...current,
                          ...data,
                        }
                      : current
                ),
              }
            : candidate
        ),
      }));
      return;
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
