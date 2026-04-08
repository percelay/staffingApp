import type { BootstrapPayload } from '@/lib/contracts/bootstrap';
import { authFetchJson } from './shared';

export function fetchBootstrapPayload() {
  return authFetchJson<BootstrapPayload>('/api/bootstrap');
}
