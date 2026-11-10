import { describe, expect, it } from 'vitest';
import type { FundraisingEvent } from '../types/event';
import { DEMO_AS_OF_DATE, createSeedEvents } from '../data/mockEvents';
import { addDays, daysBetween, formatDate, isValidISODate, toDayNumber } from './dateUtils';
import {
  getDaysSinceEvent,
  getMonitoringResult,
  isAwaitingProcessing,
  isDataQualityException,
  isFlagged,
  isNextActionOverdue,
} from './eventRules';

const AS_OF = '2026-11-10';

function makeEvent(overrides: Partial<FundraisingEvent> = {}): FundraisingEvent {
  return {
    id: 'TEST-1',
    eventName: 'Test Event',
    hostName: 'Test Host',
    eventDate: addDays(AS_OF, -45),
    eventType: '5K Run/Walk',
    amountRaised: 0,
    fundraisingGoal: 1000,
    reviewStatus: 'Needs Review',
    reviewReason: 'No posted donations',
    priority: 'Medium',
    assignedSpecialist: null,
    lastReviewed: null,
    nextActionDate: null,
    processingStatus: 'None reported',
    lastUpdated: AS_OF,
    sourceSystem: 'Simulated NPSP',
    notes: [],
    timeline: [],
    isClosed: false,
    ...overrides,
  };
}

const daysAgo = (n: number) => addDays(AS_OF, -n);

describe('date utilities', () => {
  it('computes whole-day differences without timezone drift (incl. across DST change)', () => {
    // US DST ended 2026-11-01; a naive local-time diff would be off by an hour.
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2);
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
    expect(daysBetween('2026-10-11', '2026-11-10')).toBe(30);
  });

  it('runs these tests in a non-UTC zone', () => {
    expect(process.env.TZ).toBe('America/Los_Angeles');
  });

  it('rejects invalid and impossible dates', () => {
    expect(isValidISODate('2026-02-30')).toBe(false);
    expect(isValidISODate('2026-13-01')).toBe(false);
    expect(isValidISODate('11/10/2026')).toBe(false);
    expect(isValidISODate('')).toBe(false);
    expect(isValidISODate(null)).toBe(false);
    expect(isValidISODate('2028-02-29')).toBe(true);
    expect(toDayNumber('1970-01-02')).toBe(1);
  });

  it('adds days and formats date-only values in UTC', () => {
    expect(addDays('2026-11-10', -31)).toBe('2026-10-10');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(formatDate('2026-11-10')).toBe('Nov 10, 2026');
    expect(formatDate(null)).toBe('Not available');
  });
});

describe('30-day $0 flagging rule', () => {
  it('does NOT flag an event 29 days old with $0', () => {
    const e = makeEvent({ eventDate: daysAgo(29) });
    expect(getDaysSinceEvent(e, AS_OF)).toBe(29);
    expect(isFlagged(e, AS_OF)).toBe(false);
    expect(getMonitoringResult(e, AS_OF)).toBe('within-window');
  });

  it('does NOT flag an event exactly 30 days old with $0', () => {
    const e = makeEvent({ eventDate: daysAgo(30) });
    expect(getDaysSinceEvent(e, AS_OF)).toBe(30);
    expect(isFlagged(e, AS_OF)).toBe(false);
  });

  it('flags an event 31 days old with $0', () => {
    const e = makeEvent({ eventDate: daysAgo(31) });
    expect(getDaysSinceEvent(e, AS_OF)).toBe(31);
    expect(isFlagged(e, AS_OF)).toBe(true);
    expect(getMonitoringResult(e, AS_OF)).toBe('flagged');
  });

  it('requires the posted amount to be exactly zero', () => {
    expect(isFlagged(makeEvent({ amountRaised: 0 }), AS_OF)).toBe(true);
    expect(isFlagged(makeEvent({ amountRaised: 0.01 }), AS_OF)).toBe(false);
    expect(isFlagged(makeEvent({ amountRaised: 1240 }), AS_OF)).toBe(false);
    expect(getMonitoringResult(makeEvent({ amountRaised: 1240 }), AS_OF)).toBe('donations-posted');
  });

  it('does NOT flag a future event', () => {
    const e = makeEvent({ eventDate: addDays(AS_OF, 14) });
    expect(getDaysSinceEvent(e, AS_OF)).toBe(-14);
    expect(isFlagged(e, AS_OF)).toBe(false);
    expect(getMonitoringResult(e, AS_OF)).toBe('future-event');
  });

  it('routes missing or invalid event dates to data-quality review, not the flagged queue', () => {
    for (const eventDate of [null, '', 'not-a-date', '2026-02-30']) {
      const e = makeEvent({ eventDate });
      expect(isFlagged(e, AS_OF)).toBe(false);
      expect(isDataQualityException(e)).toBe(true);
      expect(getDaysSinceEvent(e, AS_OF)).toBeNull();
      expect(getMonitoringResult(e, AS_OF)).toBe('data-quality');
    }
  });

  it('excludes resolved events', () => {
    const e = makeEvent({ reviewStatus: 'Resolved or Funds Attributed' });
    expect(isFlagged(e, AS_OF)).toBe(false);
    expect(getMonitoringResult(e, AS_OF)).toBe('resolved');
  });

  it('excludes closed events', () => {
    const e = makeEvent({ isClosed: true, reviewStatus: 'Confirmed No Activity' });
    expect(isFlagged(e, AS_OF)).toBe(false);
    expect(getMonitoringResult(e, AS_OF)).toBe('closed');
  });

  it('keeps unresolved processing / delay statuses in the active queue', () => {
    for (const reviewStatus of [
      'Awaiting Bank or Check Processing',
      'Awaiting Advisory Board',
      'Post-Event Donations Expected',
      'Host Contact Needed',
      'Data or Attribution Mismatch',
      'Confirmed No Activity',
    ] as const) {
      expect(isFlagged(makeEvent({ reviewStatus }), AS_OF)).toBe(true);
    }
    const awaiting = makeEvent({ reviewStatus: 'Awaiting Bank or Check Processing', processingStatus: 'Offline check in transit' });
    expect(isAwaitingProcessing(awaiting, AS_OF)).toBe(true);
  });

  it('recalculates days and eligibility when the as-of date changes', () => {
    const e = makeEvent({ eventDate: '2026-10-11' });
    expect(getDaysSinceEvent(e, '2026-11-10')).toBe(30);
    expect(isFlagged(e, '2026-11-10')).toBe(false);
    expect(getDaysSinceEvent(e, '2026-11-11')).toBe(31);
    expect(isFlagged(e, '2026-11-11')).toBe(true);
    expect(isFlagged(e, '2026-10-01')).toBe(false); // event is in the future relative to this as-of date
  });

  it('marks next actions overdue only for open, unresolved events', () => {
    expect(isNextActionOverdue(makeEvent({ nextActionDate: daysAgo(1) }), AS_OF)).toBe(true);
    expect(isNextActionOverdue(makeEvent({ nextActionDate: AS_OF }), AS_OF)).toBe(false);
    expect(isNextActionOverdue(makeEvent({ nextActionDate: daysAgo(1), isClosed: true }), AS_OF)).toBe(false);
  });
});

