import { create } from 'zustand';
import { parseISO } from 'date-fns';
import type { Engagement } from '../types';
import { datesOverlap } from '../utils/date-helpers';

interface EngagementStore {
  engagements: Engagement[];
  setEngagements: (engagements: Engagement[]) => void;
  getById: (id: string) => Engagement | undefined;
  getActive: () => Engagement[];
  getByDateRange: (start: string, end: string) => Engagement[];
}

export const useEngagementStore = create<EngagementStore>((set, get) => ({
  engagements: [],
  setEngagements: (engagements) => set({ engagements }),
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
}));
