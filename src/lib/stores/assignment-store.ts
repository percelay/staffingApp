import { create } from 'zustand';
import type { Assignment } from '../types';

interface AssignmentStore {
  assignments: Assignment[];
  loading: boolean;

  // Hydration
  setAssignments: (assignments: Assignment[]) => void;
  fetchAssignments: () => Promise<void>;

  // Selectors
  getByConsultant: (consultantId: string) => Assignment[];
  getByEngagement: (engagementId: string) => Assignment[];

  // Mutations (API-backed)
  createAssignment: (data: Omit<Assignment, 'id'>) => Promise<Assignment>;
  updateAssignment: (id: string, data: Partial<Assignment>) => Promise<void>;
  removeAssignment: (assignmentId: string) => Promise<void>;
  moveAssignment: (
    assignmentId: string,
    newConsultantId: string,
    newStartDate: string,
    newEndDate: string
  ) => Promise<void>;
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  assignments: [],
  loading: false,

  setAssignments: (assignments) => set({ assignments }),

  fetchAssignments: async () => {
    set({ loading: true });
    const res = await fetch('/api/assignments');
    const data = await res.json();
    set({ assignments: data, loading: false });
  },

  getByConsultant: (consultantId) =>
    get().assignments.filter((a) => a.consultant_id === consultantId),
  getByEngagement: (engagementId) =>
    get().assignments.filter((a) => a.engagement_id === engagementId),

  createAssignment: async (data) => {
    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const created = await res.json();
    set((s) => ({ assignments: [...s.assignments, created] }));
    return created;
  },

  updateAssignment: async (id, data) => {
    const res = await fetch(`/api/assignments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    set((s) => ({
      assignments: s.assignments.map((a) => (a.id === id ? updated : a)),
    }));
  },

  removeAssignment: async (assignmentId) => {
    await fetch(`/api/assignments/${assignmentId}`, { method: 'DELETE' });
    set((s) => ({
      assignments: s.assignments.filter((a) => a.id !== assignmentId),
    }));
  },

  moveAssignment: async (assignmentId, newConsultantId, newStartDate, newEndDate) => {
    const res = await fetch(`/api/assignments/${assignmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultant_id: newConsultantId,
        start_date: newStartDate,
        end_date: newEndDate,
      }),
    });
    const updated = await res.json();
    set((s) => ({
      assignments: s.assignments.map((a) =>
        a.id === assignmentId ? updated : a
      ),
    }));
  },
}));
