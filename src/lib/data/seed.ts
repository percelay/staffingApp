import { faker } from '@faker-js/faker';
import { addWeeks, format, startOfWeek } from 'date-fns';
import type { Consultant, PracticeArea, SeniorityLevel } from '../types/consultant';
import type { Engagement } from '../types/engagement';
import type { Assignment, AssignmentRole } from '../types/assignment';
import type { WellbeingSignal } from '../types/wellbeing';
import { CONSULTING_SKILLS } from '../constants/staffing';
import { CLIENT_COLORS } from '../utils/colors';

faker.seed(42);

const PRACTICE_AREAS: PracticeArea[] = ['strategy', 'operations', 'digital', 'risk', 'people'];

const SENIORITY_DISTRIBUTION: SeniorityLevel[] = [
  'partner', 'partner',
  'senior_manager', 'senior_manager', 'senior_manager',
  'manager', 'manager', 'manager', 'manager', 'manager',
  'consultant', 'consultant', 'consultant', 'consultant', 'consultant', 'consultant',
  'analyst', 'analyst', 'analyst', 'analyst',
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
];

function generateConsultants(): Consultant[] {
  const consultants: Consultant[] = [];
  const shuffledSeniority = [...SENIORITY_DISTRIBUTION];

  for (let i = 0; i < 20; i++) {
    const practiceArea = PRACTICE_AREAS[i % 5];
    const seniority = shuffledSeniority[i];
    const numSkills = faker.number.int({ min: 3, max: 6 });
    const skills = faker.helpers.arrayElements(CONSULTING_SKILLS, numSkills);
    const remainingSkills = CONSULTING_SKILLS.filter((s) => !skills.includes(s));
    const numGoals = faker.number.int({ min: 1, max: 3 });
    const goals = faker.helpers.arrayElements(remainingSkills, numGoals);

    consultants.push({
      id: `consultant-${i + 1}`,
      name: faker.person.fullName(),
      role: seniority === 'partner' ? 'Partner' :
            seniority === 'senior_manager' ? 'Senior Manager' :
            seniority === 'manager' ? 'Manager' :
            seniority === 'consultant' ? 'Consultant' : 'Analyst',
      practice_area: practiceArea,
      seniority_level: seniority,
      status: 'active',
      skills,
      goals,
      avatar_url: `https://api.dicebear.com/9.x/notionists/svg?seed=${faker.string.alphanumeric(8)}`,
    });
  }

  return consultants;
}

function generateEngagements(): Engagement[] {
  const now = startOfWeek(new Date(), { weekStartsOn: 1 });
  const engagements: Engagement[] = [];

  const durations = [3, 4, 6, 8, 5, 10, 7, 12]; // weeks
  const offsets = [-2, -1, 0, 1, -3, 2, -1, 3]; // week offset from now

  for (let i = 0; i < 8; i++) {
    const start = addWeeks(now, offsets[i]);
    const end = addWeeks(start, durations[i]);
    const requiredSkills = faker.helpers.arrayElements(CONSULTING_SKILLS, faker.number.int({ min: 3, max: 5 }));

    const isStarted = offsets[i] <= 0;
    const isNearEnd = offsets[i] + durations[i] <= 2;

    engagements.push({
      id: `engagement-${i + 1}`,
      client_name: CLIENTS[i].name,
      project_name: CLIENTS[i].project,
      start_date: format(start, 'yyyy-MM-dd'),
      end_date: format(end, 'yyyy-MM-dd'),
      required_skills: requiredSkills,
      status: isNearEnd ? 'completed' : isStarted ? 'active' : 'upcoming',
      color: CLIENT_COLORS[i % CLIENT_COLORS.length],
      is_bet: i === 3 || i === 7,
    });
  }

  return engagements;
}

