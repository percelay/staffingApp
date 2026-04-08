import type { Assignment } from './assignment';
import type { Consultant } from './consultant';
import type { Engagement } from './engagement';
import type { Opportunity, Scenario } from './opportunity';
import type { WellbeingSignal } from './wellbeing';

export type BootstrapSource = 'database' | 'demo';

export interface BootstrapPayload {
  source: BootstrapSource;
  consultants: Consultant[];
  engagements: Engagement[];
  assignments: Assignment[];
  signals: WellbeingSignal[];
  opportunities: Opportunity[];
  scenarios: Scenario[];
}
