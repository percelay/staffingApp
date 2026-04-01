import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import {
  PIPELINE_STAGE_BADGE_CLASSES,
  PIPELINE_STAGE_LABELS,
} from '@/lib/types/opportunity';

export const dynamic = 'force-dynamic';

function formatDateOnly(date: Date) {
  return date.toISOString().split('T')[0];
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return '--';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      requiredSkills: {
        include: {
          skill: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      scenarios: {
        orderBy: { createdAt: 'asc' },
        include: {
          tentativeAssignments: {
            orderBy: { startDate: 'asc' },
            include: {
              consultant: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!opportunity) {
    notFound();
  }

  const requiredSkills = opportunity.requiredSkills.map((item) => item.skill.name);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Link
              href="/opportunities"
              className="inline-flex items-center text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              ← Back to pipeline
            </Link>
            <div className="flex items-start gap-3">
              <span
                className="mt-1 h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: opportunity.color }}
              />
              <div className="space-y-1">
                <p className="text-sm text-slate-500">{opportunity.clientName}</p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                  {opportunity.projectName}
                </h1>
                <p className="text-sm text-slate-600">
                  Opportunity Detail / Scenario Editor
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${PIPELINE_STAGE_BADGE_CLASSES[opportunity.stage]}`}
            >
              {PIPELINE_STAGE_LABELS[opportunity.stage]}
            </span>
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {opportunity.probability}% probability
            </span>
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {formatCurrency(
                opportunity.estimatedValue !== null
                  ? Number(opportunity.estimatedValue)
                  : null
              )}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">
                Opportunity Overview
              </h2>
              <span className="text-sm text-slate-500">
                {PIPELINE_STAGE_LABELS[opportunity.stage]}
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Start Date
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {formatDateOnly(opportunity.startDate)}
                </p>
              </div>
              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  End Date
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {formatDateOnly(opportunity.endDate)}
                </p>
              </div>
              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Required Skills
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {requiredSkills.length > 0 ? (
                    requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No required skills yet.</p>
                  )}
                </div>
              </div>
              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {opportunity.notes?.trim() || 'No notes added yet.'}
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Scenario Editor Status
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              This route now mounts from Prisma successfully. Interactive scenario
              editing can build on top of the data loaded below.
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Opportunity ID
                </p>
                <p className="mt-2 break-all text-sm font-medium text-slate-900">
                  {opportunity.id}
                </p>
              </div>
              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Scenario Count
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {opportunity.scenarios.length}
                </p>
              </div>
            </div>
          </aside>
        </div>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">
              Scenario Editor Scaffold
            </h2>
            <span className="text-sm text-slate-500">
              {opportunity.scenarios.length === 1
                ? '1 scenario loaded'
                : `${opportunity.scenarios.length} scenarios loaded`}
            </span>
          </div>

          {opportunity.scenarios.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed bg-slate-50 p-6 text-sm text-slate-600">
              No scenarios exist for this opportunity yet. The route is ready for
              scenario creation and editing without crashing.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {opportunity.scenarios.map((scenario) => (
                <article
                  key={scenario.id}
                  className="rounded-xl border bg-slate-50 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-950">
                        {scenario.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {scenario.isDefault ? 'Default scenario' : 'Alternate scenario'}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                      {scenario.tentativeAssignments.length} tentative
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Fit Score
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {scenario.fitScore ?? '--'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Burnout Impact
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {scenario.burnoutImpact ?? '--'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Tentative Team
                    </p>
                    {scenario.tentativeAssignments.length === 0 ? (
                      <p className="text-sm text-slate-600">
                        No tentative assignments yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {scenario.tentativeAssignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm text-slate-700"
                          >
                            <span>{assignment.consultant.name}</span>
                            <span className="text-xs uppercase tracking-wide text-slate-500">
                              {assignment.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
