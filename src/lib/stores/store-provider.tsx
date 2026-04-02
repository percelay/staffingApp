'use client';

import { useEffect, useRef } from 'react';
import { authFetch } from '../api/auth-fetch';
import { generateSeedData } from '../data/seed';
import { generateOpportunitySeedData } from '../data/opportunity-seed';
import { useConsultantStore } from './consultant-store';
import { useEngagementStore } from './engagement-store';
import { useAssignmentStore } from './assignment-store';
import { useWellbeingStore } from './wellbeing-store';
import { useOpportunityStore } from './opportunity-store';

/**
 * StoreProvider — initializes all Zustand stores on mount.
 *
 * Strategy:
 *   1. Try to fetch from the database API (/api/consultants, etc.)
 *   2. If the API returns data, use it (database is connected and seeded)
 *   3. If the API fails or returns empty, fall back to faker seed data
 *      so the app always works — even without a database.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function loadFromAPI() {
      try {
        const [consultantsRes, engagementsRes, assignmentsRes, wellbeingRes] =
          await Promise.all([
            authFetch('/api/consultants'),
            authFetch('/api/engagements'),
            authFetch('/api/assignments'),
            authFetch('/api/wellbeing'),
          ]);

        // If any request fails, fall back to seed data
        if (
          !consultantsRes.ok ||
          !engagementsRes.ok ||
          !assignmentsRes.ok ||
          !wellbeingRes.ok
        ) {
          throw new Error('API returned non-OK status');
        }

        const [consultants, engagements, assignments, signals] =
          await Promise.all([
            consultantsRes.json(),
            engagementsRes.json(),
            assignmentsRes.json(),
            wellbeingRes.json(),
          ]);

        // If the database is empty (not yet seeded), fall back
        if (consultants.length === 0 && engagements.length === 0) {
          throw new Error('Database is empty — using seed data');
        }

        useConsultantStore.getState().setConsultants(consultants);
        useEngagementStore.getState().setEngagements(engagements);
        useAssignmentStore.getState().setAssignments(assignments);
        useWellbeingStore.getState().setSignals(signals);

        // Try to load opportunities and scenarios from API; fall back to seed
        try {
          const [oppRes, scenarioRes] = await Promise.all([
            authFetch('/api/opportunities'),
            authFetch('/api/opportunities/scenarios'),
          ]);

          if (oppRes.ok) {
            const opportunities = await oppRes.json();
            if (opportunities.length > 0) {
              const opportunityStore = useOpportunityStore.getState();
              opportunityStore.setOpportunities(opportunities);

              if (scenarioRes.ok) {
                const scenarios = await scenarioRes.json();
                opportunityStore.setScenarios(scenarios);
              } else {
                opportunityStore.setScenarios([]);
              }

              console.log(
                '[StoreProvider] Loaded from database API (with opportunities)'
              );
              return;
            }
          }
        } catch {
          // Opportunity API not available — fall through to seed
        }

        // Seed opportunities even when main data comes from DB
        loadOpportunitySeed();
        console.log('[StoreProvider] Loaded from database API');
      } catch {
        // Fallback: use in-memory faker seed data
        const { consultants, engagements, assignments, wellbeingSignals } =
          generateSeedData();

        useConsultantStore.getState().setConsultants(consultants);
        useEngagementStore.getState().setEngagements(engagements);
        useAssignmentStore.getState().setAssignments(assignments);
        useWellbeingStore.getState().setSignals(wellbeingSignals);

        loadOpportunitySeed();
        console.log('[StoreProvider] Using in-memory seed data (no database)');
      }
    }

    function loadOpportunitySeed() {
      const { opportunities, scenarios } = generateOpportunitySeedData();
      const store = useOpportunityStore.getState();
      store.setOpportunities(opportunities);
      // Hydrate scenarios directly into the store
      useOpportunityStore.setState({ scenarios });
    }

    loadFromAPI();
  }, []);

  return <>{children}</>;
}