function generateAssignments(
  consultants: Consultant[],
  engagements: Engagement[]
): Assignment[] {
  const assignments: Assignment[] = [];
  let assignmentId = 1;

  // Engagement 1 (Meridian Financial): 4 people, one fully booked
  const e1Team = [0, 2, 5, 10]; // consultant indices
  const e1Roles: AssignmentRole[] = ['lead', 'manager', 'consultant', 'analyst'];
  const e1Alloc = [100, 80, 100, 100];
  for (let j = 0; j < e1Team.length; j++) {
    assignments.push({
      id: `assignment-${assignmentId++}`,
      consultant_id: consultants[e1Team[j]].id,
      engagement_id: engagements[0].id,
      role: e1Roles[j],
      start_date: engagements[0].start_date,
      end_date: engagements[0].end_date,
      allocation_percentage: e1Alloc[j],
    });
  }

  // Engagement 2 (Atlas Manufacturing): 3 people
  const e2Team = [1, 6, 11];
  const e2Roles: AssignmentRole[] = ['lead', 'consultant', 'analyst'];
  for (let j = 0; j < e2Team.length; j++) {
    assignments.push({
      id: `assignment-${assignmentId++}`,
      consultant_id: consultants[e2Team[j]].id,
      engagement_id: engagements[1].id,
      role: e2Roles[j],
      start_date: engagements[1].start_date,
      end_date: engagements[1].end_date,
      allocation_percentage: j === 0 ? 60 : 100,
    });
  }

  // Engagement 3 (Zenith Healthcare): 4 people
  const e3Team = [2, 7, 12, 16];
  const e3Roles: AssignmentRole[] = ['lead', 'manager', 'consultant', 'analyst'];
  for (let j = 0; j < e3Team.length; j++) {
    assignments.push({
      id: `assignment-${assignmentId++}`,
      consultant_id: consultants[e3Team[j]].id,
      engagement_id: engagements[2].id,
      role: e3Roles[j],
      start_date: engagements[2].start_date,
      end_date: engagements[2].end_date,
      allocation_percentage: 80,
    });
  }

  // Engagement 4 (Vanguard Retail): 3 people
  const e4Team = [3, 8, 13];
  const e4Roles: AssignmentRole[] = ['lead', 'manager', 'consultant'];
  for (let j = 0; j < e4Team.length; j++) {
    assignments.push({
      id: `assignment-${assignmentId++}`,
      consultant_id: consultants[e4Team[j]].id,
      engagement_id: engagements[3].id,
      role: e4Roles[j],
      start_date: engagements[3].start_date,
      end_date: engagements[3].end_date,
      allocation_percentage: 100,
    });
  }

  // Engagement 5 (Pinnacle Energy): 5 people, consultant-2 is now on 3 engagements (burnout)
  const e5Team = [0, 4, 9, 14, 17];
  const e5Roles: AssignmentRole[] = ['lead', 'manager', 'consultant', 'consultant', 'analyst'];
  for (let j = 0; j < e5Team.length; j++) {
    assignments.push({
      id: `assignment-${assignmentId++}`,
      consultant_id: consultants[e5Team[j]].id,
      engagement_id: engagements[4].id,
      role: e5Roles[j],
      start_date: engagements[4].start_date,
      end_date: engagements[4].end_date,
      allocation_percentage: j === 0 ? 40 : 80,
    });
  }

  // Engagement 6 (Horizon Telecom): 3 people
  const e6Team = [1, 7, 18];
  const e6Roles: AssignmentRole[] = ['lead', 'consultant', 'analyst'];
  for (let j = 0; j < e6Team.length; j++) {
    assignments.push({
      id: `assignment-${assignmentId++}`,
      consultant_id: consultants[e6Team[j]].id,
      engagement_id: engagements[5].id,
      role: e6Roles[j],
      start_date: engagements[5].start_date,
      end_date: engagements[5].end_date,
      allocation_percentage: j === 0 ? 40 : 80,
    });
  }

  // Engagement 7 (Sterling Insurance): 3 people
  const e7Team = [3, 9, 15];
  const e7Roles: AssignmentRole[] = ['manager', 'consultant', 'analyst'];
  for (let j = 0; j < e7Team.length; j++) {
    assignments.push({
      id: `assignment-${assignmentId++}`,
      consultant_id: consultants[e7Team[j]].id,
      engagement_id: engagements[6].id,
      role: e7Roles[j],
      start_date: engagements[6].start_date,
      end_date: engagements[6].end_date,
      allocation_percentage: 60,
    });
  }

  // Engagement 8 (Nova Pharmaceuticals): 2 people - upcoming
  const e8Team = [4, 19];
  const e8Roles: AssignmentRole[] = ['lead', 'analyst'];
  for (let j = 0; j < e8Team.length; j++) {
    assignments.push({
      id: `assignment-${assignmentId++}`,
      consultant_id: consultants[e8Team[j]].id,
      engagement_id: engagements[7].id,
      role: e8Roles[j],
      start_date: engagements[7].start_date,
      end_date: engagements[7].end_date,
      allocation_percentage: 100,
    });
  }

  return assignments;
}

function generateWellbeingSignals(consultants: Consultant[]): WellbeingSignal[] {
  const signals: WellbeingSignal[] = [];
  const now = new Date();

  // Consultant 0 (partner on 2 engagements at 140%) - high burnout
  signals.push({
    id: 'signal-1',
    consultant_id: consultants[0].id,
    signal_type: 'overwork',
    severity: 'high',
    recorded_at: format(now, 'yyyy-MM-dd'),
  });

  // Consultant 7 (on 2 engagements) - medium
  signals.push({
    id: 'signal-2',
    consultant_id: consultants[7].id,
    signal_type: 'no_break',
    severity: 'medium',
    recorded_at: format(now, 'yyyy-MM-dd'),
  });

  // Consultant 1 (on 2 engagements) - medium
  signals.push({
    id: 'signal-3',
    consultant_id: consultants[1].id,
    signal_type: 'weekend_work',
    severity: 'medium',
    recorded_at: format(now, 'yyyy-MM-dd'),
  });

  // Consultant 9 (on 2 engagements) - high burnout
  signals.push({
    id: 'signal-4',
    consultant_id: consultants[9].id,
    signal_type: 'overwork',
    severity: 'high',
    recorded_at: format(now, 'yyyy-MM-dd'),
  });

  // Consultant 3 (on 2 engagements) - low
  signals.push({
    id: 'signal-5',
    consultant_id: consultants[3].id,
    signal_type: 'high_travel',
    severity: 'low',
    recorded_at: format(now, 'yyyy-MM-dd'),
  });

  // Consultant 2 (on 2 engagements at 160%) - high
  signals.push({
    id: 'signal-6',
    consultant_id: consultants[2].id,
    signal_type: 'overwork',
    severity: 'high',
    recorded_at: format(now, 'yyyy-MM-dd'),
  });

  return signals;
}

export function generateSeedData() {
  const consultants = generateConsultants();
  const engagements = generateEngagements();
  const assignments = generateAssignments(consultants, engagements);
  const wellbeingSignals = generateWellbeingSignals(consultants);

  return { consultants, engagements, assignments, wellbeingSignals };
}
