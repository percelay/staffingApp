export const ASSIGNMENT_ROLE_VALUES = [
  'lead',
  'manager',
  'consultant',
  'analyst',
] as const;

export type AssignmentRole = (typeof ASSIGNMENT_ROLE_VALUES)[number];

export interface Assignment {
  id: string;
  consultant_id: string;
  engagement_id: string;
  role: AssignmentRole;
  start_date: string;
  end_date: string;
  allocation_percentage: number;
}
