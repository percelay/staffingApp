/**
 * Prisma Seed Script
 *
 * Replicates the exact same data relationships from the original
 * faker-based seed.ts, but writes to PostgreSQL via Prisma.
 *
 * Run: npx prisma db seed
 */

import { PrismaClient } from '../src/generated/prisma/client';
import { faker } from '@faker-js/faker';
import { addWeeks, format, startOfWeek } from 'date-fns';

const prisma = new PrismaClient();

faker.seed(42);

const CONSULTING_SKILLS = [
  'Financial Modeling',
  'Change Management',
  'Data Analytics',
  'Due Diligence',
  'Process Optimization',
  'Digital Strategy',
  'Stakeholder Management',
  'Market Analysis',
  'Risk Assessment',
  'Supply Chain',
  'M&A Integration',
  'Cost Reduction',
  'Agile Transformation',
  'Cloud Migration',
  'People Analytics',
  'Regulatory Compliance',
  'Revenue Growth',
  'Customer Experience',
  'Organizational Design',
  'Performance Management',
];

const PRACTICE_AREAS = ['strategy', 'operations', 'digital', 'risk', 'people'] as const;

const SENIORITY_DISTRIBUTION = [
  'partner', 'partner',
  'senior_manager', 'senior_manager', 'senior_manager',
  'manager', 'manager', 'manager', 'manager', 'manager',
  'consultant', 'consultant', 'consultant', 'consultant', 'consultant', 'consultant',
  'analyst', 'analyst', 'analyst', 'analyst',
] as const;

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

const CLIENT_COLORS = [
  '#4F46E5', '#0891B2', '#059669', '#D97706',
  '#DC2626', '#7C3AED', '#DB2777', '#2563EB',
];

function seniorityToRole(seniority: string): string {
  switch (seniority) {
    case 'partner': return 'Partner';
    case 'senior_manager': return 'Senior Manager';
    case 'manager': return 'Manager';
    case 'consultant': return 'Consultant';
    case 'analyst': return 'Analyst';
    default: return 'Consultant';
  }
}

