export const SENIORITY_LEVEL_VALUES = [
  'analyst',
  'consultant',
  'manager',
  'senior_manager',
  'partner',
] as const;

export const PRACTICE_AREA_VALUES = [
  'strategy',
  'operations',
  'digital',
  'risk',
  'people',
] as const;

export const CONSULTANT_STATUS_VALUES = [
  'active',
  'on_leave',
  'departed',
] as const;

export type SeniorityLevel = (typeof SENIORITY_LEVEL_VALUES)[number];
export type PracticeArea = (typeof PRACTICE_AREA_VALUES)[number];
export type ConsultantStatus = (typeof CONSULTANT_STATUS_VALUES)[number];

export interface Consultant {
  id: string;
  name: string;
  role: string;
  practice_area: PracticeArea;
  seniority_level: SeniorityLevel;
  status: ConsultantStatus;
  skills: string[];
  goals: string[];
  avatar_url: string;
}
