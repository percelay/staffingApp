import { generateDemoSeedData } from '@/server/demo/seed-data';

export function generateOpportunitySeedData() {
  const seed = generateDemoSeedData();
  return {
    opportunities: seed.opportunities,
    scenarios: seed.scenarios,
  };
}
