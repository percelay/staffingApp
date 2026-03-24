'use client';

import { useEffect, useRef } from 'react';
import { generateSeedData } from '../data/seed';
import { useConsultantStore } from './consultant-store';
import { useEngagementStore } from './engagement-store';
import { useAssignmentStore } from './assignment-store';
import { useWellbeingStore } from './wellbeing-store';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const { consultants, engagements, assignments, wellbeingSignals } =
      generateSeedData();

    useConsultantStore.getState().setConsultants(consultants);
    useEngagementStore.getState().setEngagements(engagements);
    useAssignmentStore.getState().setAssignments(assignments);
    useWellbeingStore.getState().setSignals(wellbeingSignals);
  }, []);

  return <>{children}</>;
}
