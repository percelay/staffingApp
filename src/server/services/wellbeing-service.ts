import type { WellbeingSignalCreateInput } from '@/server/schemas/wellbeing';
import {
  createWellbeingSignal,
  listWellbeingSignals,
} from '@/server/repositories/wellbeing-repository';
import { serializeWellbeingSignal } from '@/server/serializers/wellbeing';

export async function getWellbeingSignals(filters?: {
  consultantId?: string | null;
}) {
  const records = await listWellbeingSignals(filters);
  return records.map(serializeWellbeingSignal);
}

export async function createWellbeingSignalFromInput(
  input: WellbeingSignalCreateInput
) {
  const record = await createWellbeingSignal({
    consultantId: input.consultant_id,
    signalType: input.signal_type,
    severity: input.severity,
    recordedAt: input.recorded_at ? new Date(input.recorded_at) : new Date(),
    notes: input.notes ?? null,
  });

  return serializeWellbeingSignal(record);
}
