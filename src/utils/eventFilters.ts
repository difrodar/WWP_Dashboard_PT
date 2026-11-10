import type { EventType, FundraisingEvent, ISODate, Priority, ReviewReason, ReviewStatus } from '../types/event';
import { EVENT_TYPES, PRIORITIES, REVIEW_REASONS, REVIEW_STATUSES } from '../types/event';
import { compareISODates, toDayNumber } from './dateUtils';
import { PRIORITY_RANK, getDaysSinceEvent, isDataQualityException, isFlagged } from './eventRules';

export const ALL = 'all';
export const UNASSIGNED = 'unassigned';

export interface FilterState {
  search: string;
  /** Minimum days since event ('' = no minimum). Narrows the view only; never changes the 30-day rule. */
  minDays: string;
  eventType: EventType | typeof ALL;
  reviewStatus: ReviewStatus | typeof ALL;
  reviewReason: ReviewReason | typeof ALL;
  specialist: string;
  priority: Priority | typeof ALL;
  dateFrom: ISODate | '';
  dateTo: ISODate | '';
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  minDays: '',
  eventType: ALL,
  reviewStatus: ALL,
  reviewReason: ALL,
  specialist: ALL,
  priority: ALL,
  dateFrom: '',
  dateTo: '',
};

export function countActiveFilters(filters: FilterState): number {
  return (Object.keys(DEFAULT_FILTERS) as Array<keyof FilterState>).filter(
    (key) => filters[key].trim() !== DEFAULT_FILTERS[key],
  ).length;
}

export function applyFilters(events: FundraisingEvent[], filters: FilterState, asOfDate: ISODate): FundraisingEvent[] {
  const search = filters.search.trim().toLowerCase();
  const minDays = filters.minDays.trim() === '' ? null : Number(filters.minDays);
  const from = toDayNumber(filters.dateFrom);
  const to = toDayNumber(filters.dateTo);

  return events.filter((event) => {
    if (search && !`${event.eventName} ${event.hostName} ${event.id}`.toLowerCase().includes(search)) return false;

    if (minDays !== null && Number.isFinite(minDays)) {
      const days = getDaysSinceEvent(event, asOfDate);
      if (days === null || days < minDays) return false;
    }

    if (filters.eventType !== ALL && event.eventType !== filters.eventType) return false;
    if (filters.reviewStatus !== ALL && event.reviewStatus !== filters.reviewStatus) return false;
    if (filters.reviewReason !== ALL && event.reviewReason !== filters.reviewReason) return false;
    if (filters.priority !== ALL && event.priority !== filters.priority) return false;

    if (filters.specialist === UNASSIGNED && event.assignedSpecialist) return false;
    if (filters.specialist !== ALL && filters.specialist !== UNASSIGNED && event.assignedSpecialist !== filters.specialist) {
      return false;
    }

    if (from !== null || to !== null) {
      const eventDay = toDayNumber(event.eventDate);
      if (eventDay === null) return false;
      if (from !== null && eventDay < from) return false;
      if (to !== null && eventDay > to) return false;
    }

    return true;
  });
}

export type SortKey = 'eventDate' | 'daysSinceEvent' | 'priority' | 'eventName';
export type SortDirection = 'asc' | 'desc';
export interface SortState {
  key: SortKey;
  direction: SortDirection;
}

/** Default: highest priority first, then oldest event first (tie-breaker). */
export const DEFAULT_SORT: SortState = { key: 'priority', direction: 'desc' };

export const SORT_LABELS: Record<SortKey, string> = {
  eventDate: 'Event date',
  daysSinceEvent: 'Days since event',
  priority: 'Priority',
  eventName: 'Event name',
};

/**
 * Stable, deterministic sort. Missing dates always sort last regardless of
 * direction. Ties are broken by days since event (oldest first), then name.
 */
export function sortEvents(events: FundraisingEvent[], sort: SortState, asOfDate: ISODate): FundraisingEvent[] {
  const dir = sort.direction === 'asc' ? 1 : -1;

  const byDaysDesc = (a: FundraisingEvent, b: FundraisingEvent) => {
    const da = getDaysSinceEvent(a, asOfDate);
    const db = getDaysSinceEvent(b, asOfDate);
    if (da === null && db === null) return 0;
    if (da === null) return 1;
    if (db === null) return -1;
    return db - da;
  };
  const byName = (a: FundraisingEvent, b: FundraisingEvent) => a.eventName.localeCompare(b.eventName);

  const primary = (a: FundraisingEvent, b: FundraisingEvent): number => {
    switch (sort.key) {
      case 'eventName':
        return dir * byName(a, b);
      case 'priority':
        return dir * (PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
      case 'eventDate': {
        if (!a.eventDate || !b.eventDate) return compareISODates(a.eventDate, b.eventDate);
        return dir * compareISODates(a.eventDate, b.eventDate);
      }
      case 'daysSinceEvent': {
        const da = getDaysSinceEvent(a, asOfDate);
        const db = getDaysSinceEvent(b, asOfDate);
        if (da === null || db === null) return byDaysDesc(a, b);
        return dir * (da - db);
      }
    }
  };

  return [...events].sort((a, b) => primary(a, b) || byDaysDesc(a, b) || byName(a, b));
}

export type ViewMode = 'queue' | 'data-quality' | 'all';

export function getEventsForView(events: FundraisingEvent[], view: ViewMode, asOfDate: ISODate): FundraisingEvent[] {
  switch (view) {
    case 'queue':
      return events.filter((e) => isFlagged(e, asOfDate));
    case 'data-quality':
      return events.filter(isDataQualityException);
    case 'all':
      return events;
  }
}

export interface FilterOptions {
  eventTypes: EventType[];
  reviewStatuses: ReviewStatus[];
  reviewReasons: ReviewReason[];
  priorities: Priority[];
  specialists: string[];
}

/** Dropdown options derived from the data, kept in the canonical order of each taxonomy. */
export function getFilterOptions(events: FundraisingEvent[], knownSpecialists: readonly string[]): FilterOptions {
  const present = <T extends string>(all: readonly T[], pick: (e: FundraisingEvent) => T) => {
    const used = new Set(events.map(pick));
    return all.filter((v) => used.has(v));
  };
  const specialists = new Set<string>(knownSpecialists);
  events.forEach((e) => e.assignedSpecialist && specialists.add(e.assignedSpecialist));

  return {
    eventTypes: present(EVENT_TYPES, (e) => e.eventType),
    reviewStatuses: [...REVIEW_STATUSES],
    reviewReasons: present(REVIEW_REASONS, (e) => e.reviewReason),
    priorities: [...PRIORITIES],
    specialists: [...specialists].sort((a, b) => a.localeCompare(b)),
  };
}
