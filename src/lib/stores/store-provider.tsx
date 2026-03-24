'use client';

import { useEffect, useRef } from 'react';
import { generateSeedData } from '../data/seed';
import { useConsultantStore } from './consultant-store';
import { useEngagementStore } from './engagement-store';
import { useAssignmentStore } from './assignment-store';
import { useWellbeingStore } from './wellbeing-store';

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
            fetch('/api/consultants'),
            fetch('/api/engagements'),
            fetch('/api/assignments'),
            fetch('/api/wellbeing'),
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

        console.log('[StoreProvider] Loaded from database API');
      } catch {
        // Fallback: use in-memory faker seed data
        const { consultants, engagements, assignments, wellbeingSignals } =
          generateSeedData();

        useConsultantStore.getState().setConsultants(consultants);
        useEngagementStore.getState().setEngagements(engagements);
        useAssignmentStore.getState().setAssignments(assignments);
        useWellbeingStore.getState().setSignals(wellbeingSignals);

        console.log('[StoreProvider] Using in-memory seed data (no database)');
      }
    }

    loadFromAPI();
  }, []);

  return <>{children}</>;
}
