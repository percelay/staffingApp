export type SignalType = 'overwork' | 'weekend_work' | 'no_break' | 'high_travel';
export type Severity = 'low' | 'medium' | 'high';

export interface WellbeingSignal {
  id: string;
  consultant_id: string;
  signal_type: SignalType;
  severity: Severity;
  recorded_at: string;
}
