import { create } from 'zustand';
import { authFetch } from '../api/auth-fetch';
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
    const res = await authFetch('/api/wellbeing');
    const data = await res.json();
    set({ signals: data, loading: false });
  },

  getByConsultant: (consultantId) =>
    get().signals.filter((s) => s.consultant_id === consultantId),
  getHighSeverity: () =>
    get().signals.filter((s) => s.severity === 'high'),

  addSignal: async (data) => {
    const res = await authFetch('/api/wellbeing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const created = await res.json();
    set((s) => ({ signals: [...s.signals, created] }));
  },
}));
