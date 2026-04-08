import type { BootstrapPayload } from '@/lib/contracts/bootstrap';
import { generateDemoSeedData } from '@/server/demo/seed-data';
import {
  listAssignments,
  listConsultants,
  listEngagements,
  listOpportunities,
  listScenarios,
  listWellbeingSignals,
} from '@/server/repositories';
import {
  serializeAssignment,
  serializeConsultant,
  serializeEngagement,
  serializeOpportunity,
  serializeScenario,
  serializeWellbeingSignal,
} from '@/server/serializers';

export type { BootstrapSource } from '@/lib/contracts/bootstrap';

export async function getBootstrapPayload(): Promise<BootstrapPayload> {
  try {
    const [
      consultantRecords,
      engagementRecords,
      assignmentRecords,
      signalRecords,
      opportunityRecords,
      scenarioRecords,
    ] = await Promise.all([
      listConsultants({ status: 'all' }),
      listEngagements(),
      listAssignments(),
      listWellbeingSignals(),
      listOpportunities(),
      listScenarios(),
    ]);

    const payload: BootstrapPayload = {
      source: 'database',
      consultants: consultantRecords.map(serializeConsultant),
      engagements: engagementRecords.map(serializeEngagement),
      assignments: assignmentRecords.map(serializeAssignment),
      signals: signalRecords.map(serializeWellbeingSignal),
      opportunities: opportunityRecords.map(serializeOpportunity),
      scenarios: scenarioRecords.map(serializeScenario),
    };

    if (hasDatabaseData(payload)) {
      return payload;
    }
  } catch {
    // Intentionally fall through to demo data below.
  }

  return getDemoBootstrapPayload();
}

function getDemoBootstrapPayload(): BootstrapPayload {
  const seed = generateDemoSeedData();

  return {
    source: 'demo',
    consultants: seed.consultants,
    engagements: seed.engagements,
    assignments: seed.assignments,
    signals: seed.wellbeingSignals,
    opportunities: seed.opportunities,
    scenarios: seed.scenarios,
  };
}

function hasDatabaseData(payload: Omit<BootstrapPayload, 'source'>) {
  return (
    payload.consultants.length > 0 ||
    payload.engagements.length > 0 ||
    payload.assignments.length > 0 ||
    payload.signals.length > 0 ||
    payload.opportunities.length > 0 ||
    payload.scenarios.length > 0
  );
}
