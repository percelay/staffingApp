'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ForceGraph2D from 'react-force-graph-2d';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useConsultantStore } from '@/lib/stores/consultant-store';
import { useEngagementStore } from '@/lib/stores/engagement-store';
import { useAssignmentStore } from '@/lib/stores/assignment-store';
import { useWellbeingStore } from '@/lib/stores/wellbeing-store';
import { formatAllocationAsManDays } from '@/lib/utils/allocation';
import { calculateBurnoutRisk } from '@/lib/utils/burnout';
import { getStatusColor, getSenioritySize } from '@/lib/utils/colors';
import { SENIORITY_LABELS } from '@/lib/types/consultant';
import { ENGAGEMENT_STATUS_LABELS } from '@/lib/types/engagement';

interface GraphNode {
  id: string;
  name: string;
  type: 'engagement' | 'consultant';
  color: string;
  size: number;
  burnoutRisk: number;
  val?: number;
  // Force graph internal
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
  allocation: number;
}

type FocusMode =
  | { type: 'engagement'; id: string }
  | { type: 'consultant'; id: string };

export default function ForceGraphView() {
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const engagementParam = searchParams.get('engagement');
  const consultantParam = searchParams.get('consultant');

  const initialFocus: FocusMode = consultantParam
    ? { type: 'consultant', id: consultantParam }
    : engagementParam
      ? { type: 'engagement', id: engagementParam }
      : { type: 'engagement', id: '' };

  const [focus, setFocus] = useState<FocusMode>(initialFocus);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const consultants = useConsultantStore((s) => s.consultants);
  const engagements = useEngagementStore((s) => s.engagements);
  const assignments = useAssignmentStore((s) => s.assignments);
  const signals = useWellbeingStore((s) => s.signals);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    if (focus.type === 'engagement' && focus.id) {
      // Engagement-centered: show engagement + its consultants
      const engagement = engagements.find((e) => e.id === focus.id);
      if (!engagement) return { nodes, links };

      nodes.push({
        id: engagement.id,
        name: engagement.client_name,
        type: 'engagement',
        color: engagement.color,
        size: 30,
        burnoutRisk: 0,
        val: 30,
      });

      const engAssignments = assignments.filter(
        (a) => a.engagement_id === engagement.id
      );
      for (const a of engAssignments) {
        const c = consultants.find((con) => con.id === a.consultant_id);
        if (!c) continue;
        const burnout = calculateBurnoutRisk(c.id, assignments, signals);
        const size = getSenioritySize(c.seniority_level);

        if (!nodes.find((n) => n.id === c.id)) {
          nodes.push({
            id: c.id,
            name: c.name,
            type: 'consultant',
            color: getStatusColor(burnout),
            size,
            burnoutRisk: burnout,
            val: size,
          });
        }

        links.push({
          source: engagement.id,
          target: c.id,
          allocation: a.allocation_percentage,
        });
      }
    } else if (focus.type === 'consultant' && focus.id) {
      // Consultant-centered: show consultant + all their engagements
      const consultant = consultants.find((c) => c.id === focus.id);
      if (!consultant) return { nodes, links };

      const burnout = calculateBurnoutRisk(
        consultant.id,
        assignments,
        signals
      );

      nodes.push({
        id: consultant.id,
        name: consultant.name,
        type: 'consultant',
        color: getStatusColor(burnout),
        size: 30,
        burnoutRisk: burnout,
        val: 30,
      });

      const conAssignments = assignments.filter(
        (a) => a.consultant_id === consultant.id
      );
      for (const a of conAssignments) {
        const e = engagements.find((eng) => eng.id === a.engagement_id);
        if (!e) continue;

        if (!nodes.find((n) => n.id === e.id)) {
          nodes.push({
            id: e.id,
            name: e.client_name,
            type: 'engagement',
            color: e.color,
            size: 20,
            burnoutRisk: 0,
            val: 20,
          });
        }

        links.push({
          source: consultant.id,
          target: e.id,
          allocation: a.allocation_percentage,
        });

        // Add other consultants on same engagement
        const otherAssignments = assignments.filter(
          (oa) =>
            oa.engagement_id === e.id &&
            oa.consultant_id !== consultant.id
        );
        for (const oa of otherAssignments) {
          const otherC = consultants.find((c) => c.id === oa.consultant_id);
          if (!otherC) continue;
          const otherBurnout = calculateBurnoutRisk(
            otherC.id,
            assignments,
            signals
          );
          const size = getSenioritySize(otherC.seniority_level);

          if (!nodes.find((n) => n.id === otherC.id)) {
            nodes.push({
              id: otherC.id,
              name: otherC.name,
              type: 'consultant',
              color: getStatusColor(otherBurnout),
              size: size * 0.7,
              burnoutRisk: otherBurnout,
              val: size * 0.7,
            });
          }

          if (
            !links.find(
              (l) =>
                (l.source === e.id && l.target === otherC.id) ||
                (l.source === otherC.id && l.target === e.id)
            )
          ) {
            links.push({
              source: e.id,
              target: otherC.id,
              allocation: oa.allocation_percentage,
            });
          }
        }
      }
    } else {
      // No focus: show all engagements as a network
      for (const e of engagements) {
        nodes.push({
          id: e.id,
          name: e.client_name,
          type: 'engagement',
          color: e.color,
          size: 20,
          burnoutRisk: 0,
          val: 20,
        });
      }
      for (const c of consultants) {
        const burnout = calculateBurnoutRisk(c.id, assignments, signals);
        const size = getSenioritySize(c.seniority_level);
        const hasAssignment = assignments.some(
          (a) => a.consultant_id === c.id
        );
        if (!hasAssignment) continue;
        nodes.push({
          id: c.id,
          name: c.name,
          type: 'consultant',
          color: getStatusColor(burnout),
          size,
          burnoutRisk: burnout,
          val: size,
        });
      }
      for (const a of assignments) {
        links.push({
          source: a.engagement_id,
          target: a.consultant_id,
          allocation: a.allocation_percentage,
        });
      }
    }

    return { nodes, links };
  }, [focus, consultants, engagements, assignments, signals]);

  const nodeCanvasObject = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const x = node.x || 0;
      const y = node.y || 0;
      const size = node.size / globalScale;
      const fontSize = Math.max(10 / globalScale, 3);

      if (node.type === 'engagement') {
        // Rounded rectangle
        const w = Math.max(size * 3, 40 / globalScale);
        const h = size * 1.5;
        const r = 4 / globalScale;

        ctx.beginPath();
        ctx.roundRect(x - w / 2, y - h / 2, w, h, r);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1 / globalScale;
        ctx.stroke();

        // Label
        ctx.fillStyle = 'white';
        ctx.font = `600 ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const maxWidth = w - 8 / globalScale;
        const text = node.name;
        ctx.fillText(
          text.length * fontSize * 0.6 > maxWidth
            ? text.slice(0, Math.floor(maxWidth / (fontSize * 0.6))) + '…'
            : text,
          x,
          y
        );
      } else {
        // Consultant circle
        const radius = size;

        // Burnout pulse ring
        if (node.burnoutRisk >= 60) {
          const pulseRadius = radius * 1.4;
          const pulseOpacity =
            0.15 + Math.sin(Date.now() / 500) * 0.1;
          ctx.beginPath();
          ctx.arc(x, y, pulseRadius, 0, 2 * Math.PI);
          ctx.fillStyle = `rgba(239, 68, 68, ${pulseOpacity})`;
          ctx.fill();
        }

        // Main circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 3 / globalScale;
        ctx.stroke();

        // Name label below
        ctx.fillStyle = '#334155';
        ctx.font = `500 ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(node.name, x, y + radius + 3 / globalScale);
      }
    },
    []
  );

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      setSelectedNode(node);
      if (node.type === 'engagement') {
        setFocus({ type: 'engagement', id: node.id });
      } else {
        setFocus({ type: 'consultant', id: node.id });
      }
    },
    []
  );

  const handleResetView = () => {
    setFocus({ type: 'engagement', id: '' });
    setSelectedNode(null);
  };

  // Detail panel for selected node
  const detailContent = useMemo(() => {
    if (!selectedNode) return null;

    if (selectedNode.type === 'engagement') {
      const e = engagements.find((eng) => eng.id === selectedNode.id);
      if (!e) return null;
      const team = assignments
        .filter((a) => a.engagement_id === e.id)
        .map((a) => ({
          ...a,
          consultant: consultants.find((c) => c.id === a.consultant_id),
        }));

      return (
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Project
            </p>
            <p className="text-sm mt-1">{e.project_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Status
            </p>
            <Badge variant="secondary" className="mt-1 capitalize">
              {ENGAGEMENT_STATUS_LABELS[e.status]}
            </Badge>
          </div>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">
              Team ({team.length})
            </p>
            {team.map((t) =>
              t.consultant ? (
                <div
                  key={t.id}
                  className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-slate-50 rounded px-1 -mx-1"
                  onClick={() =>
                    handleNodeClick({
                      id: t.consultant!.id,
                      name: t.consultant!.name,
                      type: 'consultant',
                      color: '',
                      size: 0,
                      burnoutRisk: 0,
                    })
                  }
                >
                  <img
                    src={t.consultant.avatar_url}
                    alt={t.consultant.name}
                    className="h-6 w-6 rounded-full bg-slate-100"
                  />
                  <div className="min-w-0">
                    <p className="text-sm truncate">{t.consultant.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {t.role} ·{' '}
                      {formatAllocationAsManDays(
                        t.allocation_percentage,
                        'compact'
                      )}
                    </p>
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>
      );
    } else {
      const c = consultants.find((con) => con.id === selectedNode.id);
      if (!c) return null;
      const burnout = calculateBurnoutRisk(c.id, assignments, signals);
      const myEngagements = assignments
        .filter((a) => a.consultant_id === c.id)
        .map((a) => ({
          ...a,
          engagement: engagements.find((e) => e.id === a.engagement_id),
        }));

      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={c.avatar_url}
              alt={c.name}
              className="h-10 w-10 rounded-full bg-slate-100"
            />
            <div>
              <p className="text-sm font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                {SENIORITY_LABELS[c.seniority_level]}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs capitalize">
              {c.practice_area}
            </Badge>
            {burnout >= 60 && (
              <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                Burnout Risk: {burnout}%
              </Badge>
            )}
          </div>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">
              Engagements ({myEngagements.length})
            </p>
            {myEngagements.map((me) =>
              me.engagement ? (
                <div
                  key={me.id}
                  className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-slate-50 rounded px-1 -mx-1"
                  onClick={() =>
                    handleNodeClick({
                      id: me.engagement!.id,
                      name: me.engagement!.client_name,
                      type: 'engagement',
                      color: me.engagement!.color,
                      size: 0,
                      burnoutRisk: 0,
                    })
                  }
                >
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: me.engagement.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm truncate">
                      {me.engagement.client_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {me.role} ·{' '}
                      {formatAllocationAsManDays(
                        me.allocation_percentage,
                        'compact'
                      )}
                    </p>
                  </div>
                </div>
              ) : null
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">
              Skills
            </p>
            <div className="flex flex-wrap gap-1">
              {c.skills.map((s) => (
                <Badge key={s} variant="outline" className="text-[10px]">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      );
    }
  }, [selectedNode, consultants, engagements, assignments, signals, handleNodeClick]);

  return (
    <div className="flex-1 flex overflow-hidden" ref={containerRef}>
      {/* Graph canvas */}
      <div className="flex-1 relative bg-slate-50/30">
        <ForceGraph2D
          graphData={graphData}
          width={
            dimensions.width - (selectedNode ? 320 : 0)
          }
          height={dimensions.height}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          nodeCanvasObject={nodeCanvasObject as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
            const size = (node as GraphNode).size;
            ctx.fillStyle = color;
            if ((node as GraphNode).type === 'engagement') {
              const w = Math.max(size * 3, 40);
              const h = size * 1.5;
              ctx.fillRect(
                (node.x || 0) - w / 2,
                (node.y || 0) - h / 2,
                w,
                h
              );
            } else {
              ctx.beginPath();
              ctx.arc(node.x || 0, node.y || 0, size, 0, 2 * Math.PI);
              ctx.fill();
            }
          }}
          linkColor={() => 'rgba(148, 163, 184, 0.4)'}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          linkWidth={(link: any) =>
            Math.max(1, ((link as GraphLink).allocation / 100) * 3)
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onNodeClick={handleNodeClick as any}
          cooldownTicks={100}
          d3AlphaDecay={0.05}
          d3VelocityDecay={0.3}
          enableNodeDrag={true}
        />

        {/* Controls overlay */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm"
            onClick={handleResetView}
          >
            Show All
          </Button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg border p-3 text-xs space-y-2">
          <p className="font-semibold text-muted-foreground">Legend</p>
          <div className="flex items-center gap-2">
            <div className="h-3 w-5 rounded bg-slate-400" />
            <span>Engagement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full border-2 border-green-500" />
            <span>Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full border-2 border-amber-500" />
            <span>Watch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full border-2 border-red-500" />
            <span>At Risk</span>
          </div>
          <Separator />
          <p className="text-muted-foreground">Node size = seniority</p>
          <p className="text-muted-foreground">Line width = allocation</p>
        </div>
      </div>

      {/* Detail panel */}
      {selectedNode && (
        <div className="w-80 border-l bg-white overflow-y-auto">
          <Card className="border-0 rounded-none shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base tracking-tight">
                  {selectedNode.name}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground"
                  onClick={() => setSelectedNode(null)}
                >
                  ×
                </Button>
              </div>
              <Badge variant="secondary" className="w-fit text-xs capitalize">
                {selectedNode.type}
              </Badge>
            </CardHeader>
            <CardContent>{detailContent}</CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
