import type { ReactNode } from 'react';
import type { DashboardKpis } from '../../utils/dashboardMetrics';

interface KpiCardProps {
  label: string;
  value: string;
  caption: string;
  definition: string;
  accent: string;
  icon: ReactNode;
}

function KpiCard({ label, value, caption, definition, accent, icon }: KpiCardProps) {
  return (
    <div data-kpi={label} className="relative overflow-hidden rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className={`absolute inset-y-0 left-0 w-1 ${accent}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-2">
        <dt className="text-sm font-medium text-slate-600">{label}</dt>
        <span className="text-slate-400" title={definition} aria-hidden="true">
          {icon}
        </span>
      </div>
      <dd>
        <span data-kpi-value className="mt-1 block text-3xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</span>
        <span className="mt-1 block text-xs text-slate-500">{caption}</span>
        <span className="sr-only">Definition: {definition}</span>
      </dd>
    </div>
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

export function KpiCards({ kpis, filtersActive }: { kpis: DashboardKpis; filtersActive: boolean }) {
  const scope = filtersActive ? 'flagged events matching filters' : 'active flagged events';
  const none = kpis.flaggedCount === 0;

  return (
    <section aria-labelledby="kpi-heading">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="kpi-heading" className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Monitoring summary
        </h2>
        <p className="text-xs text-slate-500">
          KPIs cover active flagged events only{filtersActive ? ' that match the current filters' : ''}.
        </p>
      </div>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Flagged $0 Events"
          value={String(kpis.flaggedCount)}
          caption={none ? 'Active queue is empty' : `Needs review — ${scope}`}
          definition="Events with a valid date, more than 30 days old, $0 posted, not resolved and not closed."
          accent="bg-rose-500"
          icon={icons.flag}
        />
        <KpiCard
          label="High-Priority Events"
          value={String(kpis.highPriorityCount)}
          caption={none ? 'No flagged events' : `of ${kpis.flaggedCount} ${scope}`}
          definition="Flagged events with a staff-assigned (demonstration) priority of High."
          accent="bg-red-600"
          icon={icons.alert}
        />
        <KpiCard
          label="Events Awaiting Processing"
          value={String(kpis.awaitingProcessingCount)}
          caption={none ? 'No flagged events' : 'Bank or check processing pending — still in queue'}
          definition="Flagged events whose review status is Awaiting Bank or Check Processing. These remain in the active queue."
          accent="bg-sky-500"
          icon={icons.bank}
        />
        <KpiCard
          label="Average Days Since Event"
          value={kpis.averageDaysSinceEvent === null ? '—' : kpis.averageDaysSinceEvent.toFixed(1)}
          caption={kpis.averageDaysSinceEvent === null ? 'No data — no flagged events' : `Mean age of ${scope}`}
          definition="Average whole days between each flagged event's date and the as-of date."
          accent="bg-slate-500"
          icon={icons.clock}
        />
      </dl>
    </section>
  );
}
