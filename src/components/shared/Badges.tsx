import type { Priority, ReviewStatus } from '../../types/event';
import { MONITORING_RESULT_LABELS, type MonitoringResult } from '../../utils/eventRules';

const base = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset';

const STATUS_STYLES: Record<ReviewStatus, string> = {
  'Needs Review': 'bg-amber-50 text-amber-800 ring-amber-600/25',
  'Awaiting Bank or Check Processing': 'bg-sky-50 text-sky-800 ring-sky-600/25',
  'Awaiting Advisory Board': 'bg-indigo-50 text-indigo-800 ring-indigo-600/25',
  'Post-Event Donations Expected': 'bg-teal-50 text-teal-800 ring-teal-600/25',
  'Host Contact Needed': 'bg-orange-50 text-orange-800 ring-orange-600/25',
  'Data or Attribution Mismatch': 'bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-600/25',
  'Confirmed No Activity': 'bg-slate-100 text-slate-700 ring-slate-500/25',
  'Resolved or Funds Attributed': 'bg-emerald-50 text-emerald-800 ring-emerald-600/25',
};

export function StatusBadge({ status }: { status: ReviewStatus }) {
  return <span className={`${base} ${STATUS_STYLES[status]}`}>{status}</span>;
}

const PRIORITY_STYLES: Record<Priority, { badge: string; dot: string }> = {
  High: { badge: 'bg-red-50 text-red-800 ring-red-600/25', dot: 'bg-red-600' },
  Medium: { badge: 'bg-amber-50 text-amber-800 ring-amber-600/25', dot: 'bg-amber-500' },
  Low: { badge: 'bg-slate-100 text-slate-700 ring-slate-500/25', dot: 'bg-slate-400' },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const s = PRIORITY_STYLES[priority];
  return (
    <span className={`${base} ${s.badge}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {priority}
    </span>
  );
}

const MONITORING_STYLES: Record<MonitoringResult, string> = {
  flagged: 'bg-rose-50 text-rose-800 ring-rose-600/25',
  'data-quality': 'bg-violet-50 text-violet-800 ring-violet-600/25',
  closed: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  resolved: 'bg-emerald-50 text-emerald-800 ring-emerald-600/25',
  'donations-posted': 'bg-slate-100 text-slate-600 ring-slate-500/20',
  'future-event': 'bg-slate-100 text-slate-600 ring-slate-500/20',
  'within-window': 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export function MonitoringBadge({ result }: { result: MonitoringResult }) {
  const { label, detail } = MONITORING_RESULT_LABELS[result];
  return (
    <span className={`${base} ${MONITORING_STYLES[result]}`} title={detail}>
      {label}
    </span>
  );
}
