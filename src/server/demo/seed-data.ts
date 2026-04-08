import { faker } from '@faker-js/faker';
import { addWeeks, format, startOfWeek } from 'date-fns';
import {
  CONSULTING_SKILLS,
  ENGAGEMENT_COLOR_PALETTE,
} from '@/lib/constants/staffing';
import type {
  Assignment,
  AssignmentRole,
  Consultant,
  Opportunity,
  PipelineStage,
  Scenario,
  WellbeingSignal,
} from '@/lib/contracts';
import type {
  PracticeArea,
  SeniorityLevel,
} from '@/lib/contracts/consultant';
import type { Engagement } from '@/lib/contracts/engagement';

const PRACTICE_AREAS: PracticeArea[] = [
  'strategy',
  'operations',
  'digital',
  'risk',
  'people',
];

const SENIORITY_DISTRIBUTION: SeniorityLevel[] = [
  'partner',
  'partner',
  'senior_manager',
  'senior_manager',
  'senior_manager',
  'manager',
  'manager',
  'manager',
  'manager',
  'manager',
  'consultant',
  'consultant',
  'consultant',
  'consultant',
  'consultant',
  'consultant',
  'analyst',
  'analyst',
  'analyst',
  'analyst',
];

const CLIENTS = [
  { name: 'Meridian Financial', project: 'Post-Merger Integration' },
  { name: 'Atlas Manufacturing', project: 'Supply Chain Transformation' },
  { name: 'Zenith Healthcare', project: 'Digital Patient Experience' },
  { name: 'Vanguard Retail', project: 'Omnichannel Strategy' },
  { name: 'Pinnacle Energy', project: 'Regulatory Compliance Review' },
  { name: 'Horizon Telecom', project: 'Cost Optimization Program' },
  { name: 'Sterling Insurance', project: 'Agile Transformation' },
  { name: 'Nova Pharmaceuticals', project: 'Market Entry Assessment' },
] as const;

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
  isBet?: boolean;
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
    isBet: true,
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
    isBet: true,
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

const DEFAULT_TENTATIVE_TEAMS: {
  consultantId: string;
  role: AssignmentRole;
  allocation: number;
}[][] = [
  [
    { consultantId: 'consultant-1', role: 'lead', allocation: 60 },
    { consultantId: 'consultant-6', role: 'manager', allocation: 80 },
    { consultantId: 'consultant-13', role: 'consultant', allocation: 100 },
    { consultantId: 'consultant-17', role: 'analyst', allocation: 100 },
  ],
  [
    { consultantId: 'consultant-2', role: 'lead', allocation: 40 },
    { consultantId: 'consultant-8', role: 'manager', allocation: 80 },
    { consultantId: 'consultant-12', role: 'consultant', allocation: 100 },
    { consultantId: 'consultant-16', role: 'analyst', allocation: 80 },
  ],
  [
    { consultantId: 'consultant-5', role: 'lead', allocation: 60 },
    { consultantId: 'consultant-10', role: 'consultant', allocation: 100 },
    { consultantId: 'consultant-18', role: 'analyst', allocation: 80 },
  ],
  [
    { consultantId: 'consultant-3', role: 'lead', allocation: 40 },
    { consultantId: 'consultant-14', role: 'consultant', allocation: 80 },
  ],
  [
    { consultantId: 'consultant-4', role: 'lead', allocation: 60 },
    { consultantId: 'consultant-7', role: 'manager', allocation: 80 },
    { consultantId: 'consultant-15', role: 'consultant', allocation: 100 },
    { consultantId: 'consultant-19', role: 'analyst', allocation: 80 },
  ],
];

const LEAN_TENTATIVE_TEAMS: typeof DEFAULT_TENTATIVE_TEAMS = [
  [
    { consultantId: 'consultant-1', role: 'lead', allocation: 40 },
    { consultantId: 'consultant-13', role: 'consultant', allocation: 100 },
    { consultantId: 'consultant-17', role: 'analyst', allocation: 80 },
  ],
  [
    { consultantId: 'consultant-2', role: 'lead', allocation: 40 },
    { consultantId: 'consultant-12', role: 'consultant', allocation: 100 },
  ],
];

function seniorityToRole(seniority: SeniorityLevel): string {
  switch (seniority) {
    case 'partner':
      return 'Partner';
    case 'senior_manager':
      return 'Senior Manager';
    case 'manager':
      return 'Manager';
    case 'consultant':
      return 'Consultant';
    default:
      return 'Analyst';
  }
}

