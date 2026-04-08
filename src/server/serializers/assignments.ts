import type { Assignment } from '@/lib/contracts/assignment';
import { formatDate } from './utils';

type AssignmentRecord = {
  id: string;
  consultantId: string;
  engagementId: string;
  role: string;
  startDate: Date;
  endDate: Date;
  allocationPercentage: number;
  notes?: string | null;
};

export function serializeAssignment(record: AssignmentRecord): Assignment {
  return {
    id: record.id,
    consultant_id: record.consultantId,
    engagement_id: record.engagementId,
    role: record.role as Assignment['role'],
    start_date: formatDate(record.startDate),
    end_date: formatDate(record.endDate),
    allocation_percentage: record.allocationPercentage,
  };
}
