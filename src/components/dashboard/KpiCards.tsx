import type { ReactNode } from 'react';
import type { DashboardKpis } from '../../utils/dashboardMetrics';

/** KPI shortcuts that apply a filter to the active queue. */
export type KpiShortcut = 'all' | 'high' | 'awaiting';

interface KpiCardProps {
  label: string;
  value: string;
  caption: string;
  definition: string;
  accent: string;
  icon: ReactNode;
  /** When set, the card is a button (a toggle when `pressed` is also set). */
  onClick?: () => void;
  pressed?: boolean;
  actionLabel?: string;
}

function KpiCard({ label, value, caption, definition, accent, icon, onClick, pressed, actionLabel }: KpiCardProps) {
  const body = (
    <>
      <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} aria-hidden="true" />
      <span className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="text-slate-400" title={definition} aria-hidden="true">
          {icon}
        </span>
      </span>
      <span data-kpi-value className="mt-0.5 block text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
        {value}
      </span>
      <span className="block truncate text-xs text-slate-500">{caption}</span>
      <span className="sr-only">
        Definition: {definition}
        {actionLabel ? ` ${actionLabel}` : ''}
      </span>
    </>
  );

  const base = 'relative block w-full overflow-hidden rounded-lg bg-white p-3 pl-4 text-left shadow-sm ring-1';

  if (!onClick) {
    return (
      <div data-kpi={label} className={`${base} ring-slate-200`}>
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-kpi={label}
      aria-pressed={pressed}
      onClick={onClick}
      title={actionLabel}
      className={`${base} cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
        pressed ? 'ring-2 ring-brand-600' : 'ring-slate-200 hover:ring-slate-300'
      }`}
    >
      {body}
    </button>
  );
}

const icons = {
  flag: (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 17V3m0 1h9l-1.5 3L13 10H4" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 7v4m0 3h.01M8.6 3.2 2.3 14.5A1.6 1.6 0 0 0 3.7 17h12.6a1.6 1.6 0 0 0 1.4-2.5L11.4 3.2a1.6 1.6 0 0 0-2.8 0Z" />
    </svg>
  ),
  bank: (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h14M10 3l7 5H3l7-5ZM5 8v7m3.3-7v7m3.4-7v7M15 8v7M3 17h14" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="7" />
      <path strokeLinecap="round" d="M10 6v4l2.5 2" />
    </svg>
  ),
};

interface KpiCardsProps {
  kpis: DashboardKpis;
  filtersActive: boolean;
  /** Which toggle shortcuts are currently applied. */
  active: { high: boolean; awaiting: boolean };
  onShortcut: (shortcut: KpiShortcut) => void;
}

export function KpiCards({ kpis, filtersActive, active, onShortcut }: KpiCardsProps) {
  const scope = filtersActive ? 'flagged events matching filters' : 'active flagged events';
  const none = kpis.flaggedCount === 0;

  return (
    <section aria-labelledby="kpi-heading">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="kpi-heading" className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Monitoring summary
        </h2>
        <p className="text-xs text-slate-500">
          Click a card to filter the queue · KPIs cover active flagged events only{filtersActive ? ' that match the current filters' : ''}.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Flagged $0 Events"
          value={String(kpis.flaggedCount)}
          caption={none ? 'Active queue is empty' : `Needs review — ${scope}`}
          definition="Events with a valid date, more than 30 days old, $0 posted, not resolved and not closed."
          accent="bg-rose-500"
          icon={icons.flag}
          onClick={() => onShortcut('all')}
          actionLabel="Show the whole active queue (clears priority and status filters)."
        />
        <KpiCard
          label="High-Priority Events"
          value={String(kpis.highPriorityCount)}
          caption={none ? 'No flagged events' : `of ${kpis.flaggedCount} ${scope}`}
          definition="Flagged events with a staff-assigned (demonstration) priority of High."
          accent="bg-red-600"
          icon={icons.alert}
          onClick={() => onShortcut('high')}
          pressed={active.high}
          actionLabel={active.high ? 'Remove the High priority filter.' : 'Show only High priority events.'}
        />
        <KpiCard
          label="Events Awaiting Processing"
          value={String(kpis.awaitingProcessingCount)}
          caption={none ? 'No flagged events' : 'Bank or check pending — still in queue'}
          definition="Flagged events whose review status is Awaiting Bank or Check Processing. These remain in the active queue."
          accent="bg-sky-500"
          icon={icons.bank}
          onClick={() => onShortcut('awaiting')}
          pressed={active.awaiting}
          actionLabel={active.awaiting ? 'Remove the Awaiting Processing filter.' : 'Show only events awaiting bank or check processing.'}
        />
        <KpiCard
          label="Average Days Since Event"
          value={kpis.averageDaysSinceEvent === null ? '—' : kpis.averageDaysSinceEvent.toFixed(1)}
          caption={kpis.averageDaysSinceEvent === null ? 'No data — no flagged events' : `Mean age of ${scope}`}
          definition="Average whole days between each flagged event's date and the as-of date."
          accent="bg-slate-500"
          icon={icons.clock}
        />
      </div>
    </section>
  );
}
