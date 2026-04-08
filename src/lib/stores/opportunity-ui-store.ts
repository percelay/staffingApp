import { create } from 'zustand';

interface OpportunityUIStore {
  selectedOpportunityId: string | null;
  activeScenarioId: string | null;
  setSelectedOpportunityId: (id: string | null) => void;
  setActiveScenarioId: (id: string | null) => void;
  reset: () => void;
}

export const useOpportunityUIStore = create<OpportunityUIStore>((set) => ({
  selectedOpportunityId: null,
  activeScenarioId: null,
  setSelectedOpportunityId: (selectedOpportunityId) =>
    set({ selectedOpportunityId }),
  setActiveScenarioId: (activeScenarioId) => set({ activeScenarioId }),
  reset: () =>
    set({
      selectedOpportunityId: null,
      activeScenarioId: null,
    }),
}));
