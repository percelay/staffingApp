import type { Consultant } from '@/lib/contracts/consultant';
import { authFetchJson, jsonRequestInit, withQuery } from './shared';

export function fetchConsultants(params?: {
  status?: string | null;
  practiceArea?: string | null;
}) {
  return authFetchJson<Consultant[]>(
    withQuery('/api/consultants', {
      status: params?.status,
      practiceArea: params?.practiceArea,
    })
  );
}

export function createConsultant(data: Omit<Consultant, 'id'>) {
  return authFetchJson<Consultant>(
    '/api/consultants',
    jsonRequestInit('POST', data)
  );
}

export function updateConsultant(id: string, data: Partial<Consultant>) {
  return authFetchJson<Consultant>(
    `/api/consultants/${id}`,
    jsonRequestInit('PATCH', data)
  );
}

export function deleteConsultant(id: string) {
  return authFetchJson<Consultant>(
    `/api/consultants/${id}`,
    jsonRequestInit('DELETE')
  );
}

export function replaceConsultantSkills(id: string, skills: string[]) {
  return authFetchJson<Consultant>(
    `/api/consultants/${id}/skills`,
    jsonRequestInit('PUT', { skills })
  );
}

export function replaceConsultantGoals(id: string, goals: string[]) {
  return authFetchJson<Consultant>(
    `/api/consultants/${id}/goals`,
    jsonRequestInit('PUT', { goals })
  );
}
