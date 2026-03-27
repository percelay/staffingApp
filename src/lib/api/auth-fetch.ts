/**
 * Authenticated Fetch
 *
 * Wraps the native fetch API to automatically inject auth headers
 * (X-User-Id, X-User-Role) from the current Zustand auth store.
 *
 * Usage: import { authFetch } from '@/lib/api/auth-fetch';
 *        const res = await authFetch('/api/consultants');
 */

import { useAuthStore } from '../stores/auth-store';

export function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const user = useAuthStore.getState().currentUser;

  const headers = new Headers(init?.headers);

  if (user) {
    headers.set('X-User-Id', user.id);
    headers.set('X-User-Role', user.role);
  }

  return fetch(input, { ...init, headers });
}
