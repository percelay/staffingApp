import { create } from 'zustand';
import type { Consultant, PracticeArea, SeniorityLevel } from '../types';

interface ConsultantStore {
  consultants: Consultant[];
  setConsultants: (consultants: Consultant[]) => void;
  getById: (id: string) => Consultant | undefined;
  getByPracticeArea: (area: PracticeArea) => Consultant[];
  getBySeniority: (level: SeniorityLevel) => Consultant[];
}

export const useConsultantStore = create<ConsultantStore>((set, get) => ({
  consultants: [],
  setConsultants: (consultants) => set({ consultants }),
  getById: (id) => get().consultants.find((c) => c.id === id),
  getByPracticeArea: (area) =>
    get().consultants.filter((c) => c.practice_area === area),
  getBySeniority: (level) =>
    get().consultants.filter((c) => c.seniority_level === level),
}));
