const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2, minimumFractionDigits: 0 });

export function formatCurrency(amount: number | null | undefined, placeholder = 'Not available'): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return placeholder;
  return usd.format(amount);
}

export function formatDays(days: number | null, placeholder = 'N/A'): string {
  if (days === null) return placeholder;
  return `${days}`;
}

export function pluralize(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
