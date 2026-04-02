import { addWeeks, format, startOfWeek } from 'date-fns';
import type { Opportunity, Scenario, PipelineStage } from '../types/opportunity';

/**
 * Deterministic sample opportunities for the pipeline view.
 * Uses fixed IDs so tentative assignments can reference real consultant IDs
 * from the main seed data (consultant-1 through consultant-20).
 */

const OPPORTUNITY_CLIENTS: {
  name: string;
  project: string;
  stage: PipelineStage;
  probability: number;
  value: number | null;
  color: string;
  skills: string[];
  weekOffset: number;
  duration: number;
}[] = [
  {
    name: 'Crestview Capital',
    project: 'Due Diligence — Series B Target',
    stage: 'verbal_commit',
    probability: 85,
    value: 420000,
    color: '#7C3AED',
    skills: ['Due Diligence', 'Financial Modeling', 'Market Analysis'],
    weekOffset: 2,
    duration: 6,
  },
  {
    name: 'Orbit Logistics',
    project: 'Supply Chain Digitization',
    stage: 'proposal_sent',
    probability: 55,
    value: 680000,
    color: '#0891B2',
    skills: ['Supply Chain', 'Digital Strategy', 'Process Optimization'],
    weekOffset: 3,
    duration: 10,
  },
  {
    name: 'Beacon Health Systems',
    project: 'Regulatory Readiness Program',
    stage: 'qualifying',
    probability: 35,
    value: 350000,
    color: '#059669',
    skills: ['Regulatory Compliance', 'Risk Assessment', 'Change Management'],
    weekOffset: 4,
    duration: 8,
  },
  {
    name: 'Apex Consumer Group',
    project: 'Customer Experience Redesign',
    stage: 'identified',
    probability: 20,
    value: null,
    color: '#D97706',
    skills: ['Customer Experience', 'Data Analytics', 'Digital Strategy'],
    weekOffset: 6,
    duration: 12,
  },
  {
    name: 'Titanium Manufacturing',
    project: 'Cost Optimization Phase 2',
    stage: 'proposal_sent',
    probability: 60,
    value: 520000,
    color: '#DC2626',
    skills: ['Cost Reduction', 'Process Optimization', 'Financial Modeling'],
    weekOffset: 1,
    duration: 8,
  },
];

export function generateOpportunitySeedData(): {
  opportunities: Opportunity[];
  scenarios: Scenario[];
} {
  const now = startOfWeek(new Date(), { weekStartsOn: 1 });
  const opportunities: Opportunity[] = [];
  const scenarios: Scenario[] = [];

  for (let i = 0; i < OPPORTUNITY_CLIENTS.length; i++) {
    const client = OPPORTUNITY_CLIENTS[i];
    const start = addWeeks(now, client.weekOffset);
    const end = addWeeks(start, client.duration);
    const oppId = `opportunity-${i + 1}`;

    opportunities.push({
      id: oppId,
      client_name: client.name,
      project_name: client.project,
      start_date: format(start, 'yyyy-MM-dd'),
      end_date: format(end, 'yyyy-MM-dd'),
      stage: client.stage,
      probability: client.probability,
      estimated_value: client.value,
      required_skills: client.skills,
      color: client.color,
      is_bet: false,
      notes: null,
      converted_engagement_id: null,
    });

    // Create a default scenario with tentative assignments for each opportunity
    const scenarioId = `scenario-${i + 1}-default`;
    const tentativeTeams = TENTATIVE_TEAMS[i] || [];

    scenarios.push({
      id: scenarioId,
      opportunity_id: oppId,
      name: 'Primary Team',
      is_default: true,
      fit_score: null,
      burnout_impact: null,
      tentative_assignments: tentativeTeams.map((member, j) => ({
        id: `tentative-${i + 1}-${j + 1}`,
        scenario_id: scenarioId,
        consultant_id: member.consultantId,
        role: member.role,
        start_date: format(start, 'yyyy-MM-dd'),
        end_date: format(end, 'yyyy-MM-dd'),
        allocation_percentage: member.allocation,
      })),
    });

    // Add alternate scenario for the first two opportunities
    if (i < 2) {
      const altScenarioId = `scenario-${i + 1}-lean`;
      const altTeam = LEAN_TEAMS[i] || [];

      scenarios.push({
        id: altScenarioId,
        opportunity_id: oppId,
        name: 'Lean Team',
        is_default: false,
        fit_score: null,
        burnout_impact: null,
        tentative_assignments: altTeam.map((member, j) => ({
          id: `tentative-alt-${i + 1}-${j + 1}`,
          scenario_id: altScenarioId,
          consultant_id: member.consultantId,
          role: member.role,
          start_date: format(start, 'yyyy-MM-dd'),
          end_date: format(end, 'yyyy-MM-dd'),
          allocation_percentage: member.allocation,
        })),
      });
    }
  }

  return { opportunities, scenarios };
}

// Tentative team compositions referencing consultant IDs from main seed
const TENTATIVE_TEAMS: {
  consultantId: string;
  role: 'lead' | 'manager' | 'consultant' | 'analyst';
  allocation: number;
}[][] = [
  // Opp 1: Crestview Capital (verbal commit, 85%)
  [
    { consultantId: 'consultant-1', role: 'lead', allocation: 60 },
    { consultantId: 'consultant-6', role: 'manager', allocation: 80 },
    { consultantId: 'consultant-13', role: 'consultant', allocation: 100 },
    { consultantId: 'consultant-17', role: 'analyst', allocation: 100 },
  ],
  // Opp 2: Orbit Logistics (proposal sent, 55%)
  [
    { consultantId: 'consultant-2', role: 'lead', allocation: 40 },
    { consultantId: 'consultant-8', role: 'manager', allocation: 80 },
    { consultantId: 'consultant-12', role: 'consultant', allocation: 100 },
    { consultantId: 'consultant-16', role: 'analyst', allocation: 80 },
  ],
  // Opp 3: Beacon Health (qualifying, 35%)
  [
    { consultantId: 'consultant-5', role: 'lead', allocation: 60 },
    { consultantId: 'consultant-10', role: 'consultant', allocation: 100 },
    { consultantId: 'consultant-18', role: 'analyst', allocation: 80 },
  ],
  // Opp 4: Apex Consumer (identified, 20%)
  [
    { consultantId: 'consultant-3', role: 'lead', allocation: 40 },
    { consultantId: 'consultant-14', role: 'consultant', allocation: 80 },
  ],
  // Opp 5: Titanium Manufacturing (proposal sent, 60%)
  [
    { consultantId: 'consultant-4', role: 'lead', allocation: 60 },
    { consultantId: 'consultant-7', role: 'manager', allocation: 80 },
    { consultantId: 'consultant-15', role: 'consultant', allocation: 100 },
    { consultantId: 'consultant-19', role: 'analyst', allocation: 80 },
  ],
];

const LEAN_TEAMS: typeof TENTATIVE_TEAMS = [
  // Lean for Crestview
  [
    { consultantId: 'consultant-1', role: 'lead', allocation: 40 },
    { consultantId: 'consultant-13', role: 'consultant', allocation: 100 },
    { consultantId: 'consultant-17', role: 'analyst', allocation: 80 },
  ],
  // Lean for Orbit
  [
    { consultantId: 'consultant-2', role: 'lead', allocation: 40 },
    { consultantId: 'consultant-12', role: 'consultant', allocation: 100 },
  ],
];
