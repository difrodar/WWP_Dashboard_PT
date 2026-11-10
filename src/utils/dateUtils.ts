import type { ISODate } from '../types/event';

/**
 * Date-only helpers.
 *
 * Every calendar date is handled as a `YYYY-MM-DD` string and converted to a
 * whole-day number via `Date.UTC`. Nothing here reads the local timezone, so
 * "days since event" can never shift by one because of DST or the viewer's
 * location.
 */

const MS_PER_DAY = 86_400_000;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Converts an ISO date-only string to a day number (days since 1970-01-01), or null if invalid. */
export function toDayNumber(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const ms = Date.UTC(year, month - 1, day);
  const check = new Date(ms);
  // Reject impossible dates such as 2026-02-30 that Date.UTC would roll over.
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return null;
  }
  return Math.round(ms / MS_PER_DAY);
}

export function isValidISODate(value: unknown): value is ISODate {
  return toDayNumber(value) !== null;
}

/** Converts a day number back to `YYYY-MM-DD`. */
export function fromDayNumber(dayNumber: number): ISODate {
  return new Date(dayNumber * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (positive when `to` is later). Null if either date is invalid. */
export function daysBetween(from: ISODate | null | undefined, to: ISODate | null | undefined): number | null {
  const a = toDayNumber(from);
  const b = toDayNumber(to);
  if (a === null || b === null) return null;
  return b - a;
}

/** Adds (or subtracts) whole days to an ISO date. Throws on an invalid input date. */
export function addDays(date: ISODate, days: number): ISODate {
  const base = toDayNumber(date);
  if (base === null) throw new Error(`Invalid ISO date: ${String(date)}`);
  return fromDayNumber(base + days);
}

/** Negative when a < b, 0 when equal, positive when a > b. Invalid/null dates sort last. */
export function compareISODates(a: ISODate | null | undefined, b: ISODate | null | undefined): number {
  const da = toDayNumber(a);
  const db = toDayNumber(b);
  if (da === null && db === null) return 0;
  if (da === null) return 1;
  if (db === null) return -1;
  return da - db;
}

const displayFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

const longFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

/** "Oct 10, 2026", or the placeholder for missing/invalid dates. */
export function formatDate(date: ISODate | null | undefined, placeholder = 'Not available'): string {
  const n = toDayNumber(date);
  if (n === null) return placeholder;
  return displayFormatter.format(new Date(n * MS_PER_DAY));
}

/** "Tuesday, November 10, 2026". */
export function formatLongDate(date: ISODate | null | undefined, placeholder = 'Not available'): string {
  const n = toDayNumber(date);
  if (n === null) return placeholder;
  return longFormatter.format(new Date(n * MS_PER_DAY));
}
