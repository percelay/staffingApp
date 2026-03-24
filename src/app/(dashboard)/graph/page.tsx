'use client';

import dynamic from 'next/dynamic';

const ForceGraphView = dynamic(
  () => import('@/components/graph/force-graph-view'),
  { ssr: false }
);

export default function GraphPage() {
  return <ForceGraphView />;
}
