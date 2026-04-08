import { describe, expect, it } from 'vitest';
import { generateOpportunitySeedData } from '@/lib/data/opportunity-seed';
import { generateSeedData } from '@/lib/data/seed';
import { generateDemoSeedData } from '@/server/demo/seed-data';

describe('demo seed data', () => {
  it('is deterministic across repeated invocations', () => {
    const first = generateDemoSeedData();
    const second = generateDemoSeedData();

    expect(second).toEqual(first);
  });

  it('keeps legacy demo wrappers aligned with the canonical seed builder', () => {
    const seed = generateDemoSeedData();

    expect(generateSeedData()).toEqual({
      consultants: seed.consultants,
      engagements: seed.engagements,
      assignments: seed.assignments,
      wellbeingSignals: seed.wellbeingSignals,
    });
    expect(generateOpportunitySeedData()).toEqual({
      opportunities: seed.opportunities,
      scenarios: seed.scenarios,
    });
    expect(
      seed.scenarios.every((scenario) =>
        seed.opportunities.some(
          (opportunity) => opportunity.id === scenario.opportunity_id
        )
      )
    ).toBe(true);
  });
});
