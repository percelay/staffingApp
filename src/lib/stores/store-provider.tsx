'use client';

import { useEffect } from 'react';
import { authFetch } from '../api/auth-fetch';
import { useAppStore } from './app-store';
import { useAuthStore } from './auth-store';
import { useConsultantStore } from './consultant-store';
import { useEngagementStore } from './engagement-store';
import { useAssignmentStore } from './assignment-store';
import { useWellbeingStore } from './wellbeing-store';
import { useOpportunityStore } from './opportunity-store';
import { useProposalStore } from './proposal-store';

/**
 * StoreProvider — hydrates domain stores for authenticated dashboard sessions.
 * Data source selection happens server-side via `/api/bootstrap`.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const currentUserId = currentUser?.id;
  const bootstrapStatus = useAppStore((s) => s.bootstrapStatus);
  const bootstrapError = useAppStore((s) => s.bootstrapError);

  useEffect(() => {
    if (!currentUser) {
      resetDomainStores();
      useAppStore.getState().resetBootstrap();
      return;
    }

    let cancelled = false;

    async function loadBootstrapData() {
      useAppStore.getState().setBootstrapLoading();
      resetDomainStores();

      try {
        const response = await authFetch('/api/bootstrap');

        if (!response.ok) {
          throw new Error(`Bootstrap request failed with ${response.status}`);
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        useConsultantStore.getState().setConsultants(data.consultants);
        useEngagementStore.getState().setEngagements(data.engagements);
        useAssignmentStore.getState().setAssignments(data.assignments);
        useWellbeingStore.getState().setSignals(data.signals);
        useOpportunityStore.getState().setOpportunities(data.opportunities);
        useOpportunityStore.getState().setScenarios(data.scenarios);
        useOpportunityStore.setState({
          selectedOpportunityId: null,
          activeScenarioId: null,
        });
        useProposalStore.getState().setSavedProposals([]);
        useAppStore.getState().setBootstrapReady(data.source);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Failed to load staffing data';
        useAppStore.getState().setBootstrapError(message);
      }
    }

    void loadBootstrapData();

    return () => {
      cancelled = true;
    };
  }, [currentUser, currentUserId]);

  if (bootstrapStatus === 'loading' || bootstrapStatus === 'idle') {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-50 text-sm text-slate-600">
        Loading staffing data...
      </div>
    );
  }

  if (bootstrapStatus === 'error') {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-50">
        <div className="rounded-xl border bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
          {bootstrapError || 'Unable to load staffing data.'}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function resetDomainStores() {
  useConsultantStore.setState({ consultants: [], loading: false });
  useEngagementStore.setState({ engagements: [], loading: false });
  useAssignmentStore.setState({ assignments: [], loading: false });
  useWellbeingStore.setState({ signals: [], loading: false });
  useOpportunityStore.setState({
    opportunities: [],
    loading: false,
    selectedOpportunityId: null,
    activeScenarioId: null,
    scenarios: [],
  });
  useProposalStore.getState().resetProposalState();
}
