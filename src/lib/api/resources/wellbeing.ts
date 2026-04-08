import type { WellbeingSignal } from '@/lib/contracts/wellbeing';
import { authFetchJson, jsonRequestInit, withQuery } from './shared';

export function fetchWellbeingSignals(params?: {
  consultantId?: string | null;
}) {
  return authFetchJson<WellbeingSignal[]>(
    withQuery('/api/wellbeing', {
      consultantId: params?.consultantId,
    })
  );
}

export function createWellbeingSignal(data: Omit<WellbeingSignal, 'id'>) {
  return authFetchJson<WellbeingSignal>(
    '/api/wellbeing',
    jsonRequestInit('POST', data)
  );
}
