export type AssignmentRole = 'lead' | 'manager' | 'consultant' | 'analyst';

export interface Assignment {
  id: string;
  consultant_id: string;
  engagement_id: string;
  role: AssignmentRole;
  start_date: string;
  end_date: string;
  allocation_percentage: number;
}
