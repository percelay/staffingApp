import { authFetchJson } from '@/lib/api/json-fetch';

export function jsonRequestInit(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown
): RequestInit {
  return {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
}

export function withQuery(
  pathname: string,
  params: Record<string, string | null | undefined>
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export { authFetchJson };
