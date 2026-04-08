import { create } from 'zustand';
import { authFetchJson } from '../api/json-fetch';
import type { ProposalSlot, Proposal } from '../types';

export const DEFAULT_PROPOSAL_SLOTS: ProposalSlot[] = [
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

  setEngagementId: (id: string | null) => void;
  setSavedProposals: (proposals: Proposal[]) => void;
  resetProposalState: () => void;
  addToSlot: (slotIndex: number, consultantId: string) => void;
  removeFromSlot: (slotIndex: number) => void;
  resetSlots: () => void;
  saveProposal: (proposal: Proposal) => Promise<void>;
  fetchProposals: () => Promise<void>;
}

export const useProposalStore = create<ProposalStore>((set) => ({
  engagementId: null,
  slots: [...DEFAULT_PROPOSAL_SLOTS],
  savedProposals: [],

  setEngagementId: (engagementId) =>
    set({ engagementId, slots: DEFAULT_PROPOSAL_SLOTS.map((s) => ({ ...s })) }),

  setSavedProposals: (savedProposals) => set({ savedProposals }),

  resetProposalState: () =>
    set({
      engagementId: null,
      slots: DEFAULT_PROPOSAL_SLOTS.map((slot) => ({ ...slot })),
      savedProposals: [],
    }),

  addToSlot: (slotIndex, consultantId) =>
    set((state) => ({
      slots: state.slots.map((s, i) =>
        i === slotIndex ? { ...s, consultant_id: consultantId } : s
      ),
    })),

  removeFromSlot: (slotIndex) =>
    set((state) => ({
      slots: state.slots.map((s, i) =>
        i === slotIndex ? { ...s, consultant_id: null } : s
      ),
    })),

  resetSlots: () =>
    set({ slots: DEFAULT_PROPOSAL_SLOTS.map((s) => ({ ...s })) }),

  saveProposal: async (proposal) => {
    const saved = await authFetchJson<Proposal>('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proposal),
    });
    set((state) => ({
      savedProposals: [...state.savedProposals, saved],
    }));
  },

  fetchProposals: async () => {
    const data = await authFetchJson<Proposal[]>('/api/proposals');
    set({ savedProposals: data });
  },
}));
