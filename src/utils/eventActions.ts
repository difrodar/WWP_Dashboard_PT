import type {
  FundraisingEvent,
  ISODate,
  Priority,
  ProcessingStatus,
  ReviewReason,
  ReviewStatus,
  TimelineEntry,
  TimelineEntryType,
} from '../types/event';
import { AWAITING_PROCESSING_STATUS, DEFAULT_REVIEW_STATUS, RESOLVED_STATUS } from '../types/event';
import { formatDate } from './dateUtils';

/**
 * Pure demo actions (Processes 4.0 and 5.0). Each returns a NEW event object
 * with a timeline entry describing exactly what the user did in the demo.
 * `date` is the simulated working date (the dashboard's as-of date).
 * Nothing here sends messages or touches real donation records.
 */

let counter = 0;
const newId = (prefix: string) => `${prefix}-demo-${Date.now().toString(36)}-${(counter++).toString(36)}`;

function withEntry(
  event: FundraisingEvent,
  date: ISODate,
  actor: string,
  type: TimelineEntryType,
  description: string,
  changes: Partial<FundraisingEvent>,
  markReviewed = true,
): FundraisingEvent {
  const entry: TimelineEntry = { id: newId(event.id), date, type, description, actor, isDemoAction: true };
  return {
    ...event,
    ...changes,
    lastUpdated: date,
    lastReviewed: markReviewed ? date : event.lastReviewed,
    timeline: [...event.timeline, entry],
  };
}

export function changeReviewStatus(event: FundraisingEvent, status: ReviewStatus, date: ISODate, actor: string) {
  if (event.reviewStatus === status) return event;
  const type: TimelineEntryType = status === RESOLVED_STATUS ? 'resolution' : 'status';
  const description =
    status === RESOLVED_STATUS
      ? 'Marked Resolved or Funds Attributed (removed from active queue).'
      : event.reviewStatus === RESOLVED_STATUS
        ? `Case reopened. Review status changed to ${status}.`
        : `Review status changed to ${status}.`;
  return withEntry(event, date, actor, type, description, { reviewStatus: status });
}

export function changeReviewReason(event: FundraisingEvent, reason: ReviewReason, date: ISODate, actor: string) {
  if (event.reviewReason === reason) return event;
  return withEntry(event, date, actor, 'review', `Review reason changed to “${reason}”.`, { reviewReason: reason });
}

export function changeProcessingStatus(event: FundraisingEvent, status: ProcessingStatus, date: ISODate, actor: string) {
  if (event.processingStatus === status) return event;
  return withEntry(event, date, actor, 'processing', `Processing status recorded as ${status}.`, { processingStatus: status });
}

export function changePriority(event: FundraisingEvent, priority: Priority, date: ISODate, actor: string) {
  if (event.priority === priority) return event;
  return withEntry(event, date, actor, 'priority', `Priority changed from ${event.priority} to ${priority}.`, { priority });
}

export function assignSpecialist(event: FundraisingEvent, specialist: string | null, date: ISODate, actor: string) {
  const next = specialist && specialist.trim() ? specialist.trim() : null;
  if (event.assignedSpecialist === next) return event;
  const description = next
    ? event.assignedSpecialist
      ? `Reassigned from ${event.assignedSpecialist} to ${next}.`
      : `Assigned to ${next}.`
    : `Unassigned (was ${event.assignedSpecialist}).`;
  return withEntry(event, date, actor, 'assignment', description, { assignedSpecialist: next });
}

export function setNextActionDate(event: FundraisingEvent, nextActionDate: ISODate | null, date: ISODate, actor: string) {
  const next = nextActionDate || null;
  if (event.nextActionDate === next) return event;
  const description = next ? `Next action scheduled for ${formatDate(next)}.` : 'Next action date cleared.';
  return withEntry(event, date, actor, 'scheduling', description, { nextActionDate: next }, false);
}

export function addNote(event: FundraisingEvent, text: string, date: ISODate, author: string) {
  const trimmed = text.trim();
  if (!trimmed) return event;
  const note = { id: newId(`${event.id}-n`), date, author, text: trimmed, isDemoAction: true };
  return withEntry(event, date, author, 'note', 'Follow-up note added.', { notes: [...event.notes, note] });
}

export function markResolved(event: FundraisingEvent, date: ISODate, actor: string) {
  return changeReviewStatus(event, RESOLVED_STATUS, date, actor);
}

export function markAwaitingProcessing(event: FundraisingEvent, date: ISODate, actor: string) {
  return changeReviewStatus(event, AWAITING_PROCESSING_STATUS, date, actor);
}

export function reopenCase(event: FundraisingEvent, date: ISODate, actor: string) {
  return changeReviewStatus(event, DEFAULT_REVIEW_STATUS, date, actor);
}

export function setClosed(event: FundraisingEvent, isClosed: boolean, date: ISODate, actor: string) {
  if (event.isClosed === isClosed) return event;
  const description = isClosed ? 'Record closed administratively (removed from active queue).' : 'Record reopened administratively.';
  return withEntry(event, date, actor, 'closure', description, { isClosed });
}

export interface CaseUpdate {
  reviewStatus: ReviewStatus;
  reviewReason: ReviewReason;
  processingStatus: ProcessingStatus;
  priority: Priority;
  assignedSpecialist: string | null;
  nextActionDate: ISODate | null;
}

/** Applies every changed field from the case-management form, one timeline entry per change. */
export function applyCaseUpdate(event: FundraisingEvent, update: CaseUpdate, date: ISODate, actor: string) {
  let next = event;
  next = changeReviewStatus(next, update.reviewStatus, date, actor);
  next = changeReviewReason(next, update.reviewReason, date, actor);
  next = changeProcessingStatus(next, update.processingStatus, date, actor);
  next = changePriority(next, update.priority, date, actor);
  next = assignSpecialist(next, update.assignedSpecialist, date, actor);
  next = setNextActionDate(next, update.nextActionDate, date, actor);
  return next;
}
