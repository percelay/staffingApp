import type { Assignment } from '@/lib/contracts/assignment';
import { authFetchJson, jsonRequestInit, withQuery } from './shared';

export function fetchAssignments(params?: {
  consultantId?: string | null;
  engagementId?: string | null;
}) {
  return authFetchJson<Assignment[]>(
    withQuery('/api/assignments', {
      consultantId: params?.consultantId,
      engagementId: params?.engagementId,
    })
  );
}

export function createAssignment(data: Omit<Assignment, 'id'>) {
  return authFetchJson<Assignment>(
    '/api/assignments',
    jsonRequestInit('POST', data)
  );
}

export function updateAssignment(id: string, data: Partial<Assignment>) {
  return authFetchJson<Assignment>(
    `/api/assignments/${id}`,
    jsonRequestInit('PATCH', data)
  );
}

export function deleteAssignment(id: string) {
  return authFetchJson<{ success: boolean }>(
    `/api/assignments/${id}`,
    jsonRequestInit('DELETE')
  );
}
