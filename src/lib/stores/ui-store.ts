import { create } from 'zustand';
import type { PracticeArea } from '../types';

export type ActiveView =
  | 'actual-timeline'
  | 'actual-staffing'
  | 'actual-people'
  | 'opportunities'
  | 'potential-staffing'
  | 'known-bets';

interface UIStore {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedEngagementId: string | null;
  setSelectedEngagementId: (id: string | null) => void;
  selectedConsultantId: string | null;
  setSelectedConsultantId: (id: string | null) => void;
  timelineWeekOffset: number;
  setTimelineWeekOffset: (offset: number) => void;
  practiceAreaFilter: PracticeArea | null;
  setPracticeAreaFilter: (area: PracticeArea | null) => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  showOpportunityOverlay: boolean;
  setShowOpportunityOverlay: (show: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeView: 'actual-timeline',
  setActiveView: (activeView) => set({ activeView }),
  selectedEngagementId: null,
  setSelectedEngagementId: (selectedEngagementId) =>
    set({ selectedEngagementId }),
  selectedConsultantId: null,
  setSelectedConsultantId: (selectedConsultantId) =>
    set({ selectedConsultantId }),
  timelineWeekOffset: 0,
  setTimelineWeekOffset: (timelineWeekOffset) => set({ timelineWeekOffset }),
  practiceAreaFilter: null,
  setPracticeAreaFilter: (practiceAreaFilter) => set({ practiceAreaFilter }),
  drawerOpen: false,
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  showOpportunityOverlay: false,
  setShowOpportunityOverlay: (showOpportunityOverlay) =>
    set({ showOpportunityOverlay }),
}));
