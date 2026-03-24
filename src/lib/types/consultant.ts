export type SeniorityLevel = 'analyst' | 'consultant' | 'manager' | 'senior_manager' | 'partner';
export type PracticeArea = 'strategy' | 'operations' | 'digital' | 'risk' | 'people';

export interface Consultant {
  id: string;
  name: string;
  role: string;
  practice_area: PracticeArea;
  seniority_level: SeniorityLevel;
  skills: string[];
  avatar_url: string;
}

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
