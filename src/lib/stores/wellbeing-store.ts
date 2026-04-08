import { create } from 'zustand';
import {
  createWellbeingSignal,
  fetchWellbeingSignals as fetchWellbeingSignalsResource,
} from '@/lib/api/resources/wellbeing';
import type { WellbeingSignal } from '../types';
import { getErrorMessage, type ResourceStatus } from './resource-state';

interface WellbeingStore {
  signals: WellbeingSignal[];
  status: ResourceStatus;
  error: string | null;

  setSignals: (signals: WellbeingSignal[]) => void;
  fetchSignals: () => Promise<void>;
  refetch: () => Promise<void>;
  reset: () => void;

  getByConsultant: (consultantId: string) => WellbeingSignal[];
  getHighSeverity: () => WellbeingSignal[];

  addSignal: (data: Omit<WellbeingSignal, 'id'>) => Promise<void>;
}

export const useWellbeingStore = create<WellbeingStore>((set, get) => ({
  signals: [],
  status: 'idle',
  error: null,

  setSignals: (signals) => set({ signals, status: 'ready', error: null }),

  fetchSignals: async () => {
    set({ status: 'loading', error: null });
    try {
      const signals = await fetchWellbeingSignalsResource();
      set({ signals, status: 'ready', error: null });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error) });
      throw error;
    }
  },

  refetch: async () => get().fetchSignals(),
  reset: () => set({ signals: [], status: 'idle', error: null }),

  getByConsultant: (consultantId) =>
    get().signals.filter((signal) => signal.consultant_id === consultantId),
  getHighSeverity: () =>
    get().signals.filter((signal) => signal.severity === 'high'),

  addSignal: async (data) => {
    const signal = await createWellbeingSignal(data);
    set((state) => ({ signals: [...state.signals, signal] }));
  },
}));
