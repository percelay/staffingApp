import {
  normalizePipelineStage,
  type Opportunity,
} from '@/lib/contracts/opportunity';
import { formatDate } from './utils';

type OpportunityRecord = {
  id: string;
  clientName: string;
  projectName: string;
  startDate: Date;
  endDate: Date;
  stage: string;
  probability: number;
  estimatedValue: { toString(): string } | null;
  color: string;
  isBet: boolean;
  notes: string | null;
  convertedEngagementId: string | null;
  requiredSkills: Array<{
    skill: { id: string; name: string };
  }>;
};

export function serializeOpportunity(record: OpportunityRecord): Opportunity {
  return {
    id: record.id,
    client_name: record.clientName,
    project_name: record.projectName,
    start_date: formatDate(record.startDate),
    end_date: formatDate(record.endDate),
    stage: normalizePipelineStage(record.stage),
    probability: record.probability,
    estimated_value: record.estimatedValue
      ? Number(record.estimatedValue.toString())
      : null,
    required_skills: record.requiredSkills.map((item) => item.skill.name),
    color: record.color,
    is_bet: record.isBet,
    notes: record.notes,
    converted_engagement_id: record.convertedEngagementId,
  };
}
