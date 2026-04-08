import { generateOpportunitySeedData } from '@/lib/data/opportunity-seed';
import { generateSeedData } from '@/lib/data/seed';
import {
  listAssignments,
  listConsultants,
  listEngagements,
  listOpportunities,
  listScenarios,
  listWellbeingSignals,
} from '@/server/repositories/staffing-repository';
import {
  serializeAssignment,
  serializeConsultant,
  serializeEngagement,
  serializeOpportunity,
  serializeScenario,
  serializeWellbeingSignal,
} from '@/server/serializers/staffing';

export type BootstrapSource = 'database' | 'demo';

export type BootstrapPayload = {
  source: BootstrapSource;
  consultants: ReturnType<typeof serializeConsultant>[];
  engagements: ReturnType<typeof serializeEngagement>[];
  assignments: ReturnType<typeof serializeAssignment>[];
  signals: ReturnType<typeof serializeWellbeingSignal>[];
  opportunities: ReturnType<typeof serializeOpportunity>[];
  scenarios: ReturnType<typeof serializeScenario>[];
};

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
  const { consultants, engagements, assignments, wellbeingSignals } =
    generateSeedData();
  const { opportunities, scenarios } = generateOpportunitySeedData();

  return {
    source: 'demo',
    consultants,
    engagements,
    assignments,
    signals: wellbeingSignals,
    opportunities,
    scenarios,
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
