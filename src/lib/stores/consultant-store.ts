import { create } from 'zustand';
import { authFetch } from '../api/auth-fetch';
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
    const res = await authFetch('/api/consultants');
    const data = await res.json();
    set({ consultants: data, loading: false });
  },

  getById: (id) => get().consultants.find((c) => c.id === id),
  getByPracticeArea: (area) =>
    get().consultants.filter((c) => c.practice_area === area),
  getBySeniority: (level) =>
    get().consultants.filter((c) => c.seniority_level === level),

  addConsultant: async (data) => {
    const res = await authFetch('/api/consultants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const created = await res.json();
    set((s) => ({ consultants: [...s.consultants, created] }));
    return created;
  },

  updateConsultant: async (id, data) => {
    const res = await authFetch(`/api/consultants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    set((s) => ({
      consultants: s.consultants.map((c) => (c.id === id ? updated : c)),
    }));
  },

  removeConsultant: async (id) => {
    await authFetch(`/api/consultants/${id}`, { method: 'DELETE' });
    set((s) => ({
      consultants: s.consultants.filter((c) => c.id !== id),
    }));
  },

  updateSkills: async (id, skills) => {
    const res = await authFetch(`/api/consultants/${id}/skills`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills }),
    });
    const updated = await res.json();
    set((s) => ({
      consultants: s.consultants.map((c) => (c.id === id ? updated : c)),
    }));
  },

  updateGoals: async (id, goals) => {
    const res = await authFetch(`/api/consultants/${id}/goals`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals }),
    });
    const updated = await res.json();
    set((s) => ({
      consultants: s.consultants.map((c) => (c.id === id ? updated : c)),
    }));
  },
}));
