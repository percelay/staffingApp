import { create } from 'zustand';
import { authFetch } from '../api/auth-fetch';
import {
  normalizePipelineStage,
  type Opportunity,
  type PipelineStage,
  type Scenario,
  type TentativeAssignment,
  ACTIVE_PIPELINE_STAGES,
} from '../types/opportunity';
import type { AssignmentRole } from '../types/assignment';

interface OpportunityStore {
  opportunities: Opportunity[];
  loading: boolean;
  selectedOpportunityId: string | null;
  activeScenarioId: string | null;

  // Hydration
  setOpportunities: (opportunities: Opportunity[]) => void;
  fetchOpportunities: () => Promise<void>;

  // Selectors
  getById: (id: string) => Opportunity | undefined;
  getByStage: (stage: PipelineStage) => Opportunity[];
  getActive: () => Opportunity[];

  // Selection
  setSelectedOpportunityId: (id: string | null) => void;
  setActiveScenarioId: (id: string | null) => void;

  // Mutations (API-backed with local fallback)
  addOpportunity: (data: Omit<Opportunity, 'id'>) => Promise<Opportunity>;
  updateOpportunity: (id: string, data: Partial<Opportunity>) => Promise<void>;
  removeOpportunity: (id: string) => Promise<void>;

  // Scenarios (local-first for Phase 1)
  scenarios: Scenario[];
  fetchScenarios: (opportunityId: string) => Promise<void>;
  addScenario: (
    opportunityId: string,
    data: { name: string; is_default?: boolean }
  ) => Promise<Scenario>;
  updateScenario: (scenarioId: string, data: Partial<Scenario>) => Promise<void>;
  removeScenario: (scenarioId: string) => Promise<void>;

  // Tentative assignments within a scenario
  addTentativeAssignment: (
    scenarioId: string,
    data: {
      consultant_id: string;
      role: AssignmentRole;
      start_date: string;
      end_date: string;
      allocation_percentage: number;
    }
  ) => void;
  removeTentativeAssignment: (scenarioId: string, assignmentId: string) => void;
  updateTentativeAssignment: (
    scenarioId: string,
    assignmentId: string,
    data: Partial<TentativeAssignment>
  ) => void;
}

