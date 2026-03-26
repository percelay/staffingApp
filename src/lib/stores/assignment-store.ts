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
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created = await res.json();
        set((s) => ({ assignments: [...s.assignments, created] }));
        return created;
      }
    } catch {
      // API unavailable — fall through to local-only creation
    }
    const local: Assignment = { ...data, id: crypto.randomUUID() };
    set((s) => ({ assignments: [...s.assignments, local] }));
    return local;
  },

  updateAssignment: async (id, data) => {
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        set((s) => ({
          assignments: s.assignments.map((a) => (a.id === id ? updated : a)),
        }));
        return;
      }
    } catch {
      // API unavailable — fall through to local-only update
    }
    set((s) => ({
      assignments: s.assignments.map((a) => (a.id === id ? { ...a, ...data } as Assignment : a)),
    }));
  },

  removeAssignment: async (assignmentId) => {
    try {
      await fetch(`/api/assignments/${assignmentId}`, { method: 'DELETE' });
    } catch {
      // API unavailable — still remove locally
    }
    set((s) => ({
      assignments: s.assignments.filter((a) => a.id !== assignmentId),
    }));
  },

  moveAssignment: async (assignmentId, newConsultantId, newStartDate, newEndDate) => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultant_id: newConsultantId,
          start_date: newStartDate,
          end_date: newEndDate,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        set((s) => ({
          assignments: s.assignments.map((a) => a.id === assignmentId ? updated : a),
        }));
        return;
      }
    } catch {
      // API unavailable — fall through to local-only update
    }
    set((s) => ({
      assignments: s.assignments.map((a) =>
        a.id === assignmentId
          ? { ...a, consultant_id: newConsultantId, start_date: newStartDate, end_date: newEndDate }
          : a
      ),
    }));
  },
}));
