const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2, minimumFractionDigits: 0 });

export function formatCurrency(amount: number | null | undefined, placeholder = 'Not available'): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return placeholder;
  return usd.format(amount);
}

export function formatDays(days: number | null, placeholder = 'N/A'): string {
  if (days === null) return placeholder;
  return `${days}`;
}

/** Whole weeks since the event, for Tristin's "days/weeks since event" view: "<1 wk", "1 wk", "6 wk". */
export function formatWeeks(days: number): string {
  const weeks = Math.floor(days / 7);
  return weeks < 1 ? '<1 wk' : `${weeks} wk`;
}

export function pluralize(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
