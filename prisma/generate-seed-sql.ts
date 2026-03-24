/**
 * Generates seed SQL for pasting into Supabase SQL Editor.
 * Run: npx tsx prisma/generate-seed-sql.ts > prisma/seed.sql
 */
import { faker } from '@faker-js/faker';
import { addWeeks, format, startOfWeek } from 'date-fns';
// createId was considered but simple deterministic IDs work better for seed data

faker.seed(42);

// Simple cuid-like IDs (deterministic for reproducibility)
let idCounter = 0;
function makeId(prefix: string): string {
  idCounter++;
  return `${prefix}_${String(idCounter).padStart(4, '0')}_${faker.string.alphanumeric(8)}`;
}

const CONSULTING_SKILLS = [
  'Financial Modeling', 'Change Management', 'Data Analytics', 'Due Diligence',
  'Process Optimization', 'Digital Strategy', 'Stakeholder Management', 'Market Analysis',
  'Risk Assessment', 'Supply Chain', 'M&A Integration', 'Cost Reduction',
  'Agile Transformation', 'Cloud Migration', 'People Analytics', 'Regulatory Compliance',
  'Revenue Growth', 'Customer Experience', 'Organizational Design', 'Performance Management',
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

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

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

const lines: string[] = [];
function sql(s: string) { lines.push(s); }

sql('-- ============================================');
sql('-- StaffingHub Seed Data');
sql('-- Generated from prisma/generate-seed-sql.ts');
sql('-- ============================================');
sql('');
sql('BEGIN;');
sql('');

// Clean existing data
sql('-- Clean existing data');
sql('DELETE FROM "proposal_slots";');
sql('DELETE FROM "proposals";');
sql('DELETE FROM "wellbeing_signals";');
sql('DELETE FROM "assignments";');
sql('DELETE FROM "consultant_skills";');
sql('DELETE FROM "engagement_skills";');
sql('DELETE FROM "consultants";');
sql('DELETE FROM "engagements";');
sql('DELETE FROM "skills";');
sql('');

// 1. Skills
sql('-- ── Skills ──');
const skillIds: Record<string, string> = {};
for (const name of CONSULTING_SKILLS) {
  const id = makeId('sk');
  skillIds[name] = id;
  const now = new Date().toISOString();
  sql(`INSERT INTO "skills" ("id", "name", "created_at") VALUES ('${id}', '${esc(name)}', '${now}');`);
}
sql('');

// 2. Consultants
sql('-- ── Consultants ──');
const consultantIds: string[] = [];
const consultantSkillAssignments: { consultantId: string; skillName: string }[] = [];

for (let i = 0; i < 20; i++) {
  const id = makeId('con');
  consultantIds.push(id);
  const practiceArea = PRACTICE_AREAS[i % 5];
  const seniority = SENIORITY_DISTRIBUTION[i];
  const name = faker.person.fullName();
  const role = seniorityToRole(seniority);
  const avatarUrl = `https://api.dicebear.com/9.x/notionists/svg?seed=${faker.string.alphanumeric(8)}`;
  const now = new Date().toISOString();

  sql(`INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('${id}', '${esc(name)}', '${esc(role)}', '${practiceArea}', '${seniority}', '${esc(avatarUrl)}', 'active', '${now}', '${now}');`);

  const numSkills = faker.number.int({ min: 3, max: 6 });
  const selectedSkills = faker.helpers.arrayElements(CONSULTING_SKILLS, numSkills);
  for (const skillName of selectedSkills) {
    consultantSkillAssignments.push({ consultantId: id, skillName });
  }
}
sql('');

// 3. Consultant Skills
sql('-- ── Consultant Skills ──');
for (const { consultantId, skillName } of consultantSkillAssignments) {
  sql(`INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('${consultantId}', '${skillIds[skillName]}');`);
}
sql('');

// 4. Engagements
sql('-- ── Engagements ──');
const now = startOfWeek(new Date(), { weekStartsOn: 1 });
const durations = [3, 4, 6, 8, 5, 10, 7, 12];
const offsets = [-2, -1, 0, 1, -3, 2, -1, 3];
const engagementIds: string[] = [];
const engagementDates: { startDate: Date; endDate: Date }[] = [];

for (let i = 0; i < 8; i++) {
  const id = makeId('eng');
  engagementIds.push(id);
  const start = addWeeks(now, offsets[i]);
  const end = addWeeks(start, durations[i]);
  engagementDates.push({ startDate: start, endDate: end });

  const isStarted = offsets[i] <= 0;
  const isNearEnd = offsets[i] + durations[i] <= 2;
  const status = i === 4 ? 'at_risk' : isNearEnd ? 'completed' : isStarted ? 'active' : 'upcoming';
  const startStr = format(start, 'yyyy-MM-dd');
  const endStr = format(end, 'yyyy-MM-dd');
  const ts = new Date().toISOString();

  sql(`INSERT INTO "engagements" ("id", "client_name", "project_name", "start_date", "end_date", "status", "color", "created_at", "updated_at") VALUES ('${id}', '${esc(CLIENTS[i].name)}', '${esc(CLIENTS[i].project)}', '${startStr}', '${endStr}', '${status}', '${CLIENT_COLORS[i]}', '${ts}', '${ts}');`);

  // Required skills for this engagement
  const requiredSkills = faker.helpers.arrayElements(
    CONSULTING_SKILLS,
    faker.number.int({ min: 3, max: 5 })
  );
  for (const skillName of requiredSkills) {
    sql(`INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('${id}', '${skillIds[skillName]}');`);
  }
}
sql('');

// 5. Assignments
sql('-- ── Assignments ──');
type AssignmentDef = {
  team: number[];
  roles: ('lead' | 'manager' | 'consultant' | 'analyst')[];
  allocations: number[];
  engIdx: number;
};

const assignmentDefs: AssignmentDef[] = [
  { engIdx: 0, team: [0, 2, 5, 10], roles: ['lead', 'manager', 'consultant', 'analyst'], allocations: [100, 80, 100, 100] },
  { engIdx: 1, team: [1, 6, 11], roles: ['lead', 'consultant', 'analyst'], allocations: [60, 100, 100] },
  { engIdx: 2, team: [2, 7, 12, 16], roles: ['lead', 'manager', 'consultant', 'analyst'], allocations: [80, 80, 80, 80] },
  { engIdx: 3, team: [3, 8, 13], roles: ['lead', 'manager', 'consultant'], allocations: [100, 100, 100] },
  { engIdx: 4, team: [0, 4, 9, 14, 17], roles: ['lead', 'manager', 'consultant', 'consultant', 'analyst'], allocations: [40, 80, 80, 80, 80] },
  { engIdx: 5, team: [1, 7, 18], roles: ['lead', 'consultant', 'analyst'], allocations: [40, 80, 80] },
  { engIdx: 6, team: [3, 9, 15], roles: ['manager', 'consultant', 'analyst'], allocations: [60, 60, 60] },
  { engIdx: 7, team: [4, 19], roles: ['lead', 'analyst'], allocations: [100, 100] },
];

for (const def of assignmentDefs) {
  const engId = engagementIds[def.engIdx];
  const { startDate, endDate } = engagementDates[def.engIdx];
  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');
  const ts = new Date().toISOString();

  for (let j = 0; j < def.team.length; j++) {
    const id = makeId('asgn');
    sql(`INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('${id}', '${consultantIds[def.team[j]]}', '${engId}', '${def.roles[j]}', '${startStr}', '${endStr}', ${def.allocations[j]}, '${ts}', '${ts}');`);
  }
}
sql('');

// 6. Wellbeing signals
sql('-- ── Wellbeing Signals ──');
const today = format(new Date(), 'yyyy-MM-dd');
const signals = [
  { idx: 0, type: 'overwork', severity: 'high' },
  { idx: 7, type: 'no_break', severity: 'medium' },
  { idx: 1, type: 'weekend_work', severity: 'medium' },
  { idx: 9, type: 'overwork', severity: 'high' },
  { idx: 3, type: 'high_travel', severity: 'low' },
  { idx: 2, type: 'overwork', severity: 'high' },
];

for (const sig of signals) {
  const id = makeId('ws');
  const ts = new Date().toISOString();
  sql(`INSERT INTO "wellbeing_signals" ("id", "consultant_id", "signal_type", "severity", "recorded_at", "created_at") VALUES ('${id}', '${consultantIds[sig.idx]}', '${sig.type}', '${sig.severity}', '${today}', '${ts}');`);
}
sql('');

sql('COMMIT;');
sql('');
sql('-- Done! Check your tables in Supabase Table Editor.');

console.log(lines.join('\n'));
