'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PotentialStaffingWorkspace } from '@/components/opportunities/potential-staffing-workspace';

function PotentialStaffingPageContent() {
  const searchParams = useSearchParams();

  return (
    <PotentialStaffingWorkspace
      initialOpportunityId={searchParams.get('opportunityId')}
    />
  );
}

export default function PotentialStaffingPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-slate-50/30" />}>
      <PotentialStaffingPageContent />
    </Suspense>
  );
}
