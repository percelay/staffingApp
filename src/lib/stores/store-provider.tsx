'use client';

import { useEffect } from 'react';
import { fetchBootstrapPayload } from '@/lib/api/resources/bootstrap';
import { useAppStore } from './app-store';
import { useAssignmentStore } from './assignment-store';
import { useAuthStore } from './auth-store';
import { useConsultantStore } from './consultant-store';
import { useEngagementStore } from './engagement-store';
import { useOpportunityStore } from './opportunity-store';
import { useOpportunityUIStore } from './opportunity-ui-store';
import { useProposalStore } from './proposal-store';
import { useWellbeingStore } from './wellbeing-store';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const currentUser = useAuthStore((store) => store.currentUser);
  const bootstrapStatus = useAppStore((store) => store.bootstrapStatus);
  const bootstrapError = useAppStore((store) => store.bootstrapError);

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
        const data = await fetchBootstrapPayload();

        if (cancelled) {
          return;
        }

        useConsultantStore.getState().setConsultants(data.consultants);
        useEngagementStore.getState().setEngagements(data.engagements);
        useAssignmentStore.getState().setAssignments(data.assignments);
        useWellbeingStore.getState().setSignals(data.signals);
        useOpportunityStore.getState().setOpportunities(data.opportunities);
        useOpportunityStore.getState().setScenarios(data.scenarios);
        useOpportunityUIStore.getState().reset();
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
  }, [currentUser]);

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
  useConsultantStore.getState().reset();
  useEngagementStore.getState().reset();
  useAssignmentStore.getState().reset();
  useWellbeingStore.getState().reset();
  useOpportunityStore.getState().reset();
  useOpportunityUIStore.getState().reset();
  useProposalStore.getState().resetProposalState();
}
