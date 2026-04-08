export const ENGAGEMENT_STATUS_VALUES = [
  'active',
  'at_risk',
  'upcoming',
  'completed',
] as const;

export type EngagementStatus = (typeof ENGAGEMENT_STATUS_VALUES)[number];

export interface Engagement {
  id: string;
  client_name: string;
  project_name: string;
  start_date: string;
  end_date: string;
  required_skills: string[];
  status: EngagementStatus;
  color: string;
  is_bet: boolean;
}

export function normalizeEngagementStatus(
  status: string | null | undefined
): EngagementStatus {
  switch (status) {
    case 'at_risk':
      return 'at_risk';
    case 'upcoming':
      return 'upcoming';
    case 'completed':
      return 'completed';
    default:
      return 'active';
  }
}
