import { create } from 'zustand';
import {
  createConsultant,
  deleteConsultant,
  fetchConsultants as fetchConsultantsResource,
  replaceConsultantGoals,
  replaceConsultantSkills,
  updateConsultant as updateConsultantResource,
} from '@/lib/api/resources/consultants';
import type { Consultant, PracticeArea, SeniorityLevel } from '../types';
import { getErrorMessage, type ResourceStatus } from './resource-state';

interface ConsultantStore {
  consultants: Consultant[];
  status: ResourceStatus;
  error: string | null;

  setConsultants: (consultants: Consultant[]) => void;
  fetchConsultants: () => Promise<void>;
  refetch: () => Promise<void>;
  reset: () => void;

  getById: (id: string) => Consultant | undefined;
  getByPracticeArea: (area: PracticeArea) => Consultant[];
  getBySeniority: (level: SeniorityLevel) => Consultant[];

  addConsultant: (data: Omit<Consultant, 'id'>) => Promise<Consultant>;
  updateConsultant: (id: string, data: Partial<Consultant>) => Promise<void>;
  removeConsultant: (id: string) => Promise<void>;
  updateSkills: (id: string, skills: string[]) => Promise<void>;
  updateGoals: (id: string, goals: string[]) => Promise<void>;
}

export const useConsultantStore = create<ConsultantStore>((set, get) => ({
  consultants: [],
  status: 'idle',
  error: null,

  setConsultants: (consultants) =>
    set({
      consultants,
      status: 'ready',
      error: null,
    }),

  fetchConsultants: async () => {
    set({ status: 'loading', error: null });
    try {
      const consultants = await fetchConsultantsResource();
      set({ consultants, status: 'ready', error: null });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error) });
      throw error;
    }
  },

  refetch: async () => get().fetchConsultants(),
  reset: () => set({ consultants: [], status: 'idle', error: null }),

  getById: (id) => get().consultants.find((consultant) => consultant.id === id),
  getByPracticeArea: (area) =>
    get().consultants.filter((consultant) => consultant.practice_area === area),
  getBySeniority: (level) =>
    get().consultants.filter(
      (consultant) => consultant.seniority_level === level
    ),

  addConsultant: async (data) => {
    const consultant = await createConsultant(data);
    set((state) => ({
      consultants: [...state.consultants, consultant],
    }));
    return consultant;
  },

  updateConsultant: async (id, data) => {
    const consultant = await updateConsultantResource(id, data);
    set((state) => ({
      consultants: state.consultants.map((candidate) =>
        candidate.id === id ? consultant : candidate
      ),
    }));
  },

  removeConsultant: async (id) => {
    await deleteConsultant(id);
    set((state) => ({
      consultants: state.consultants.filter((candidate) => candidate.id !== id),
    }));
  },

  updateSkills: async (id, skills) => {
    const consultant = await replaceConsultantSkills(id, skills);
    set((state) => ({
      consultants: state.consultants.map((candidate) =>
        candidate.id === id ? consultant : candidate
      ),
    }));
  },

  updateGoals: async (id, goals) => {
    const consultant = await replaceConsultantGoals(id, goals);
    set((state) => ({
      consultants: state.consultants.map((candidate) =>
        candidate.id === id ? consultant : candidate
      ),
    }));
  },
}));