function buildConsultants(): Consultant[] {
  return Array.from({ length: 20 }, (_, index) => {
    const practiceArea = PRACTICE_AREAS[index % PRACTICE_AREAS.length];
    const seniority = SENIORITY_DISTRIBUTION[index];
    const skills = faker.helpers.arrayElements(
      [...CONSULTING_SKILLS],
      faker.number.int({ min: 3, max: 6 })
    );
    const remainingSkills = CONSULTING_SKILLS.filter(
      (skill) => !skills.includes(skill)
    );
    const goals = faker.helpers.arrayElements(
      remainingSkills,
      faker.number.int({ min: 1, max: 3 })
    );

    return {
      id: `consultant-${index + 1}`,
      name: faker.person.fullName(),
      role: seniorityToRole(seniority),
      practice_area: practiceArea,
      seniority_level: seniority,
      status: 'active',
      skills,
      goals,
      avatar_url: `https://api.dicebear.com/9.x/notionists/svg?seed=${faker.string.alphanumeric(8)}`,
    };
  });
}

function buildEngagements(): Engagement[] {
  const now = startOfWeek(new Date(), { weekStartsOn: 1 });
  const durations = [3, 4, 6, 8, 5, 10, 7, 12];
  const offsets = [-2, -1, 0, 1, -3, 2, -1, 3];

  return CLIENTS.map((client, index) => {
    const start = addWeeks(now, offsets[index]);
    const end = addWeeks(start, durations[index]);
    const isStarted = offsets[index] <= 0;
    const isNearEnd = offsets[index] + durations[index] <= 2;

    return {
      id: `engagement-${index + 1}`,
      client_name: client.name,
      project_name: client.project,
      start_date: format(start, 'yyyy-MM-dd'),
      end_date: format(end, 'yyyy-MM-dd'),
      required_skills: faker.helpers.arrayElements(
        [...CONSULTING_SKILLS],
        faker.number.int({ min: 3, max: 5 })
      ),
      status:
        index === 4
          ? 'at_risk'
          : isNearEnd
            ? 'completed'
            : isStarted
              ? 'active'
              : 'upcoming',
      color: ENGAGEMENT_COLOR_PALETTE[index % ENGAGEMENT_COLOR_PALETTE.length],
      is_bet: index === 3 || index === 7,
    };
  });
}

function buildAssignments(
  consultants: Consultant[],
  engagements: Engagement[]
): Assignment[] {
  const assignments: Assignment[] = [];
  let assignmentId = 1;

  const assignmentDefs: Array<{
    engagementIndex: number;
    team: number[];
    roles: AssignmentRole[];
    allocations: number[];
  }> = [
    {
      engagementIndex: 0,
      team: [0, 2, 5, 10],
      roles: ['lead', 'manager', 'consultant', 'analyst'],
      allocations: [100, 80, 100, 100],
    },
    {
      engagementIndex: 1,
      team: [1, 6, 11],
      roles: ['lead', 'consultant', 'analyst'],
      allocations: [60, 100, 100],
    },
    {
      engagementIndex: 2,
      team: [2, 7, 12, 16],
      roles: ['lead', 'manager', 'consultant', 'analyst'],
      allocations: [80, 80, 80, 80],
    },
    {
      engagementIndex: 3,
      team: [3, 8, 13],
      roles: ['lead', 'manager', 'consultant'],
      allocations: [100, 100, 100],
    },
    {
      engagementIndex: 4,
      team: [0, 4, 9, 14, 17],
      roles: ['lead', 'manager', 'consultant', 'consultant', 'analyst'],
      allocations: [40, 80, 80, 80, 80],
    },
    {
      engagementIndex: 5,
      team: [1, 7, 18],
      roles: ['lead', 'consultant', 'analyst'],
      allocations: [40, 80, 80],
    },
    {
      engagementIndex: 6,
      team: [3, 9, 15],
      roles: ['manager', 'consultant', 'analyst'],
      allocations: [60, 60, 60],
    },
    {
      engagementIndex: 7,
      team: [4, 19],
      roles: ['lead', 'analyst'],
      allocations: [100, 100],
    },
  ];

  for (const definition of assignmentDefs) {
    const engagement = engagements[definition.engagementIndex];
    for (let index = 0; index < definition.team.length; index += 1) {
      assignments.push({
        id: `assignment-${assignmentId++}`,
        consultant_id: consultants[definition.team[index]].id,
        engagement_id: engagement.id,
        role: definition.roles[index],
        start_date: engagement.start_date,
        end_date: engagement.end_date,
        allocation_percentage: definition.allocations[index],
      });
    }
  }

  return assignments;
}

