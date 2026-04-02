import { Suspense } from 'react';
import { PotentialStaffingWorkspace } from '@/components/opportunities/potential-staffing-workspace';

export default async function PotentialStaffingPage({
  searchParams,
}: {
  searchParams: Promise<{ opportunityId?: string }>;
}) {
  const { opportunityId } = await searchParams;

  return (
    <Suspense fallback={<div className="flex-1 bg-slate-50/30" />}>
      <PotentialStaffingWorkspace initialOpportunityId={opportunityId ?? null} />
    </Suspense>
  );
}
