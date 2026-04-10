export function getStatusColor(burnoutScore: number): string {
  if (burnoutScore >= 70) return '#DC2626'; // red
  if (burnoutScore >= 40) return '#D97706'; // amber
  return '#059669'; // green
}

export function getStatusLabel(burnoutScore: number): 'healthy' | 'watch' | 'at_risk' {
  if (burnoutScore >= 70) return 'at_risk';
  if (burnoutScore >= 40) return 'watch';
  return 'healthy';
}
