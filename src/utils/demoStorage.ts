import type { FundraisingEvent, ISODate } from '../types/event';
import { createSeedEvents } from '../data/mockEvents';
import { addDays, daysBetween, getTodayISO, isValidISODate } from './dateUtils';

/** Bump the version if the data model changes so stale browser data is ignored. */
export const STORAGE_KEY = 'cfm-demo-state-v3';

/**
 * What is kept in localStorage. The as-of date is deliberately NOT stored:
 * every page load starts from today's date.
 */
export interface StoredDemoState {
  version: 3;
  /** The day the stored event dates are relative to (the day they were last loaded). */
  anchorDate: ISODate;
  events: FundraisingEvent[];
}

export interface DemoState {
  /** Today's date when the data was loaded; the stored events are relative to it. */
  anchorDate: ISODate;
  /** Date used for every calculation. Starts as today; can be changed for the current session only. */
  asOfDate: ISODate;
  events: FundraisingEvent[];
}

export function createInitialState(today: ISODate = getTodayISO()): DemoState {
  return { anchorDate: today, asOfDate: today, events: createSeedEvents(today) };
}

function isStoredDemoState(value: unknown): value is StoredDemoState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<StoredDemoState>;
  return (
    v.version === 3 &&
    isValidISODate(v.anchorDate) &&
    Array.isArray(v.events) &&
    v.events.every((e) => e && typeof e.id === 'string' && typeof e.amountRaised === 'number' && Array.isArray(e.timeline))
  );
}

/**
 * Moves every date on an event by `days`, so saved demo data keeps the same
 * ages (29 / 30 / 31 days, overdue follow-ups, …) when it is reopened on a later day.
 */
export function shiftEventDates(event: FundraisingEvent, days: number): FundraisingEvent {
  if (days === 0) return event;
  const shift = (date: ISODate | null) => (date && isValidISODate(date) ? addDays(date, days) : date);
  return {
    ...event,
    eventDate: shift(event.eventDate),
    lastReviewed: shift(event.lastReviewed),
    nextActionDate: shift(event.nextActionDate),
    lastUpdated: shift(event.lastUpdated) ?? event.lastUpdated,
    notes: event.notes.map((n) => ({ ...n, date: shift(n.date) ?? n.date })),
    timeline: event.timeline.map((t) => ({ ...t, date: shift(t.date) ?? t.date })),
  };
}

/** Returns saved demo edits moved forward to today, or fresh seed data if nothing valid is stored. */
export function loadDemoState(today: ISODate = getTodayISO()): DemoState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isStoredDemoState(parsed)) {
        const offset = daysBetween(parsed.anchorDate, today) ?? 0;
        return { anchorDate: today, asOfDate: today, events: parsed.events.map((e) => shiftEventDates(e, offset)) };
      }
    }
  } catch {
    // Storage unavailable or corrupted — fall back to seed data.
  }
  return createInitialState(today);
}

export function saveDemoState(state: DemoState): void {
  const stored: StoredDemoState = { version: 3, anchorDate: state.anchorDate, events: state.events };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Ignore quota/privacy-mode errors; the demo still works in memory.
  }
}

export function clearDemoState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