export const useOpportunityStore = create<OpportunityStore>((set, get) => ({
  opportunities: [],
  loading: false,
  selectedOpportunityId: null,
  activeScenarioId: null,
  scenarios: [],

  setOpportunities: (opportunities) =>
    set({
      opportunities: opportunities.map((o) => ({
        ...o,
        stage: normalizePipelineStage(o.stage),
      })),
    }),

  fetchOpportunities: async () => {
    set({ loading: true });
    try {
      const res = await authFetch('/api/opportunities');
      if (res.ok) {
        const data = await res.json();
        set({ opportunities: data, loading: false });
        return;
      }
    } catch {
      // API unavailable — keep current state
    }
    set({ loading: false });
  },

  getById: (id) => get().opportunities.find((o) => o.id === id),
  getByStage: (stage) => get().opportunities.filter((o) => o.stage === stage),
  getActive: () =>
    get().opportunities.filter((o) =>
      ACTIVE_PIPELINE_STAGES.includes(o.stage)
    ),

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
        set((s) => ({ opportunities: [...s.opportunities, created] }));
        return created;
      }
    } catch {
      // API unavailable — fall through to local creation
    }
    const local: Opportunity = {
      ...data,
      id: crypto.randomUUID(),
      stage: normalizePipelineStage(data.stage),
      is_bet: data.is_bet ?? false,
    };
    set((s) => ({ opportunities: [...s.opportunities, local] }));
    return local;
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
        set((s) => ({
          opportunities: s.opportunities.map((o) =>
            o.id === id ? updated : o
          ),
        }));
        return;
      }
    } catch {
      // API unavailable — local-only update
    }
    set((s) => ({
      opportunities: s.opportunities.map((o) =>
        o.id === id
          ? ({
              ...o,
              ...data,
              stage:
                data.stage !== undefined
                  ? normalizePipelineStage(data.stage)
                  : o.stage,
            } as Opportunity)
          : o
      ),
    }));
  },

  removeOpportunity: async (id) => {
    try {
      await authFetch(`/api/opportunities/${id}`, { method: 'DELETE' });
    } catch {
      // API unavailable — still remove locally
    }
    set((s) => ({
      opportunities: s.opportunities.filter((o) => o.id !== id),
      selectedOpportunityId:
        s.selectedOpportunityId === id ? null : s.selectedOpportunityId,
    }));
  },

  // ─── Scenarios (local-first, API-backed when available) ───

  fetchScenarios: async (opportunityId) => {
    try {
      const res = await authFetch(
        `/api/opportunities/${opportunityId}/scenarios`
      );
      if (res.ok) {
        const data = await res.json();
        set({ scenarios: data });
        return;
      }
    } catch {
      // keep current scenarios
    }
  },

  addScenario: async (opportunityId, data) => {
    try {
      const res = await authFetch(
        `/api/opportunities/${opportunityId}/scenarios`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      if (res.ok) {
        const created = await res.json();
        set((s) => ({ scenarios: [...s.scenarios, created] }));
        return created;
      }
    } catch {
      // local fallback
    }
    const local: Scenario = {
      id: crypto.randomUUID(),
      opportunity_id: opportunityId,
      name: data.name,
      is_default: data.is_default ?? false,
      fit_score: null,
      burnout_impact: null,
      tentative_assignments: [],
    };
    set((s) => ({ scenarios: [...s.scenarios, local] }));
    return local;
  },

  updateScenario: async (scenarioId, data) => {
    set((s) => ({
      scenarios: s.scenarios.map((sc) =>
        sc.id === scenarioId ? { ...sc, ...data } : sc
      ),
    }));
  },

  removeScenario: async (scenarioId) => {
    try {
      // Find the scenario to get its opportunity_id for the URL
      const scenario = get().scenarios.find((s) => s.id === scenarioId);
      if (scenario) {
        await authFetch(
          `/api/opportunities/${scenario.opportunity_id}/scenarios/${scenarioId}`,
          { method: 'DELETE' }
        );
      }
    } catch {
      // still remove locally
    }
    set((s) => ({
      scenarios: s.scenarios.filter((sc) => sc.id !== scenarioId),
      activeScenarioId:
        s.activeScenarioId === scenarioId ? null : s.activeScenarioId,
    }));
  },

  // ─── Tentative Assignments (local state) ──────────────────

  addTentativeAssignment: (scenarioId, data) => {
    const ta: TentativeAssignment = {
      id: crypto.randomUUID(),
      scenario_id: scenarioId,
      ...data,
    };
    set((s) => ({
      scenarios: s.scenarios.map((sc) =>
        sc.id === scenarioId
          ? {
              ...sc,
              tentative_assignments: [...sc.tentative_assignments, ta],
            }
          : sc
      ),
    }));
  },

  removeTentativeAssignment: (scenarioId, assignmentId) => {
    set((s) => ({
      scenarios: s.scenarios.map((sc) =>
        sc.id === scenarioId
          ? {
              ...sc,
              tentative_assignments: sc.tentative_assignments.filter(
                (ta) => ta.id !== assignmentId
              ),
            }
          : sc
      ),
    }));
  },

  updateTentativeAssignment: (scenarioId, assignmentId, data) => {
    set((s) => ({
      scenarios: s.scenarios.map((sc) =>
        sc.id === scenarioId
          ? {
              ...sc,
              tentative_assignments: sc.tentative_assignments.map((ta) =>
                ta.id === assignmentId ? { ...ta, ...data } : ta
              ),
            }
          : sc
      ),
    }));
  },
}));
