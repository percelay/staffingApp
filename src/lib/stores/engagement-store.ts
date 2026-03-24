import { create } from 'zustand';
import { parseISO } from 'date-fns';
import type { Engagement } from '../types';
import { datesOverlap } from '../utils/date-helpers';

interface EngagementStore {
  engagements: Engagement[];
  loading: boolean;

  // Hydration
  setEngagements: (engagements: Engagement[]) => void;
  fetchEngagements: () => Promise<void>;

  // Selectors
  getById: (id: string) => Engagement | undefined;
  getActive: () => Engagement[];
  getByDateRange: (start: string, end: string) => Engagement[];

  // Mutations (API-backed)
  addEngagement: (data: Omit<Engagement, 'id'>) => Promise<Engagement>;
  updateEngagement: (id: string, data: Partial<Engagement>) => Promise<void>;
  removeEngagement: (id: string) => Promise<void>;
}

export const useEngagementStore = create<EngagementStore>((set, get) => ({
  engagements: [],
  loading: false,

  setEngagements: (engagements) => set({ engagements }),

  fetchEngagements: async () => {
    set({ loading: true });
    const res = await fetch('/api/engagements');
    const data = await res.json();
    set({ engagements: data, loading: false });
  },

  getById: (id) => get().engagements.find((e) => e.id === id),
  getActive: () => {
    const now = new Date();
    return get().engagements.filter((e) => {
      const start = parseISO(e.start_date);
      const end = parseISO(e.end_date);
      return start <= now && end >= now;
    });
  },
  getByDateRange: (start, end) =>
    get().engagements.filter((e) =>
      datesOverlap(e.start_date, e.end_date, start, end)
    ),

  addEngagement: async (data) => {
    try {
      const res = await fetch('/api/engagements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created = await res.json();
        set((s) => ({ engagements: [...s.engagements, created] }));
        return created;
      }
    } catch {
      // API unavailable — fall through to local-only creation
    }
    // Fallback: add to local store without DB persistence
    const local: Engagement = { ...data, id: crypto.randomUUID() };
    set((s) => ({ engagements: [...s.engagements, local] }));
    return local;
  },

  updateEngagement: async (id, data) => {
    try {
      const res = await fetch(`/api/engagements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        set((s) => ({
          engagements: s.engagements.map((e) => (e.id === id ? updated : e)),
        }));
        return;
      }
    } catch {
      // API unavailable — fall through to local-only update
    }
    set((s) => ({
      engagements: s.engagements.map((e) => (e.id === id ? { ...e, ...data } as Engagement : e)),
    }));
  },

  removeEngagement: async (id) => {
    try {
      await fetch(`/api/engagements/${id}`, { method: 'DELETE' });
    } catch {
      // API unavailable — still remove locally
    }
    set((s) => ({
      engagements: s.engagements.filter((e) => e.id !== id),
    }));
  },
}));
