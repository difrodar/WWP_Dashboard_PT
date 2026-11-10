import { describe, expect, it } from 'vitest';
import { DEMO_AS_OF_DATE, createSeedEvents } from '../data/mockEvents';
import { MOCK_SPECIALISTS } from '../data/mockSpecialists';
import { computeKpis } from './dashboardMetrics';
import {
  DEFAULT_FILTERS,
  UNASSIGNED,
  applyFilters,
  countActiveFilters,
  getEventsForView,
  getFilterOptions,
  sortEvents,
} from './eventFilters';
import {
  addNote,
  applyCaseUpdate,
  assignSpecialist,
  markAwaitingProcessing,
  markResolved,
  setClosed,
  setNextActionDate,
} from './eventActions';
import { isFlagged } from './eventRules';
import { addDays } from './dateUtils';
import { formatWeeks } from './format';

describe('formatWeeks', () => {
  it.each([
    [0, '<1 wk'],
    [6, '<1 wk'],
    [7, '1 wk'],
    [13, '1 wk'],
    [14, '2 wk'],
    [45, '6 wk'],
  ])('%i days → %s', (days, expected) => {
    expect(formatWeeks(days)).toBe(expected);
  });
});

const AS_OF = DEMO_AS_OF_DATE;
const seed = () => createSeedEvents();
const ids = (events: { id: string }[]) => events.map((e) => e.id);

describe('KPIs', () => {
  it('summarizes the seeded active queue', () => {
    const kpis = computeKpis(seed(), AS_OF);
    // Flagged: 1003, 1004, 1005, 1009, 1012, 1013, 1014, 1015, 1016, 1018
    expect(kpis.flaggedCount).toBe(10);
    expect(kpis.highPriorityCount).toBe(4);
    expect(kpis.awaitingProcessingCount).toBe(2);
    expect(kpis.averageDaysSinceEvent).toBe(53.1);
  });

  it('returns zeros and null (not NaN) for an empty set', () => {
    expect(computeKpis([], AS_OF)).toEqual({ flaggedCount: 0, highPriorityCount: 0, awaitingProcessingCount: 0, averageDaysSinceEvent: null });
  });

  it('moves with the as-of date', () => {
    const next = computeKpis(seed(), addDays(AS_OF, 1));
    expect(next.flaggedCount).toBe(11); // the exactly-30-day event crosses the threshold
  });

  it('updates when an event is resolved', () => {
    const events = seed().map((e) => (e.id === 'CFM-1015' ? markResolved(e, AS_OF, 'Tester') : e));
    const kpis = computeKpis(events, AS_OF);
    expect(kpis.flaggedCount).toBe(9);
    expect(kpis.highPriorityCount).toBe(3);
  });
});

describe('filters', () => {
  it('has no active filters by default', () => {
    expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0);
    expect(applyFilters(seed(), DEFAULT_FILTERS, AS_OF)).toHaveLength(seed().length);
  });

  it('combines filters', () => {
    const result = applyFilters(seed(), { ...DEFAULT_FILTERS, priority: 'High', minDays: '60' }, AS_OF);
    expect(ids(result).sort()).toEqual(['CFM-1009', 'CFM-1016']);
  });

  it('filters by event type, status, reason, and specialist', () => {
    expect(ids(applyFilters(seed(), { ...DEFAULT_FILTERS, eventType: 'Gala/Dinner' }, AS_OF)).sort()).toEqual(['CFM-1007', 'CFM-1014']);
    expect(ids(applyFilters(seed(), { ...DEFAULT_FILTERS, reviewStatus: 'Host Contact Needed' }, AS_OF)).sort()).toEqual(['CFM-1012', 'CFM-1016']);
    expect(ids(applyFilters(seed(), { ...DEFAULT_FILTERS, reviewReason: 'Third-party payment collection' }, AS_OF))).toEqual(['CFM-1012']);
    expect(ids(applyFilters(seed(), { ...DEFAULT_FILTERS, specialist: 'Elena Kowalski' }, AS_OF))).toEqual(['CFM-1009']);
    const unassigned = applyFilters(seed(), { ...DEFAULT_FILTERS, specialist: UNASSIGNED }, AS_OF);
    expect(unassigned.every((e) => e.assignedSpecialist === null)).toBe(true);
  });

  it('filters by event date range and excludes missing dates', () => {
    const result = applyFilters(seed(), { ...DEFAULT_FILTERS, dateFrom: addDays(AS_OF, -31), dateTo: addDays(AS_OF, -29) }, AS_OF);
    expect(ids(result).sort()).toEqual(['CFM-1001', 'CFM-1002', 'CFM-1003']);
  });

  it('min-days filter narrows the view but never changes the 30-day rule', () => {
    const events = seed();
    const lowMin = getEventsForView(applyFilters(events, { ...DEFAULT_FILTERS, minDays: '0' }, AS_OF), 'queue', AS_OF);
    expect(lowMin.every((e) => isFlagged(e, AS_OF))).toBe(true);
    expect(lowMin.some((e) => e.id === 'CFM-1001' || e.id === 'CFM-1002')).toBe(false);
  });

  it('derives dropdown options from data', () => {
    const options = getFilterOptions(seed(), MOCK_SPECIALISTS);
    expect(options.eventTypes).toContain('Golf Tournament');
    expect(options.specialists).toEqual([...MOCK_SPECIALISTS].sort());
    expect(options.priorities).toEqual(['High', 'Medium', 'Low']);
  });
});

