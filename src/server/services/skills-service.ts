import { listSkills } from '@/server/repositories/skills-repository';

export async function getSkills() {
  const records = await listSkills();
  return records.map((record) => record.name);
}
