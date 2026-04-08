import type { Proposal } from '@/lib/contracts/proposal';
import { authFetchJson, jsonRequestInit } from './shared';

export function fetchProposals() {
  return authFetchJson<Proposal[]>('/api/proposals');
}

export function createProposal(data: Proposal) {
  return authFetchJson<Proposal>(
    '/api/proposals',
    jsonRequestInit('POST', data)
  );
}
