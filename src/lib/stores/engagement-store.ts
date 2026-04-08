import { create } from 'zustand';
import { parseISO } from 'date-fns';
import {
  createEngagement,
  deleteEngagement,
  fetchEngagements as fetchEngagementsResource,
  updateEngagement as updateEngagementResource,
} from '@/lib/api/resources/engagements';
import { normalizeEngagementStatus, type Engagement } from '../types';
import { datesOverlap } from '../utils/date-helpers';
import { getErrorMessage, type ResourceStatus } from './resource-state';

interface EngagementStore {
  engagements: Engagement[];
  status: ResourceStatus;
  error: string | null;

  setEngagements: (engagements: Engagement[]) => void;
  fetchEngagements: () => Promise<void>;
  refetch: () => Promise<void>;
  reset: () => void;

  getById: (id: string) => Engagement | undefined;
  getActive: () => Engagement[];
  getByDateRange: (start: string, end: string) => Engagement[];

  addEngagement: (data: Omit<Engagement, 'id'>) => Promise<Engagement>;
  updateEngagement: (id: string, data: Partial<Engagement>) => Promise<void>;
  removeEngagement: (id: string) => Promise<void>;
}

function normalizeEngagement(engagement: Engagement): Engagement {
  return {
    ...engagement,
    status: normalizeEngagementStatus(engagement.status),
  };
}

export const useEngagementStore = create<EngagementStore>((set, get) => ({
  engagements: [],
  status: 'idle',
  error: null,

  setEngagements: (engagements) =>
    set({
      engagements: engagements.map(normalizeEngagement),
      status: 'ready',
      error: null,
    }),

  fetchEngagements: async () => {
    set({ status: 'loading', error: null });
    try {
      const engagements = await fetchEngagementsResource();
      set({
        engagements: engagements.map(normalizeEngagement),
        status: 'ready',
        error: null,
      });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error) });
      throw error;
    }
  },

  refetch: async () => get().fetchEngagements(),
  reset: () => set({ engagements: [], status: 'idle', error: null }),

  getById: (id) => get().engagements.find((engagement) => engagement.id === id),
  getActive: () => {
    const now = new Date();
    return get().engagements.filter((engagement) => {
      const start = parseISO(engagement.start_date);
      const end = parseISO(engagement.end_date);
      return start <= now && end >= now;
    });
  },
  getByDateRange: (start, end) =>
    get().engagements.filter((engagement) =>
      datesOverlap(engagement.start_date, engagement.end_date, start, end)
    ),

  addEngagement: async (data) => {
    const engagement = normalizeEngagement(await createEngagement(data));
    set((state) => ({ engagements: [...state.engagements, engagement] }));
    return engagement;
  },

  updateEngagement: async (id, data) => {
    const engagement = normalizeEngagement(
      await updateEngagementResource(id, data)
    );
    set((state) => ({
      engagements: state.engagements.map((candidate) =>
        candidate.id === id ? engagement : candidate
      ),
    }));
  },

  removeEngagement: async (id) => {
    await deleteEngagement(id);
    set((state) => ({
      engagements: state.engagements.filter((candidate) => candidate.id !== id),
    }));
  },
}));