describe('synthetic seed data', () => {
  const seed = createSeedEvents();
  const byId = (id: string) => seed.find((e) => e.id === id)!;

  it('uses the fixed demo as-of date', () => {
    expect(DEMO_AS_OF_DATE).toBe('2026-11-10');
  });

  it('contains at least ten distinct events with unique ids', () => {
    expect(seed.length).toBeGreaterThanOrEqual(10);
    expect(new Set(seed.map((e) => e.id)).size).toBe(seed.length);
  });

  it.each([
    ['CFM-1001', 29, 'within-window'],
    ['CFM-1002', 30, 'within-window'],
    ['CFM-1003', 31, 'flagged'],
    ['CFM-1004', 60, 'flagged'],
    ['CFM-1005', 45, 'flagged'],
    ['CFM-1006', 45, 'donations-posted'],
    ['CFM-1007', -14, 'future-event'],
    ['CFM-1008', null, 'data-quality'],
    ['CFM-1009', 75, 'flagged'],
    ['CFM-1010', 50, 'resolved'],
    ['CFM-1011', 120, 'closed'],
  ] as const)('%s is %s days old and evaluates to %s', (id, days, result) => {
    const e = byId(id);
    expect(getDaysSinceEvent(e, DEMO_AS_OF_DATE)).toBe(days);
    expect(getMonitoringResult(e, DEMO_AS_OF_DATE)).toBe(result);
  });

  it('preserves the required context on scenario records', () => {
    expect(byId('CFM-1004').reviewStatus).toBe('Awaiting Bank or Check Processing');
    expect(byId('CFM-1004').processingStatus).toBe('Offline check in transit');
    expect(byId('CFM-1005').reviewReason).toBe('Post-event donations expected');
    expect(byId('CFM-1006').amountRaised).toBeGreaterThan(0);
    expect(byId('CFM-1009').reviewStatus).toBe('Data or Attribution Mismatch');
    expect(byId('CFM-1010').amountRaised).toBe(0);
  });

  it('keeps timeline and record dates internally consistent with the as-of date', () => {
    for (const e of seed) {
      for (const entry of e.timeline) {
        expect(isValidISODate(entry.date)).toBe(true);
        expect(daysBetween(entry.date, DEMO_AS_OF_DATE)!).toBeGreaterThanOrEqual(0); // nothing recorded in the future
        expect(daysBetween(entry.date, e.lastUpdated)!).toBeGreaterThanOrEqual(0);
      }
      if (e.lastReviewed) expect(daysBetween(e.lastReviewed, DEMO_AS_OF_DATE)!).toBeGreaterThanOrEqual(0);
      const registration = e.timeline.find((t) => t.type === 'registration');
      expect(registration).toBeDefined();
      if (e.eventDate) expect(daysBetween(registration!.date, e.eventDate)!).toBeGreaterThan(0);
    }
  });

  it('contains no email addresses, phone numbers, or URLs', () => {
    const text = JSON.stringify(seed);
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(text).not.toMatch(/\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/);
    expect(text).not.toMatch(/https?:\/\//);
  });
});
