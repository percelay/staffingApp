export const SIGNAL_TYPE_VALUES = [
  'overwork',
  'weekend_work',
  'no_break',
  'high_travel',
] as const;

export const SEVERITY_VALUES = ['low', 'medium', 'high'] as const;

export type SignalType = (typeof SIGNAL_TYPE_VALUES)[number];
export type Severity = (typeof SEVERITY_VALUES)[number];

export interface WellbeingSignal {
  id: string;
  consultant_id: string;
  signal_type: SignalType;
  severity: Severity;
  recorded_at: string;
}
