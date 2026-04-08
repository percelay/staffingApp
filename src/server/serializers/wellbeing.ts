import type { WellbeingSignal } from '@/lib/contracts/wellbeing';
import { formatDate } from './utils';

type WellbeingSignalRecord = {
  id: string;
  consultantId: string;
  signalType: string;
  severity: string;
  notes?: string | null;
  recordedAt: Date;
};

export function serializeWellbeingSignal(
  record: WellbeingSignalRecord
): WellbeingSignal {
  return {
    id: record.id,
    consultant_id: record.consultantId,
    signal_type: record.signalType as WellbeingSignal['signal_type'],
    severity: record.severity as WellbeingSignal['severity'],
    recorded_at: formatDate(record.recordedAt),
  };
}
