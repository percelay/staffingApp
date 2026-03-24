import { create } from 'zustand';
import type { Assignment } from '../types';

interface AssignmentStore {
  assignments: Assignment[];
  setAssignments: (assignments: Assignment[]) => void;
  getByConsultant: (consultantId: string) => Assignment[];
  getByEngagement: (engagementId: string) => Assignment[];
  moveAssignment: (
    assignmentId: string,
    newConsultantId: string,
    newStartDate: string,
    newEndDate: string
  ) => void;
  createAssignment: (assignment: Assignment) => void;
  removeAssignment: (assignmentId: string) => void;
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  assignments: [],
  setAssignments: (assignments) => set({ assignments }),
  getByConsultant: (consultantId) =>
    get().assignments.filter((a) => a.consultant_id === consultantId),
  getByEngagement: (engagementId) =>
    get().assignments.filter((a) => a.engagement_id === engagementId),
  moveAssignment: (assignmentId, newConsultantId, newStartDate, newEndDate) =>
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              consultant_id: newConsultantId,
              start_date: newStartDate,
              end_date: newEndDate,
            }
          : a
      ),
    })),
  createAssignment: (assignment) =>
    set((state) => ({ assignments: [...state.assignments, assignment] })),
  removeAssignment: (assignmentId) =>
    set((state) => ({
      assignments: state.assignments.filter((a) => a.id !== assignmentId),
    })),
}));
