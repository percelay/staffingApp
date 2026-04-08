import { buildExecutiveSummary } from '@/lib/selectors/executive';
import {
  getAssignments,
  getConsultants,
  getEngagements,
  getWellbeingSignals,
} from '@/server/services/staffing-service';

export async function getExecutiveSummary() {
  const [consultants, engagements, assignments, signals] = await Promise.all([
    getConsultants(),
    getEngagements(),
    getAssignments(),
    getWellbeingSignals(),
  ]);

  return buildExecutiveSummary({
    consultants,
    engagements,
    assignments,
    signals,
  });
}
