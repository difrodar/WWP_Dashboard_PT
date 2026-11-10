import type { FundraisingEvent, ISODate } from '../types/event';
import { getDaysSinceEvent, isAwaitingProcessing, isFlagged } from './eventRules';

export interface DashboardKpis {
  /** Active flagged $0 events. */
  flaggedCount: number;
  /** Active flagged events with High priority. */
  highPriorityCount: number;
  /** Active flagged events whose review status is Awaiting Bank or Check Processing. */
  awaitingProcessingCount: number;
  /** Mean days since event across active flagged events, rounded to one decimal; null when there are none. */
  averageDaysSinceEvent: number | null;
}

/**
 * KPIs are always computed over ACTIVE FLAGGED events only. Callers pass the
 * records that match the current filters, so KPIs move with the filters too.
 */
export function computeKpis(events: FundraisingEvent[], asOfDate: ISODate): DashboardKpis {
  const flagged = events.filter((e) => isFlagged(e, asOfDate));
  const days = flagged
    .map((e) => getDaysSinceEvent(e, asOfDate))
    .filter((d): d is number => d !== null);

  return {
    flaggedCount: flagged.length,
    highPriorityCount: flagged.filter((e) => e.priority === 'High').length,
    awaitingProcessingCount: flagged.filter((e) => isAwaitingProcessing(e, asOfDate)).length,
    averageDaysSinceEvent: days.length === 0 ? null : Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10,
  };
}
