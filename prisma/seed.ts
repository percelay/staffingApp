/**
 * Prisma Seed Script
 *
 * Uses the canonical demo seed builder from src/server/demo/seed-data.ts so
 * bootstrap fallback data and database seed data stay aligned.
 */

import { PrismaClient } from '../src/generated/prisma/client';
import { generateDemoSeedData } from '../src/server/demo/seed-data';

const prisma = new PrismaClient();

async function main() {
  const seed = generateDemoSeedData();

  console.log('Cleaning existing data...');
  await prisma.$transaction([
    prisma.proposalSlot.deleteMany(),
    prisma.proposal.deleteMany(),
    prisma.tentativeAssignment.deleteMany(),
    prisma.scenario.deleteMany(),
    prisma.opportunitySkill.deleteMany(),
    prisma.opportunity.deleteMany(),
    prisma.wellbeingSignal.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.consultantSkill.deleteMany(),
    prisma.consultantGoal.deleteMany(),
    prisma.engagementSkill.deleteMany(),
    prisma.consultant.deleteMany(),
    prisma.engagement.deleteMany(),
    prisma.skill.deleteMany(),
  ]);

  console.log('Creating skills...');
  const skills = await Promise.all(
    seed.skills.map((name) => prisma.skill.create({ data: { name } }))
  );
  const skillByName = new Map(skills.map((skill) => [skill.name, skill]));

  console.log('Creating consultants...');
  const consultantIdMap = new Map<string, string>();
  for (const consultant of seed.consultants) {
    const created = await prisma.consultant.create({
      data: {
        name: consultant.name,
        role: consultant.role,
        practiceArea: consultant.practice_area,
        seniorityLevel: consultant.seniority_level,
        avatarUrl: consultant.avatar_url,
        status: consultant.status,
        skills: {
          create: consultant.skills.map((skillName) => ({
            skillId: skillByName.get(skillName)!.id,
          })),
        },
        goals: {
          create: consultant.goals.map((skillName) => ({
            skillId: skillByName.get(skillName)!.id,
          })),
        },
      },
    });
    consultantIdMap.set(consultant.id, created.id);
  }

  console.log('Creating engagements...');
  const engagementIdMap = new Map<string, string>();
  for (const engagement of seed.engagements) {
    const created = await prisma.engagement.create({
      data: {
        clientName: engagement.client_name,
        projectName: engagement.project_name,
        startDate: new Date(engagement.start_date),
        endDate: new Date(engagement.end_date),
        status: engagement.status,
        color: engagement.color,
        isBet: engagement.is_bet,
        requiredSkills: {
          create: engagement.required_skills.map((skillName) => ({
            skillId: skillByName.get(skillName)!.id,
          })),
        },
      },
    });
    engagementIdMap.set(engagement.id, created.id);
  }

  console.log('Creating assignments...');
  for (const assignment of seed.assignments) {
    await prisma.assignment.create({
      data: {
        consultantId: consultantIdMap.get(assignment.consultant_id)!,
        engagementId: engagementIdMap.get(assignment.engagement_id)!,
        role: assignment.role,
        startDate: new Date(assignment.start_date),
        endDate: new Date(assignment.end_date),
        allocationPercentage: assignment.allocation_percentage,
      },
    });
  }

  console.log('Creating wellbeing signals...');
  for (const signal of seed.wellbeingSignals) {
    await prisma.wellbeingSignal.create({
      data: {
        consultantId: consultantIdMap.get(signal.consultant_id)!,
        signalType: signal.signal_type,
        severity: signal.severity,
        recordedAt: new Date(signal.recorded_at),
      },
    });
  }

  console.log('Creating opportunities...');
  const opportunityIdMap = new Map<string, string>();
  for (const opportunity of seed.opportunities) {
    const created = await prisma.opportunity.create({
      data: {
        clientName: opportunity.client_name,
        projectName: opportunity.project_name,
        startDate: new Date(opportunity.start_date),
        endDate: new Date(opportunity.end_date),
        stage: opportunity.stage,
        probability: opportunity.probability,
        estimatedValue: opportunity.estimated_value,
        color: opportunity.color,
        isBet: opportunity.is_bet,
        notes: opportunity.notes,
        convertedEngagementId: opportunity.converted_engagement_id
          ? engagementIdMap.get(opportunity.converted_engagement_id) ?? null
          : null,
        requiredSkills: {
          create: opportunity.required_skills.map((skillName) => ({
            skillId: skillByName.get(skillName)!.id,
          })),
        },
      },
    });
    opportunityIdMap.set(opportunity.id, created.id);
  }

  console.log('Creating scenarios...');
  for (const scenario of seed.scenarios) {
    await prisma.scenario.create({
      data: {
        opportunityId: opportunityIdMap.get(scenario.opportunity_id)!,
        name: scenario.name,
        isDefault: scenario.is_default,
        fitScore: scenario.fit_score,
        burnoutImpact: scenario.burnout_impact,
        tentativeAssignments: {
          create: scenario.tentative_assignments.map((assignment) => ({
            consultantId: consultantIdMap.get(assignment.consultant_id)!,
            role: assignment.role,
            startDate: new Date(assignment.start_date),
            endDate: new Date(assignment.end_date),
            allocationPercentage: assignment.allocation_percentage,
          })),
        },
      },
    });
  }

  console.log('Seed complete!');
  console.log(`  ${seed.skills.length} skills`);
  console.log(`  ${seed.consultants.length} consultants`);
  console.log(`  ${seed.engagements.length} engagements`);
  console.log(`  ${seed.assignments.length} assignments`);
  console.log(`  ${seed.wellbeingSignals.length} wellbeing signals`);
  console.log(`  ${seed.opportunities.length} opportunities`);
  console.log(`  ${seed.scenarios.length} scenarios`);
  console.log(
    `  ${seed.scenarios.reduce(
      (count, scenario) => count + scenario.tentative_assignments.length,
      0
    )} tentative assignments`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
