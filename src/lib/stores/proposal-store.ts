import { create } from 'zustand';
import {
  createProposal,
  fetchProposals as fetchProposalsResource,
} from '@/lib/api/resources/proposals';
import type { Proposal, ProposalSlot } from '../types';
import { getErrorMessage, type ResourceStatus } from './resource-state';

const DEFAULT_PROPOSAL_SLOTS: ProposalSlot[] = [
  { role: 'lead', consultant_id: null, required: true },
  { role: 'manager', consultant_id: null, required: true },
  { role: 'consultant', consultant_id: null, required: true },
  { role: 'consultant', consultant_id: null, required: true },
  { role: 'analyst', consultant_id: null, required: false },
];

interface ProposalStore {
  engagementId: string | null;
  slots: ProposalSlot[];
  savedProposals: Proposal[];
  status: ResourceStatus;
  error: string | null;

  setEngagementId: (id: string | null) => void;
  setSavedProposals: (proposals: Proposal[]) => void;
  resetProposalState: () => void;
  addToSlot: (slotIndex: number, consultantId: string) => void;
  removeFromSlot: (slotIndex: number) => void;
  resetSlots: () => void;
  saveProposal: (proposal: Proposal) => Promise<void>;
  fetchProposals: () => Promise<void>;
  refetch: () => Promise<void>;
}

export const useProposalStore = create<ProposalStore>((set, get) => ({
  engagementId: null,
  slots: [...DEFAULT_PROPOSAL_SLOTS],
  savedProposals: [],
  status: 'idle',
  error: null,

  setEngagementId: (engagementId) =>
    set({ engagementId, slots: DEFAULT_PROPOSAL_SLOTS.map((slot) => ({ ...slot })) }),

  setSavedProposals: (savedProposals) =>
    set({ savedProposals, status: 'ready', error: null }),

  resetProposalState: () =>
    set({
      engagementId: null,
      slots: DEFAULT_PROPOSAL_SLOTS.map((slot) => ({ ...slot })),
      savedProposals: [],
      status: 'idle',
      error: null,
    }),

  addToSlot: (slotIndex, consultantId) =>
    set((state) => ({
      slots: state.slots.map((slot, index) =>
        index === slotIndex ? { ...slot, consultant_id: consultantId } : slot
      ),
    })),

  removeFromSlot: (slotIndex) =>
    set((state) => ({
      slots: state.slots.map((slot, index) =>
        index === slotIndex ? { ...slot, consultant_id: null } : slot
      ),
    })),

  resetSlots: () =>
    set({ slots: DEFAULT_PROPOSAL_SLOTS.map((slot) => ({ ...slot })) }),

  saveProposal: async (proposal) => {
    const saved = await createProposal(proposal);
    set((state) => ({
      savedProposals: [...state.savedProposals, saved],
    }));
  },

  fetchProposals: async () => {
    set({ status: 'loading', error: null });
    try {
      const proposals = await fetchProposalsResource();
      set({ savedProposals: proposals, status: 'ready', error: null });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error) });
      throw error;
    }
  },

  refetch: async () => get().fetchProposals(),
}));
