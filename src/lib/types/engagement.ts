export type EngagementStatus = 'active' | 'upcoming' | 'completed' | 'at_risk';

export interface Engagement {
  id: string;
  client_name: string;
  project_name: string;
  start_date: string;
  end_date: string;
  required_skills: string[];
  status: EngagementStatus;
  color: string;
}
