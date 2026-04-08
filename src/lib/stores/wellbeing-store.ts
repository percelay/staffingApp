import { create } from 'zustand';
import { authFetchJson } from '../api/json-fetch';
import type { WellbeingSignal } from '../types';

interface WellbeingStore {
  signals: WellbeingSignal[];
  loading: boolean;

  // Hydration
  setSignals: (signals: WellbeingSignal[]) => void;
  fetchSignals: () => Promise<void>;

  // Selectors
  getByConsultant: (consultantId: string) => WellbeingSignal[];
  getHighSeverity: () => WellbeingSignal[];

  // Mutations (API-backed)
  addSignal: (data: Omit<WellbeingSignal, 'id'>) => Promise<void>;
}

export const useWellbeingStore = create<WellbeingStore>((set, get) => ({
  signals: [],
  loading: false,

  setSignals: (signals) => set({ signals }),

  fetchSignals: async () => {
    set({ loading: true });
    try {
      const data = await authFetchJson<WellbeingSignal[]>('/api/wellbeing');
      set({ signals: data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  getByConsultant: (consultantId) =>
    get().signals.filter((s) => s.consultant_id === consultantId),
  getHighSeverity: () =>
    get().signals.filter((s) => s.severity === 'high'),

  addSignal: async (data) => {
    const created = await authFetchJson<WellbeingSignal>('/api/wellbeing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    set((s) => ({ signals: [...s.signals, created] }));
  },
}));
