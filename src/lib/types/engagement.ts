export type EngagementStatus = 'active' | 'upcoming' | 'completed';

export const ENGAGEMENT_STATUS_LABELS: Record<EngagementStatus, string> = {
  active: 'Active',
  upcoming: 'Upcoming',
  completed: 'Completed',
};

export const ENGAGEMENT_STATUS_DOT_CLASSES: Record<EngagementStatus, string> = {
  active: 'bg-green-500',
  upcoming: 'bg-blue-500',
  completed: 'bg-gray-400',
};

export const ENGAGEMENT_STATUS_BADGE_CLASSES: Record<EngagementStatus, string> = {
  active: 'bg-green-100 text-green-800',
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
}
