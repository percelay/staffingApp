'use client';

import { use } from 'react';
import { OpportunityDetail } from '@/components/opportunities/opportunity-detail';

export default function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <OpportunityDetail opportunityId={id} />;
}
