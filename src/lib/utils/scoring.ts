import type { Consultant, Engagement, Assignment, WellbeingSignal, ProposalSlot } from '../types';
import { calculateBurnoutRisk } from './burnout';

export interface FitScoreBreakdown {
  total: number;
  skillCoverage: number;
  seniorityBalance: number;
  burnoutRisk: number;
  coveredSkills: string[];
  missingSkills: string[];
}

export function calculateFitScore(
  slots: ProposalSlot[],
  engagement: Engagement,
  consultants: Consultant[],
  assignments: Assignment[],
  signals: WellbeingSignal[]
): FitScoreBreakdown {
  const assignedConsultants = slots
    .filter((s) => s.consultant_id !== null)
    .map((s) => consultants.find((c) => c.id === s.consultant_id))
    .filter((c): c is Consultant => c !== undefined);

  if (assignedConsultants.length === 0) {
    return {
      total: 0,
      skillCoverage: 0,
      seniorityBalance: 0,
      burnoutRisk: 0,
      coveredSkills: [],
      missingSkills: engagement.required_skills,
    };
  }

  // Skill coverage (0-40 points)
  const teamSkills = new Set(assignedConsultants.flatMap((c) => c.skills));
  const coveredSkills = engagement.required_skills.filter((s) =>
    teamSkills.has(s)
  );
  const missingSkills = engagement.required_skills.filter(
    (s) => !teamSkills.has(s)
  );
  const skillCoverage =
    engagement.required_skills.length > 0
      ? Math.round(
          (coveredSkills.length / engagement.required_skills.length) * 40
        )
      : 40;

  // Seniority balance (0-30 points)
  const filledSlots = slots.filter((s) => s.consultant_id !== null);
  const totalSlots = slots.filter((s) => s.required).length;
  const fillRate = totalSlots > 0 ? filledSlots.length / totalSlots : 1;

  const hasLead = slots.some(
    (s) => s.role === 'lead' && s.consultant_id !== null
  );
  const hasManager = slots.some(
    (s) => s.role === 'manager' && s.consultant_id !== null
  );
  let seniorityBalance = Math.round(fillRate * 20);
  if (hasLead) seniorityBalance += 5;
  if (hasManager) seniorityBalance += 5;

  // Burnout risk penalty (0-30 points, inverted)
  const avgBurnout =
    assignedConsultants.reduce(
      (sum, c) => sum + calculateBurnoutRisk(c.id, assignments, signals),
      0
    ) / assignedConsultants.length;
  const burnoutScore = Math.round(30 * (1 - avgBurnout / 100));

  const total = skillCoverage + seniorityBalance + burnoutScore;

  return {
    total,
    skillCoverage,
    seniorityBalance,
    burnoutRisk: Math.round(avgBurnout),
    coveredSkills,
    missingSkills,
  };
}
