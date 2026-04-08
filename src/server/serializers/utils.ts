export function formatDate(value: Date): string {
  return value.toISOString().split('T')[0];
}
