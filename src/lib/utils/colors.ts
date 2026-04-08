import type { SeniorityLevel } from '../types';
import { ENGAGEMENT_COLOR_PALETTE } from '../constants/staffing';

// 8 distinct, accessible client engagement colors
export const CLIENT_COLORS = ENGAGEMENT_COLOR_PALETTE;

// Deterministic color assignment by client name
export function getClientColor(clientName: string): string {
  let hash = 0;
  for (let i = 0; i < clientName.length; i++) {
    hash = clientName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CLIENT_COLORS[Math.abs(hash) % CLIENT_COLORS.length];
}

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

export function getSenioritySize(level: SeniorityLevel): number {
  const sizes: Record<SeniorityLevel, number> = {
    analyst: 8,
    consultant: 12,
    manager: 16,
    senior_manager: 20,
    partner: 26,
  };
  return sizes[level];
}
