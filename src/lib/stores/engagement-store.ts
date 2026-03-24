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
    const res = await fetch('/api/engagements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const created = await res.json();
    set((s) => ({ engagements: [...s.engagements, created] }));
    return created;
  },

  updateEngagement: async (id, data) => {
    const res = await fetch(`/api/engagements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    set((s) => ({
      engagements: s.engagements.map((e) => (e.id === id ? updated : e)),
    }));
  },

  removeEngagement: async (id) => {
    await fetch(`/api/engagements/${id}`, { method: 'DELETE' });
    set((s) => ({
      engagements: s.engagements.filter((e) => e.id !== id),
    }));
  },
}));