async function main() {
  console.log('Cleaning existing data...');
  await prisma.$transaction([
    prisma.proposalSlot.deleteMany(),
    prisma.proposal.deleteMany(),
    prisma.wellbeingSignal.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.consultantSkill.deleteMany(),
    prisma.engagementSkill.deleteMany(),
    prisma.consultant.deleteMany(),
    prisma.engagement.deleteMany(),
    prisma.skill.deleteMany(),
  ]);

  // ── 1. Create skills ──────────────────────────────────
  console.log('Creating skills...');
  const skills = await Promise.all(
    CONSULTING_SKILLS.map((name) =>
      prisma.skill.create({ data: { name } })
    )
  );
  const skillByName = new Map(skills.map((s) => [s.name, s]));

  // ── 2. Create consultants ─────────────────────────────
  console.log('Creating consultants...');
  const consultants = [];
  for (let i = 0; i < 20; i++) {
    const practiceArea = PRACTICE_AREAS[i % 5];
    const seniority = SENIORITY_DISTRIBUTION[i];
    const numSkills = faker.number.int({ min: 3, max: 6 });
    const selectedSkills = faker.helpers.arrayElements(CONSULTING_SKILLS, numSkills);

    const consultant = await prisma.consultant.create({
      data: {
        name: faker.person.fullName(),
        role: seniorityToRole(seniority),
        practiceArea,
        seniorityLevel: seniority,
        avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${faker.string.alphanumeric(8)}`,
        status: 'active',
        skills: {
          create: selectedSkills.map((skillName) => ({
            skillId: skillByName.get(skillName)!.id,
          })),
        },
      },
    });
    consultants.push(consultant);
  }

  // ── 3. Create engagements ─────────────────────────────
  console.log('Creating engagements...');
  const now = startOfWeek(new Date(), { weekStartsOn: 1 });
  const durations = [3, 4, 6, 8, 5, 10, 7, 12];
  const offsets = [-2, -1, 0, 1, -3, 2, -1, 3];
  const engagements = [];

  for (let i = 0; i < 8; i++) {
    const start = addWeeks(now, offsets[i]);
    const end = addWeeks(start, durations[i]);
    const requiredSkills = faker.helpers.arrayElements(
      CONSULTING_SKILLS,
      faker.number.int({ min: 3, max: 5 })
    );

    const isStarted = offsets[i] <= 0;
    const isNearEnd = offsets[i] + durations[i] <= 2;
    const status = i === 4 ? 'at_risk' : isNearEnd ? 'completed' : isStarted ? 'active' : 'upcoming';

    const engagement = await prisma.engagement.create({
      data: {
        clientName: CLIENTS[i].name,
        projectName: CLIENTS[i].project,
        startDate: new Date(format(start, 'yyyy-MM-dd')),
        endDate: new Date(format(end, 'yyyy-MM-dd')),
        status: status as 'active' | 'upcoming' | 'completed' | 'at_risk',
        color: CLIENT_COLORS[i % CLIENT_COLORS.length],
        requiredSkills: {
          create: requiredSkills.map((skillName) => ({
            skillId: skillByName.get(skillName)!.id,
          })),
        },
      },
    });
    engagements.push(engagement);
  }

  // ── 4. Create assignments ─────────────────────────────
  console.log('Creating assignments...');

  type AssignmentDef = {
    team: number[];
    roles: ('lead' | 'manager' | 'consultant' | 'analyst')[];
    allocations: number[];
    engIdx: number;
  };

  const assignmentDefs: AssignmentDef[] = [
    // Engagement 1 (Meridian Financial): 4 people
    { engIdx: 0, team: [0, 2, 5, 10], roles: ['lead', 'manager', 'consultant', 'analyst'], allocations: [100, 80, 100, 100] },
    // Engagement 2 (Atlas Manufacturing): 3 people
    { engIdx: 1, team: [1, 6, 11], roles: ['lead', 'consultant', 'analyst'], allocations: [60, 100, 100] },
    // Engagement 3 (Zenith Healthcare): 4 people
    { engIdx: 2, team: [2, 7, 12, 16], roles: ['lead', 'manager', 'consultant', 'analyst'], allocations: [80, 80, 80, 80] },
    // Engagement 4 (Vanguard Retail): 3 people
    { engIdx: 3, team: [3, 8, 13], roles: ['lead', 'manager', 'consultant'], allocations: [100, 100, 100] },
    // Engagement 5 (Pinnacle Energy — at_risk): 5 people, overlapping = burnout
    { engIdx: 4, team: [0, 4, 9, 14, 17], roles: ['lead', 'manager', 'consultant', 'consultant', 'analyst'], allocations: [40, 80, 80, 80, 80] },
    // Engagement 6 (Horizon Telecom): 3 people
    { engIdx: 5, team: [1, 7, 18], roles: ['lead', 'consultant', 'analyst'], allocations: [40, 80, 80] },
    // Engagement 7 (Sterling Insurance): 3 people
    { engIdx: 6, team: [3, 9, 15], roles: ['manager', 'consultant', 'analyst'], allocations: [60, 60, 60] },
    // Engagement 8 (Nova Pharmaceuticals): 2 people
    { engIdx: 7, team: [4, 19], roles: ['lead', 'analyst'], allocations: [100, 100] },
  ];

  for (const def of assignmentDefs) {
    const eng = engagements[def.engIdx];
    for (let j = 0; j < def.team.length; j++) {
      await prisma.assignment.create({
        data: {
          consultantId: consultants[def.team[j]].id,
          engagementId: eng.id,
          role: def.roles[j],
          startDate: eng.startDate,
          endDate: eng.endDate,
          allocationPercentage: def.allocations[j],
        },
      });
    }
  }

  // ── 5. Create wellbeing signals ───────────────────────
  console.log('Creating wellbeing signals...');
  const today = new Date(format(new Date(), 'yyyy-MM-dd'));

  const signals = [
    { idx: 0, type: 'overwork' as const, severity: 'high' as const },
    { idx: 7, type: 'no_break' as const, severity: 'medium' as const },
    { idx: 1, type: 'weekend_work' as const, severity: 'medium' as const },
    { idx: 9, type: 'overwork' as const, severity: 'high' as const },
    { idx: 3, type: 'high_travel' as const, severity: 'low' as const },
    { idx: 2, type: 'overwork' as const, severity: 'high' as const },
  ];

  for (const sig of signals) {
    await prisma.wellbeingSignal.create({
      data: {
        consultantId: consultants[sig.idx].id,
        signalType: sig.type,
        severity: sig.severity,
        recordedAt: today,
      },
    });
  }

  console.log('Seed complete!');
  console.log(`  ${skills.length} skills`);
  console.log(`  ${consultants.length} consultants`);
  console.log(`  ${engagements.length} engagements`);
  console.log(`  ${assignmentDefs.reduce((sum, d) => sum + d.team.length, 0)} assignments`);
  console.log(`  ${signals.length} wellbeing signals`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
