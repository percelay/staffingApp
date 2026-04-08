import type { Consultant } from '@/lib/contracts/consultant';

type ConsultantRecord = {
  id: string;
  name: string;
  role: string;
  practiceArea: string;
  seniorityLevel: string;
  avatarUrl: string;
  status: string;
  skills: Array<{
    skill: { id: string; name: string };
  }>;
  goals: Array<{
    skill: { id: string; name: string };
  }>;
};

export function serializeConsultant(record: ConsultantRecord): Consultant {
  return {
    id: record.id,
    name: record.name,
    role: record.role,
    practice_area: record.practiceArea as Consultant['practice_area'],
    seniority_level: record.seniorityLevel as Consultant['seniority_level'],
    status: record.status as Consultant['status'],
    skills: record.skills.map((item) => item.skill.name),
    goals: record.goals.map((item) => item.skill.name),
    avatar_url: record.avatarUrl,
  };
}
