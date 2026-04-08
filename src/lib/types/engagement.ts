export const ENGAGEMENT_STATUS_VALUES = [
  'active',
  'at_risk',
  'upcoming',
  'completed',
] as const;

export type EngagementStatus = (typeof ENGAGEMENT_STATUS_VALUES)[number];

export const ENGAGEMENT_STATUS_LABELS: Record<EngagementStatus, string> = {
  active: 'Active',
  at_risk: 'At Risk',
  upcoming: 'Upcoming',
  completed: 'Completed',
};

export const ENGAGEMENT_STATUS_DOT_CLASSES: Record<EngagementStatus, string> = {
  active: 'bg-green-500',
  at_risk: 'bg-red-500',
  upcoming: 'bg-blue-500',
  completed: 'bg-gray-400',
};

export const ENGAGEMENT_STATUS_BADGE_CLASSES: Record<EngagementStatus, string> = {
  active: 'bg-green-100 text-green-800',
  at_risk: 'bg-red-100 text-red-800',
  upcoming: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800',
};

export const ENGAGEMENT_STATUS_OPTIONS: ReadonlyArray<{
  value: EngagementStatus;
  label: string;
  dotClass: string;
}> = [
  {
    value: 'active',
    label: ENGAGEMENT_STATUS_LABELS.active,
    dotClass: ENGAGEMENT_STATUS_DOT_CLASSES.active,
  },
  {
    value: 'at_risk',
    label: ENGAGEMENT_STATUS_LABELS.at_risk,
    dotClass: ENGAGEMENT_STATUS_DOT_CLASSES.at_risk,
  },
  {
    value: 'upcoming',
    label: ENGAGEMENT_STATUS_LABELS.upcoming,
    dotClass: ENGAGEMENT_STATUS_DOT_CLASSES.upcoming,
  },
  {
    value: 'completed',
    label: ENGAGEMENT_STATUS_LABELS.completed,
    dotClass: ENGAGEMENT_STATUS_DOT_CLASSES.completed,
  },
];

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
