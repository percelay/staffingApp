import { authFetch } from './auth-fetch';

export async function authFetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await authFetch(input, init);

  if (!response.ok) {
    const message = await getErrorMessage(response);
    throw new Error(message);
  }

  return (await response.json()) as T;
}

async function getErrorMessage(response: Response) {
  try {
    const payload = await response.json();
    if (payload && typeof payload.error === 'string') {
      return payload.error;
    }
  } catch {
    // Ignore invalid JSON responses and fall back to status text below.
  }

  return `Request failed with ${response.status} ${response.statusText}`;
}
