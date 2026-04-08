export {
  CONSULTANT_STATUS_VALUES,
  PRACTICE_AREA_VALUES,
  SENIORITY_LEVEL_VALUES,
  type Consultant,
  type ConsultantStatus,
  type PracticeArea,
  type SeniorityLevel,
} from '@/lib/contracts/consultant';

import type {
  PracticeArea,
  SeniorityLevel,
} from '@/lib/contracts/consultant';

export const SENIORITY_ORDER: Record<SeniorityLevel, number> = {
  partner: 5,
  senior_manager: 4,
  manager: 3,
  consultant: 2,
  analyst: 1,
};

export const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  partner: 'Partner',
  senior_manager: 'Senior Manager',
  manager: 'Manager',
  consultant: 'Consultant',
  analyst: 'Analyst',
};

export const PRACTICE_AREA_LABELS: Record<PracticeArea, string> = {
  strategy: 'Strategy',
  operations: 'Operations',
  digital: 'Digital',
  risk: 'Risk & Compliance',
  people: 'People & Organization',
};
