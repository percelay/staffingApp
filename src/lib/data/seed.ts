import { generateDemoSeedData } from '@/server/demo/seed-data';

export function generateSeedData() {
  const seed = generateDemoSeedData();
  return {
    consultants: seed.consultants,
    engagements: seed.engagements,
    assignments: seed.assignments,
    wellbeingSignals: seed.wellbeingSignals,
  };
}
