export type ResourceStatus = 'idle' | 'loading' | 'ready' | 'error';

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Request failed';
}
