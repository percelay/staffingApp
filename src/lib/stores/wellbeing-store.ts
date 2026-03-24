import { create } from 'zustand';
import type { WellbeingSignal } from '../types';

interface WellbeingStore {
  signals: WellbeingSignal[];
  setSignals: (signals: WellbeingSignal[]) => void;
  getByConsultant: (consultantId: string) => WellbeingSignal[];
  getHighSeverity: () => WellbeingSignal[];
}

export const useWellbeingStore = create<WellbeingStore>((set, get) => ({
  signals: [],
  setSignals: (signals) => set({ signals }),
  getByConsultant: (consultantId) =>
    get().signals.filter((s) => s.consultant_id === consultantId),
  getHighSeverity: () =>
    get().signals.filter((s) => s.severity === 'high'),
}));
