import type { Consultant, PracticeArea } from '@/lib/types/consultant';

type ConsultantReference = {
  consultant_id: string;
};

type AllocationReference = {
  allocation_percentage: number;
};

interface TeamSkillCoverage {
  teamSkills: string[];
  coveredSkills: string[];
  missingSkills: string[];
}

function normalizeStaffingSkillName(value: string) {
  return value.trim().toLowerCase();
}

export function getConsultantMatches(source: string[], requiredSkills: string[]) {
  if (source.length === 0 || requiredSkills.length === 0) {
    return [];
  }

  const required = new Set(requiredSkills.map(normalizeStaffingSkillName));
  return source.filter((item) =>
    required.has(normalizeStaffingSkillName(item))
  );
}

export function hasNormalizedValue(source: string[], candidate: string) {
  const normalizedCandidate = normalizeStaffingSkillName(candidate);
  return source.some(
    (item) => normalizeStaffingSkillName(item) === normalizedCandidate
  );
}

export function getAvailableConsultants(
  consultants: Consultant[],
  assignedItems: Iterable<string> | ConsultantReference[],
  practiceFilter: PracticeArea | 'all' = 'all'
) {
  const assignedIds = new Set(
    Array.isArray(assignedItems)
      ? assignedItems.map((item) =>
          typeof item === 'string' ? item : item.consultant_id
        )
      : assignedItems
  );

  return consultants.filter((consultant) => {
    if (assignedIds.has(consultant.id)) {
      return false;
    }

    if (
      practiceFilter !== 'all' &&
      consultant.practice_area !== practiceFilter
    ) {
      return false;
    }

    return true;
  });
}

export function getTotalAllocation(assignments: AllocationReference[]) {
  return assignments.reduce(
    (sum, assignment) => sum + assignment.allocation_percentage,
    0
  );
}

export function getTeamSkillCoverage(
  consultants: Consultant[],
  assignedItems: Iterable<string> | ConsultantReference[],
  requiredSkills: string[]
): TeamSkillCoverage {
  const assignedIds = new Set(
    Array.isArray(assignedItems)
      ? assignedItems.map((item) =>
          typeof item === 'string' ? item : item.consultant_id
        )
      : assignedItems
  );

  const teamSkills = new Set<string>();

  for (const consultant of consultants) {
    if (!assignedIds.has(consultant.id)) {
      continue;
    }

    for (const skill of consultant.skills) {
      teamSkills.add(skill);
    }
  }

  const teamSkillList = [...teamSkills];
  const coveredSkills = requiredSkills.filter((skill) =>
    hasNormalizedValue(teamSkillList, skill)
  );
  const missingSkills = requiredSkills.filter(
    (skill) => !hasNormalizedValue(teamSkillList, skill)
  );

  return {
    teamSkills: teamSkillList,
    coveredSkills,
    missingSkills,
  };
}
