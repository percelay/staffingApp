'use client';

import { SwimLaneChart } from '@/components/timeline/swimlane-chart';
import { EngagementDrawer } from '@/components/timeline/engagement-drawer';
import { StatsBar } from '@/components/timeline/stats-bar';

export default function TimelinePage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <StatsBar />
      <SwimLaneChart />
      <EngagementDrawer />
    </div>
  );
}
