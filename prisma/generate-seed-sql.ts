/**
 * Generates seed SQL for pasting into Supabase SQL Editor.
 * Run: npx tsx prisma/generate-seed-sql.ts > prisma/seed.sql
 *
 * This script intentionally uses the canonical demo seed builder so SQL seed
 * output, bootstrap demo mode, and Prisma DB seeding stay aligned.
 */

import { generateDemoSeedData } from '../src/server/demo/seed-data';

function esc(value: string) {
  return value.replace(/'/g, "''");
}

function sqlString(value: string | null) {
  return value === null ? 'NULL' : `'${esc(value)}'`;
}

function sqlNumber(value: number | null) {
  return value === null ? 'NULL' : String(value);
}

function sqlBoolean(value: boolean) {
  return value ? 'TRUE' : 'FALSE';
}

const lines: string[] = [];

function sql(statement: string) {
  lines.push(statement);
}

function buildSkillIdMap(skills: string[]) {
  return new Map(skills.map((skill, index) => [skill, `skill-${index + 1}`]));
}

function addInsertHeader(title: string) {
  sql(`-- ${title}`);
}

const seed = generateDemoSeedData();
const now = new Date().toISOString();
const skillIdByName = buildSkillIdMap(seed.skills);

sql('-- ============================================');
sql('-- StaffingHub Seed Data');
sql('-- Generated from prisma/generate-seed-sql.ts');
sql('-- Canonical source: src/server/demo/seed-data.ts');
sql('-- ============================================');
sql('');
sql('BEGIN;');
sql('');

addInsertHeader('Clean existing data');
sql('DELETE FROM "proposal_slots";');
sql('DELETE FROM "proposals";');
sql('DELETE FROM "tentative_assignments";');
sql('DELETE FROM "scenarios";');
sql('DELETE FROM "opportunity_skills";');
sql('DELETE FROM "opportunities";');
sql('DELETE FROM "wellbeing_signals";');
sql('DELETE FROM "assignments";');
sql('DELETE FROM "consultant_goals";');
sql('DELETE FROM "consultant_skills";');
sql('DELETE FROM "engagement_skills";');
sql('DELETE FROM "consultants";');
sql('DELETE FROM "engagements";');
sql('DELETE FROM "skills";');
sql('');

addInsertHeader('Skills');
for (const skill of seed.skills) {
  sql(
    `INSERT INTO "skills" ("id", "name", "created_at") VALUES (${sqlString(
      skillIdByName.get(skill) ?? null
    )}, ${sqlString(skill)}, '${now}');`
  );
}
sql('');

addInsertHeader('Consultants');
for (const consultant of seed.consultants) {
  sql(
    `INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES (${sqlString(
      consultant.id
    )}, ${sqlString(consultant.name)}, ${sqlString(
      consultant.role
    )}, ${sqlString(consultant.practice_area)}, ${sqlString(
      consultant.seniority_level
    )}, ${sqlString(consultant.avatar_url)}, ${sqlString(
      consultant.status
    )}, '${now}', '${now}');`
  );
}
sql('');

addInsertHeader('Consultant Skills');
for (const consultant of seed.consultants) {
  for (const skill of consultant.skills) {
    sql(
      `INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES (${sqlString(
        consultant.id
      )}, ${sqlString(skillIdByName.get(skill) ?? null)});`
    );
  }
}
sql('');

addInsertHeader('Consultant Goals');
for (const consultant of seed.consultants) {
  for (const skill of consultant.goals) {
    sql(
      `INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES (${sqlString(
        consultant.id
      )}, ${sqlString(skillIdByName.get(skill) ?? null)});`
    );
  }
}
sql('');

addInsertHeader('Engagements');
for (const engagement of seed.engagements) {
  sql(
    `INSERT INTO "engagements" ("id", "client_name", "project_name", "start_date", "end_date", "status", "color", "is_bet", "created_at", "updated_at") VALUES (${sqlString(
      engagement.id
    )}, ${sqlString(engagement.client_name)}, ${sqlString(
      engagement.project_name
    )}, ${sqlString(engagement.start_date)}, ${sqlString(
      engagement.end_date
    )}, ${sqlString(engagement.status)}, ${sqlString(
      engagement.color
    )}, ${sqlBoolean(engagement.is_bet)}, '${now}', '${now}');`
  );
}
sql('');

addInsertHeader('Engagement Skills');
for (const engagement of seed.engagements) {
  for (const skill of engagement.required_skills) {
    sql(
      `INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES (${sqlString(
        engagement.id
      )}, ${sqlString(skillIdByName.get(skill) ?? null)});`
    );
  }
}
sql('');

addInsertHeader('Assignments');
for (const assignment of seed.assignments) {
  sql(
    `INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES (${sqlString(
      assignment.id
    )}, ${sqlString(assignment.consultant_id)}, ${sqlString(
      assignment.engagement_id
    )}, ${sqlString(assignment.role)}, ${sqlString(
      assignment.start_date
    )}, ${sqlString(assignment.end_date)}, ${sqlNumber(
      assignment.allocation_percentage
    )}, '${now}', '${now}');`
  );
}
sql('');

addInsertHeader('Wellbeing Signals');
for (const signal of seed.wellbeingSignals) {
  sql(
    `INSERT INTO "wellbeing_signals" ("id", "consultant_id", "signal_type", "severity", "recorded_at", "created_at") VALUES (${sqlString(
      signal.id
    )}, ${sqlString(signal.consultant_id)}, ${sqlString(
      signal.signal_type
    )}, ${sqlString(signal.severity)}, ${sqlString(
      signal.recorded_at
    )}, '${now}');`
  );
}
sql('');

addInsertHeader('Opportunities');
for (const opportunity of seed.opportunities) {
  sql(
    `INSERT INTO "opportunities" ("id", "client_name", "project_name", "start_date", "end_date", "stage", "probability", "estimated_value", "color", "is_bet", "notes", "converted_engagement_id", "created_at", "updated_at") VALUES (${sqlString(
      opportunity.id
    )}, ${sqlString(opportunity.client_name)}, ${sqlString(
      opportunity.project_name
    )}, ${sqlString(opportunity.start_date)}, ${sqlString(
      opportunity.end_date
    )}, ${sqlString(opportunity.stage)}, ${sqlNumber(
      opportunity.probability
    )}, ${sqlNumber(opportunity.estimated_value)}, ${sqlString(
      opportunity.color
    )}, ${sqlBoolean(opportunity.is_bet)}, ${sqlString(
      opportunity.notes
    )}, ${sqlString(opportunity.converted_engagement_id)}, '${now}', '${now}');`
  );
}
sql('');

addInsertHeader('Opportunity Skills');
for (const opportunity of seed.opportunities) {
  for (const skill of opportunity.required_skills) {
    sql(
      `INSERT INTO "opportunity_skills" ("opportunity_id", "skill_id") VALUES (${sqlString(
        opportunity.id
      )}, ${sqlString(skillIdByName.get(skill) ?? null)});`
    );
  }
}
sql('');

addInsertHeader('Scenarios');
for (const scenario of seed.scenarios) {
  sql(
    `INSERT INTO "scenarios" ("id", "opportunity_id", "name", "is_default", "fit_score", "burnout_impact", "created_at") VALUES (${sqlString(
      scenario.id
    )}, ${sqlString(scenario.opportunity_id)}, ${sqlString(
      scenario.name
    )}, ${sqlBoolean(scenario.is_default)}, ${sqlNumber(
      scenario.fit_score
    )}, ${sqlNumber(scenario.burnout_impact)}, '${now}');`
  );
}
sql('');

addInsertHeader('Tentative Assignments');
for (const scenario of seed.scenarios) {
  for (const assignment of scenario.tentative_assignments) {
    sql(
      `INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES (${sqlString(
        assignment.id
      )}, ${sqlString(scenario.id)}, ${sqlString(
        assignment.consultant_id
      )}, ${sqlString(assignment.role)}, ${sqlString(
        assignment.start_date
      )}, ${sqlString(assignment.end_date)}, ${sqlNumber(
        assignment.allocation_percentage
      )}, '${now}', '${now}');`
    );
  }
}
sql('');

sql('COMMIT;');
sql('');
sql('-- Done! Check your tables in Supabase Table Editor.');

console.log(lines.join('\n'));
