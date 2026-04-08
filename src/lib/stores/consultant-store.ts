import { create } from 'zustand';
import { authFetchJson } from '../api/json-fetch';
import type { Consultant, PracticeArea, SeniorityLevel } from '../types';

interface ConsultantStore {
  consultants: Consultant[];
  loading: boolean;

  // Hydration
  setConsultants: (consultants: Consultant[]) => void;
  fetchConsultants: () => Promise<void>;

  // Selectors
  getById: (id: string) => Consultant | undefined;
  getByPracticeArea: (area: PracticeArea) => Consultant[];
  getBySeniority: (level: SeniorityLevel) => Consultant[];

  // Mutations (API-backed)
  addConsultant: (data: Omit<Consultant, 'id'>) => Promise<Consultant>;
  updateConsultant: (id: string, data: Partial<Consultant>) => Promise<void>;
  removeConsultant: (id: string) => Promise<void>;
  updateSkills: (id: string, skills: string[]) => Promise<void>;
  updateGoals: (id: string, goals: string[]) => Promise<void>;
}

export const useConsultantStore = create<ConsultantStore>((set, get) => ({
  consultants: [],
  loading: false,

  setConsultants: (consultants) => set({ consultants }),

  fetchConsultants: async () => {
    set({ loading: true });
    try {
      const data = await authFetchJson<Consultant[]>('/api/consultants');
      set({ consultants: data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  getById: (id) => get().consultants.find((c) => c.id === id),
  getByPracticeArea: (area) =>
    get().consultants.filter((c) => c.practice_area === area),
  getBySeniority: (level) =>
    get().consultants.filter((c) => c.seniority_level === level),

  addConsultant: async (data) => {
    const created = await authFetchJson<Consultant>('/api/consultants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    set((s) => ({ consultants: [...s.consultants, created] }));
    return created;
  },

  updateConsultant: async (id, data) => {
    const updated = await authFetchJson<Consultant>(`/api/consultants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    set((s) => ({
      consultants: s.consultants.map((c) => (c.id === id ? updated : c)),
    }));
  },

  removeConsultant: async (id) => {
    await authFetchJson<Consultant>(`/api/consultants/${id}`, { method: 'DELETE' });
    set((s) => ({
      consultants: s.consultants.filter((c) => c.id !== id),
    }));
  },

  updateSkills: async (id, skills) => {
    const updated = await authFetchJson<Consultant>(`/api/consultants/${id}/skills`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills }),
    });
    set((s) => ({
      consultants: s.consultants.map((c) => (c.id === id ? updated : c)),
    }));
  },

  updateGoals: async (id, goals) => {
    const updated = await authFetchJson<Consultant>(`/api/consultants/${id}/goals`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals }),
    });
    set((s) => ({
      consultants: s.consultants.map((c) => (c.id === id ? updated : c)),
    }));
  },
}));
