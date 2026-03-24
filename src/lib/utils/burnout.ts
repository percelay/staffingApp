import { parseISO, differenceInWeeks } from 'date-fns';
import type { Assignment, WellbeingSignal } from '../types';

export function calculateBurnoutRisk(
  consultantId: string,
  assignments: Assignment[],
  signals: WellbeingSignal[]
): number {
  const myAssignments = assignments.filter(
    (a) => a.consultant_id === consultantId
  );
  const mySignals = signals.filter((s) => s.consultant_id === consultantId);

  let score = 0;

  // Factor 1: Over-allocation (max 35 points)
  const now = new Date();
  const currentAllocations = myAssignments.filter((a) => {
    const start = parseISO(a.start_date);
    const end = parseISO(a.end_date);
    return start <= now && end >= now;
  });
  const totalAllocation = currentAllocations.reduce(
    (sum, a) => sum + a.allocation_percentage,
    0
  );
  if (totalAllocation > 100) {
    score += Math.min(35, (totalAllocation - 100) * 0.7);
  } else if (totalAllocation > 80) {
    score += (totalAllocation - 80) * 0.5;
  }

  // Factor 2: Consecutive weeks without a break (max 25 points)
  const sortedAssignments = [...myAssignments].sort(
    (a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime()
  );
  let maxConsecutive = 0;
  let currentStreak = 0;
  for (let i = 0; i < sortedAssignments.length; i++) {
    if (i === 0) {
      currentStreak = differenceInWeeks(
        parseISO(sortedAssignments[i].end_date),
        parseISO(sortedAssignments[i].start_date)
      );
    } else {
      const gapWeeks = differenceInWeeks(
        parseISO(sortedAssignments[i].start_date),
        parseISO(sortedAssignments[i - 1].end_date)
      );
      if (gapWeeks <= 1) {
        currentStreak += differenceInWeeks(
          parseISO(sortedAssignments[i].end_date),
          parseISO(sortedAssignments[i].start_date)
        );
      } else {
        maxConsecutive = Math.max(maxConsecutive, currentStreak);
        currentStreak = differenceInWeeks(
          parseISO(sortedAssignments[i].end_date),
          parseISO(sortedAssignments[i].start_date)
        );
      }
    }
  }
  maxConsecutive = Math.max(maxConsecutive, currentStreak);
  if (maxConsecutive > 8) {
    score += Math.min(25, (maxConsecutive - 8) * 5);
  }

  // Factor 3: Number of concurrent engagements (max 20 points)
  const concurrentCount = currentAllocations.length;
  if (concurrentCount > 2) {
    score += Math.min(20, (concurrentCount - 2) * 10);
  }

  // Factor 4: Wellbeing signals (max 20 points)
  for (const signal of mySignals) {
    if (signal.severity === 'high') score += 10;
    else if (signal.severity === 'medium') score += 5;
    else score += 2;
  }

  return Math.min(100, Math.round(score));
}
