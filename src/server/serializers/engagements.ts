import {
  normalizeEngagementStatus,
  type Engagement,
} from '@/lib/contracts/engagement';
import { formatDate } from './utils';

type EngagementRecord = {
  id: string;
  clientName: string;
  projectName: string;
  startDate: Date;
  endDate: Date;
  status: string;
  color: string;
  isBet: boolean;
  requiredSkills: Array<{
    skill: { id: string; name: string };
  }>;
};

export function serializeEngagement(record: EngagementRecord): Engagement {
  return {
    id: record.id,
    client_name: record.clientName,
    project_name: record.projectName,
    start_date: formatDate(record.startDate),
    end_date: formatDate(record.endDate),
    required_skills: record.requiredSkills.map((item) => item.skill.name),
    status: normalizeEngagementStatus(record.status),
    color: record.color,
    is_bet: record.isBet,
  };
}
