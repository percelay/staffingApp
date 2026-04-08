import {
  CONSULTANT_STATUS_VALUES,
  PRACTICE_AREA_VALUES,
  type ConsultantStatus,
  type PracticeArea,
} from '@/lib/contracts/consultant';
import type {
  ConsultantCreateInput,
  ConsultantGoalsInput,
  ConsultantSkillsInput,
  ConsultantUpdateInput,
} from '@/server/schemas/consultants';
import {
  assertFound,
} from '@/server/http';
import {
  createConsultant,
  getConsultantById,
  listConsultants,
  replaceConsultantGoals,
  replaceConsultantSkills,
  softDeleteConsultant,
  updateConsultant,
} from '@/server/repositories/consultants-repository';
import { serializeConsultant } from '@/server/serializers/consultants';

export async function getConsultants(filters?: {
  status?: string | null;
  practiceArea?: string | null;
}) {
  const normalizedStatus =
    filters?.status === 'all'
      ? 'all'
      : CONSULTANT_STATUS_VALUES.includes(filters?.status as ConsultantStatus)
        ? (filters?.status as ConsultantStatus)
        : 'active';

  const normalizedPracticeArea = PRACTICE_AREA_VALUES.includes(
    filters?.practiceArea as PracticeArea
  )
    ? (filters?.practiceArea as PracticeArea)
    : null;

  const records = await listConsultants({
    status: normalizedStatus,
    practiceArea: normalizedPracticeArea,
  });
  return records.map(serializeConsultant);
}

export async function getConsultant(id: string) {
  const record = await getConsultantById(id);
  return record ? serializeConsultant(record) : null;
}

export async function createConsultantFromInput(input: ConsultantCreateInput) {
  const record = await createConsultant({
    name: input.name,
    role: input.role,
    practiceArea: input.practice_area,
    seniorityLevel: input.seniority_level,
    avatarUrl:
      input.avatar_url ||
      `https://api.dicebear.com/9.x/notionists/svg?seed=${Date.now()}`,
    status: input.status ?? 'active',
    skills: input.skills,
    goals: input.goals,
  });

  return serializeConsultant(record);
}

export async function updateConsultantFromInput(
  id: string,
  input: ConsultantUpdateInput
) {
  assertFound(await getConsultantById(id), 'Consultant not found');
  const record = await updateConsultant(id, {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.role !== undefined ? { role: input.role } : {}),
    ...(input.practice_area !== undefined
      ? { practiceArea: input.practice_area }
      : {}),
    ...(input.seniority_level !== undefined
      ? { seniorityLevel: input.seniority_level }
      : {}),
    ...(input.avatar_url !== undefined ? { avatarUrl: input.avatar_url } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
  });

  return serializeConsultant(record);
}

export async function deleteConsultantById(id: string) {
  assertFound(await getConsultantById(id), 'Consultant not found');
  const record = await softDeleteConsultant(id);
  return serializeConsultant(record);
}

export async function replaceConsultantSkillsFromInput(
  id: string,
  input: ConsultantSkillsInput
) {
  assertFound(await getConsultantById(id), 'Consultant not found');
  const record = await replaceConsultantSkills(id, input.skills);
  return record ? serializeConsultant(record) : null;
}

export async function replaceConsultantGoalsFromInput(
  id: string,
  input: ConsultantGoalsInput
) {
  assertFound(await getConsultantById(id), 'Consultant not found');
  const record = await replaceConsultantGoals(id, input.goals);
  return record ? serializeConsultant(record) : null;
}
