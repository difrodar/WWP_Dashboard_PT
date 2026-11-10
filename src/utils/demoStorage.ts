import type { FundraisingEvent, ISODate } from '../types/event';
import { DEMO_AS_OF_DATE, createSeedEvents } from '../data/mockEvents';
import { isValidISODate } from './dateUtils';

/** Bump the version if the data model changes so stale browser data is ignored. */
export const STORAGE_KEY = 'cfm-demo-state-v1';

export interface DemoState {
  version: 1;
  asOfDate: ISODate;
  events: FundraisingEvent[];
}

export function createInitialState(): DemoState {
  return { version: 1, asOfDate: DEMO_AS_OF_DATE, events: createSeedEvents() };
}

function isDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<DemoState>;
  return (
    v.version === 1 &&
    isValidISODate(v.asOfDate) &&
    Array.isArray(v.events) &&
    v.events.every((e) => e && typeof e.id === 'string' && typeof e.amountRaised === 'number' && Array.isArray(e.timeline))
  );
}

/** Returns saved demo state, or the original seed data if nothing valid is stored. */
export function loadDemoState(): DemoState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isDemoState(parsed)) return parsed;
    }
  } catch {
    // Storage unavailable or corrupted — fall back to seed data.
  }
  return createInitialState();
}

export function saveDemoState(state: DemoState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
