import { create } from 'zustand';
import type { ProposalSlot, Proposal } from '../types';

const DEFAULT_SLOTS: ProposalSlot[] = [
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
  addToSlot: (slotIndex: number, consultantId: string) => void;
  removeFromSlot: (slotIndex: number) => void;
  resetSlots: () => void;
  saveProposal: (proposal: Proposal) => void;
}

export const useProposalStore = create<ProposalStore>((set) => ({
  engagementId: null,
  slots: [...DEFAULT_SLOTS],
  savedProposals: [],
  setEngagementId: (engagementId) =>
    set({ engagementId, slots: DEFAULT_SLOTS.map((s) => ({ ...s })) }),
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
    set({ slots: DEFAULT_SLOTS.map((s) => ({ ...s })) }),
  saveProposal: (proposal) =>
    set((state) => ({
      savedProposals: [...state.savedProposals, proposal],
    })),
}));
