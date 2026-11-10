import type { FundraisingEvent, ISODate, Priority } from '../types/event';
import { AWAITING_PROCESSING_STATUS, RESOLVED_STATUS } from '../types/event';
import { daysBetween, isValidISODate } from './dateUtils';

/**
 * Core monitoring rules (Process 3.0 — Monitor Fundraising Activity).
 *
 * An event is FLAGGED when ALL of the following are true:
 *   1. it has a valid event date;
 *   2. days since the event date (relative to the as-of date) is strictly > 30;
 *   3. the posted amount raised is exactly $0;
 *   4. it is not resolved; and
 *   5. it is not closed.
 *
 * A flag means "Needs Review" — never "Missing Funds". Staff decide the outcome.
 */

export const MONITORING_THRESHOLD_DAYS = 30;

export function hasValidEventDate(event: Pick<FundraisingEvent, 'eventDate'>): boolean {
  return isValidISODate(event.eventDate);
}

export function isResolved(event: Pick<FundraisingEvent, 'reviewStatus'>): boolean {
  return event.reviewStatus === RESOLVED_STATUS;
}

/** Whole days between the event date and the as-of date; null when the event date is missing/invalid. */
export function getDaysSinceEvent(event: Pick<FundraisingEvent, 'eventDate'>, asOfDate: ISODate): number | null {
  return daysBetween(event.eventDate, asOfDate);
}

export function isFlagged(event: FundraisingEvent, asOfDate: ISODate): boolean {
  const days = getDaysSinceEvent(event, asOfDate);
  return (
    hasValidEventDate(event) &&
    days !== null &&
    days > MONITORING_THRESHOLD_DAYS &&
    event.amountRaised === 0 &&
    !isResolved(event) &&
    !event.isClosed
  );
}

/** Missing/invalid event date on an open, unresolved record → separate data-quality review. */
export function isDataQualityException(event: FundraisingEvent): boolean {
  return !hasValidEventDate(event) && !isResolved(event) && !event.isClosed;
}

/** Event remains in the active queue but is waiting on offline (bank/check) processing. */
export function isAwaitingProcessing(event: FundraisingEvent, asOfDate: ISODate): boolean {
  return isFlagged(event, asOfDate) && event.reviewStatus === AWAITING_PROCESSING_STATUS;
}

export type MonitoringResult =
  | 'flagged'
  | 'data-quality'
  | 'closed'
  | 'resolved'
  | 'donations-posted'
  | 'future-event'
  | 'within-window';

/**
 * Explains, for any record, why it is or is not in the active queue.
 * Order matters: administrative states first, then data quality, then the rule.
 */
export function getMonitoringResult(event: FundraisingEvent, asOfDate: ISODate): MonitoringResult {
  if (event.isClosed) return 'closed';
  if (isResolved(event)) return 'resolved';
  if (!hasValidEventDate(event)) return 'data-quality';
  if (event.amountRaised !== 0) return 'donations-posted';
  const days = getDaysSinceEvent(event, asOfDate);
  if (days === null) return 'data-quality';
  if (days < 0) return 'future-event';
  if (days <= MONITORING_THRESHOLD_DAYS) return 'within-window';
  return 'flagged';
}

export const MONITORING_RESULT_LABELS: Record<MonitoringResult, { label: string; detail: string }> = {
  flagged: { label: 'Flagged — Needs Review', detail: '$0 posted more than 30 days after the event.' },
  'data-quality': { label: 'Data-Quality Review', detail: 'Event date is missing or invalid, so the 30-day rule cannot be evaluated.' },
  closed: { label: 'Not Flagged — Closed', detail: 'Record is administratively closed.' },
  resolved: { label: 'Not Flagged — Resolved', detail: 'Staff marked the case resolved or funds attributed.' },
  'donations-posted': { label: 'Not Flagged — Donations Posted', detail: 'Posted amount is greater than $0.' },
  'future-event': { label: 'Not Flagged — Upcoming Event', detail: 'Event date is after the as-of date.' },
  'within-window': { label: 'Not Flagged — Within 30 Days', detail: '30 days or fewer since the event; donations may still be posting.' },
};

export const PRIORITY_RANK: Record<Priority, number> = { High: 3, Medium: 2, Low: 1 };

/** Next action is scheduled before the as-of date on an open, unresolved record. */
export function isNextActionOverdue(event: FundraisingEvent, asOfDate: ISODate): boolean {
  if (!event.nextActionDate || isResolved(event) || event.isClosed) return false;
  const diff = daysBetween(event.nextActionDate, asOfDate);
  return diff !== null && diff > 0;
}

/** Short status-based suggestion shown under the next-action date (guidance only). */
export function suggestedNextStep(event: FundraisingEvent): string {
  if (event.isClosed) return 'No action — closed';
  switch (event.reviewStatus) {
    case 'Needs Review':
      return 'Initial review';
    case 'Awaiting Bank or Check Processing':
      return 'Check processing status';
    case 'Awaiting Advisory Board':
      return 'Confirm advisory board timing';
    case 'Post-Event Donations Expected':
      return 'Recheck posted donations';
    case 'Host Contact Needed':
      return 'Contact host';
    case 'Data or Attribution Mismatch':
      return 'Verify attribution';
    case 'Confirmed No Activity':
      return 'Decide on closure';
    case 'Resolved or Funds Attributed':
      return 'No action — resolved';
  }
}