describe('views', () => {
  it('separates the active queue, data-quality exceptions, and all events', () => {
    const events = seed();
    expect(getEventsForView(events, 'queue', AS_OF)).toHaveLength(10);
    expect(ids(getEventsForView(events, 'data-quality', AS_OF))).toEqual(['CFM-1008']);
    expect(getEventsForView(events, 'all', AS_OF)).toHaveLength(events.length);
  });
});

describe('sorting', () => {
  it('sorts by priority High > Medium > Low, ties broken by oldest event', () => {
    const sorted = sortEvents(getEventsForView(seed(), 'queue', AS_OF), { key: 'priority', direction: 'desc' }, AS_OF);
    expect(sorted.map((e) => e.priority)).toEqual(['High', 'High', 'High', 'High', 'Medium', 'Medium', 'Medium', 'Low', 'Low', 'Low']);
    expect(ids(sorted.slice(0, 4))).toEqual(['CFM-1009', 'CFM-1016', 'CFM-1012', 'CFM-1015']);
  });

  it('sorts by days since event and event date, with missing dates last', () => {
    const all = seed();
    const byDaysDesc = sortEvents(all, { key: 'daysSinceEvent', direction: 'desc' }, AS_OF);
    expect(byDaysDesc[0].id).toBe('CFM-1011');
    expect(byDaysDesc.at(-1)!.id).toBe('CFM-1008');
    const byDaysAsc = sortEvents(all, { key: 'daysSinceEvent', direction: 'asc' }, AS_OF);
    expect(byDaysAsc[0].id).toBe('CFM-1007');
    expect(byDaysAsc.at(-1)!.id).toBe('CFM-1008');
    const byDateAsc = sortEvents(all, { key: 'eventDate', direction: 'asc' }, AS_OF);
    expect(byDateAsc[0].id).toBe('CFM-1011');
    expect(byDateAsc.at(-1)!.id).toBe('CFM-1008');
  });

  it('sorts by event name', () => {
    const sorted = sortEvents(seed(), { key: 'eventName', direction: 'asc' }, AS_OF);
    const names = sorted.map((e) => e.eventName);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe('demo actions', () => {
  const base = () => seed().find((e) => e.id === 'CFM-1003')!;

  it('awaiting processing keeps the event flagged and logs the change', () => {
    const e = markAwaitingProcessing(base(), AS_OF, 'Tester');
    expect(e.reviewStatus).toBe('Awaiting Bank or Check Processing');
    expect(isFlagged(e, AS_OF)).toBe(true);
    expect(e.timeline.at(-1)).toMatchObject({ type: 'status', isDemoAction: true, date: AS_OF });
  });

  it('resolving removes the event from the active queue', () => {
    const e = markResolved(base(), AS_OF, 'Tester');
    expect(isFlagged(e, AS_OF)).toBe(false);
    expect(e.timeline.at(-1)!.type).toBe('resolution');
  });

  it('closing removes the event from the active queue', () => {
    expect(isFlagged(setClosed(base(), true, AS_OF, 'Tester'), AS_OF)).toBe(false);
  });

  it('assigns specialists, notes, and next-action dates', () => {
    let e = assignSpecialist(base(), 'Marcus Bell', AS_OF, 'Tester');
    expect(e.assignedSpecialist).toBe('Marcus Bell');
    e = addNote(e, '  Called host (simulated).  ', AS_OF, 'Tester');
    expect(e.notes.at(-1)!.text).toBe('Called host (simulated).');
    e = setNextActionDate(e, '2026-11-20', AS_OF, 'Tester');
    expect(e.nextActionDate).toBe('2026-11-20');
    expect(e.timeline.slice(-3).map((t) => t.type)).toEqual(['assignment', 'note', 'scheduling']);
    expect(addNote(e, '   ', AS_OF, 'Tester')).toBe(e); // blank notes ignored
  });

  it('applyCaseUpdate logs one entry per changed field and nothing for unchanged ones', () => {
    const e = base();
    const unchanged = applyCaseUpdate(e, {
      reviewStatus: e.reviewStatus,
      reviewReason: e.reviewReason,
      processingStatus: e.processingStatus,
      priority: e.priority,
      assignedSpecialist: e.assignedSpecialist,
      nextActionDate: e.nextActionDate,
    }, AS_OF, 'Tester');
    expect(unchanged).toBe(e);

    const updated = applyCaseUpdate(e, {
      reviewStatus: 'Host Contact Needed',
      reviewReason: 'Host unresponsive',
      processingStatus: e.processingStatus,
      priority: 'High',
      assignedSpecialist: 'Sam Okafor',
      nextActionDate: '2026-11-15',
    }, AS_OF, 'Tester');
    expect(updated.timeline.length - e.timeline.length).toBe(5);
    expect(updated.lastUpdated).toBe(AS_OF);
    expect(updated.lastReviewed).toBe(AS_OF);
  });
});
