import { create } from 'zustand';
import {
  createAssignment as createAssignmentResource,
  deleteAssignment as deleteAssignmentResource,
  fetchAssignments as fetchAssignmentsResource,
  updateAssignment as updateAssignmentResource,
} from '@/lib/api/resources/assignments';
import type { Assignment } from '../types';
import { getErrorMessage, type ResourceStatus } from './resource-state';

interface AssignmentStore {
  assignments: Assignment[];
  status: ResourceStatus;
  error: string | null;

  setAssignments: (assignments: Assignment[]) => void;
  fetchAssignments: () => Promise<void>;
  refetch: () => Promise<void>;
  reset: () => void;

  getByConsultant: (consultantId: string) => Assignment[];
  getByEngagement: (engagementId: string) => Assignment[];

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
  status: 'idle',
  error: null,

  setAssignments: (assignments) =>
    set({ assignments, status: 'ready', error: null }),

  fetchAssignments: async () => {
    set({ status: 'loading', error: null });
    try {
      const assignments = await fetchAssignmentsResource();
      set({ assignments, status: 'ready', error: null });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error) });
      throw error;
    }
  },

  refetch: async () => get().fetchAssignments(),
  reset: () => set({ assignments: [], status: 'idle', error: null }),

  getByConsultant: (consultantId) =>
    get().assignments.filter(
      (assignment) => assignment.consultant_id === consultantId
    ),
  getByEngagement: (engagementId) =>
    get().assignments.filter(
      (assignment) => assignment.engagement_id === engagementId
    ),

  createAssignment: async (data) => {
    const assignment = await createAssignmentResource(data);
    set((state) => ({
      assignments: [...state.assignments, assignment],
    }));
    return assignment;
  },

  updateAssignment: async (id, data) => {
    const assignment = await updateAssignmentResource(id, data);
    set((state) => ({
      assignments: state.assignments.map((candidate) =>
        candidate.id === id ? assignment : candidate
      ),
    }));
  },

  removeAssignment: async (assignmentId) => {
    await deleteAssignmentResource(assignmentId);
    set((state) => ({
      assignments: state.assignments.filter(
        (assignment) => assignment.id !== assignmentId
      ),
    }));
  },

  moveAssignment: async (
    assignmentId,
    newConsultantId,
    newStartDate,
    newEndDate
  ) => {
    const assignment = await updateAssignmentResource(assignmentId, {
      consultant_id: newConsultantId,
      start_date: newStartDate,
      end_date: newEndDate,
    });
    set((state) => ({
      assignments: state.assignments.map((candidate) =>
        candidate.id === assignmentId ? assignment : candidate
      ),
    }));
  },
}));