function buildWellbeingSignals(consultants: Consultant[]): WellbeingSignal[] {
  const recordedAt = format(new Date(), 'yyyy-MM-dd');

  return [
    {
      id: 'signal-1',
      consultant_id: consultants[0].id,
      signal_type: 'overwork',
      severity: 'high',
      recorded_at: recordedAt,
    },
    {
      id: 'signal-2',
      consultant_id: consultants[7].id,
      signal_type: 'no_break',
      severity: 'medium',
      recorded_at: recordedAt,
    },
    {
      id: 'signal-3',
      consultant_id: consultants[1].id,
      signal_type: 'weekend_work',
      severity: 'medium',
      recorded_at: recordedAt,
    },
    {
      id: 'signal-4',
      consultant_id: consultants[9].id,
      signal_type: 'overwork',
      severity: 'high',
      recorded_at: recordedAt,
    },
    {
      id: 'signal-5',
      consultant_id: consultants[3].id,
      signal_type: 'high_travel',
      severity: 'low',
      recorded_at: recordedAt,
    },
    {
      id: 'signal-6',
      consultant_id: consultants[2].id,
      signal_type: 'overwork',
      severity: 'high',
      recorded_at: recordedAt,
    },
  ];
}

function buildOpportunitiesAndScenarios() {
  const now = startOfWeek(new Date(), { weekStartsOn: 1 });
  const opportunities: Opportunity[] = [];
  const scenarios: Scenario[] = [];

  OPPORTUNITY_CLIENTS.forEach((client, index) => {
    const start = addWeeks(now, client.weekOffset);
    const end = addWeeks(start, client.duration);
    const opportunityId = `opportunity-${index + 1}`;
    const defaultScenarioId = `scenario-${index + 1}-default`;

    opportunities.push({
      id: opportunityId,
      client_name: client.name,
      project_name: client.project,
      start_date: format(start, 'yyyy-MM-dd'),
      end_date: format(end, 'yyyy-MM-dd'),
      stage: client.stage,
      probability: client.probability,
      estimated_value: client.value,
      required_skills: client.skills,
      color: client.color,
      is_bet: client.isBet ?? false,
      notes: null,
      converted_engagement_id: null,
    });

    scenarios.push({
      id: defaultScenarioId,
      opportunity_id: opportunityId,
      name: 'Primary Team',
      is_default: true,
      fit_score: null,
      burnout_impact: null,
      tentative_assignments: (DEFAULT_TENTATIVE_TEAMS[index] ?? []).map(
        (member, teamIndex) => ({
          id: `tentative-${index + 1}-${teamIndex + 1}`,
          scenario_id: defaultScenarioId,
          consultant_id: member.consultantId,
          role: member.role,
          start_date: format(start, 'yyyy-MM-dd'),
          end_date: format(end, 'yyyy-MM-dd'),
          allocation_percentage: member.allocation,
        })
      ),
    });

    const leanTeam = LEAN_TENTATIVE_TEAMS[index];
    if (leanTeam) {
      const leanScenarioId = `scenario-${index + 1}-lean`;
      scenarios.push({
        id: leanScenarioId,
        opportunity_id: opportunityId,
        name: 'Lean Team',
        is_default: false,
        fit_score: null,
        burnout_impact: null,
        tentative_assignments: leanTeam.map((member, teamIndex) => ({
          id: `tentative-alt-${index + 1}-${teamIndex + 1}`,
          scenario_id: leanScenarioId,
          consultant_id: member.consultantId,
          role: member.role,
          start_date: format(start, 'yyyy-MM-dd'),
          end_date: format(end, 'yyyy-MM-dd'),
          allocation_percentage: member.allocation,
        })),
      });
    }
  });

  return { opportunities, scenarios };
}

export interface DemoSeedData {
  skills: string[];
  consultants: Consultant[];
  engagements: Engagement[];
  assignments: Assignment[];
  wellbeingSignals: WellbeingSignal[];
  opportunities: Opportunity[];
  scenarios: Scenario[];
}

export function generateDemoSeedData(): DemoSeedData {
  faker.seed(42);
  const consultants = buildConsultants();
  const engagements = buildEngagements();
  const assignments = buildAssignments(consultants, engagements);
  const wellbeingSignals = buildWellbeingSignals(consultants);
  const { opportunities, scenarios } = buildOpportunitiesAndScenarios();

  return {
    skills: [...CONSULTING_SKILLS],
    consultants,
    engagements,
    assignments,
    wellbeingSignals,
    opportunities,
    scenarios,
  };
}
