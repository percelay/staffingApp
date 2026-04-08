import type { Severity, SignalType } from '@/lib/contracts/wellbeing';
import { prisma } from './shared';

export async function listWellbeingSignals(filters?: {
  consultantId?: string | null;
}) {
  return prisma.wellbeingSignal.findMany({
    where: filters?.consultantId
      ? { consultantId: filters.consultantId }
      : undefined,
    orderBy: { recordedAt: 'desc' },
  });
}

export async function createWellbeingSignal(data: {
  consultantId: string;
  signalType: SignalType;
  severity: Severity;
  recordedAt: Date;
  notes: string | null;
}) {
  return prisma.wellbeingSignal.create({
    data,
  });
}
