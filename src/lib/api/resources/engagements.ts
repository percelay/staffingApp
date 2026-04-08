import type { Engagement } from '@/lib/contracts/engagement';
import { authFetchJson, jsonRequestInit, withQuery } from './shared';

export function fetchEngagements(params?: { status?: string | null }) {
  return authFetchJson<Engagement[]>(
    withQuery('/api/engagements', {
      status: params?.status,
    })
  );
}

export function createEngagement(data: Omit<Engagement, 'id'>) {
  return authFetchJson<Engagement>(
    '/api/engagements',
    jsonRequestInit('POST', data)
  );
}

export function updateEngagement(id: string, data: Partial<Engagement>) {
  return authFetchJson<Engagement>(
    `/api/engagements/${id}`,
    jsonRequestInit('PATCH', data)
  );
}

export function deleteEngagement(id: string) {
  return authFetchJson<{ success: boolean }>(
    `/api/engagements/${id}`,
    jsonRequestInit('DELETE')
  );
}
