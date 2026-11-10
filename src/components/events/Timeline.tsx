import type { TimelineEntry, TimelineEntryType } from '../../types/event';
import { compareISODates, formatDate } from '../../utils/dateUtils';

const TYPE_META: Record<TimelineEntryType, { label: string; dot: string }> = {
  registration: { label: 'Registration', dot: 'bg-slate-400' },
  event: { label: 'Event', dot: 'bg-brand-600' },
  review: { label: 'Monitoring review', dot: 'bg-rose-500' },
  processing: { label: 'Processing', dot: 'bg-sky-500' },
  assignment: { label: 'Assignment', dot: 'bg-indigo-500' },
  status: { label: 'Status update', dot: 'bg-amber-500' },
  priority: { label: 'Priority', dot: 'bg-orange-500' },
  note: { label: 'Follow-up note', dot: 'bg-teal-500' },
  scheduling: { label: 'Next action', dot: 'bg-cyan-600' },
  resolution: { label: 'Resolution', dot: 'bg-emerald-600' },
  closure: { label: 'Closure', dot: 'bg-slate-600' },
  'data-quality': { label: 'Data quality', dot: 'bg-violet-500' },
};

/** Chronological (oldest first); entries on the same date keep their recorded order. */
export function sortTimeline(entries: TimelineEntry[]): TimelineEntry[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => compareISODates(a.entry.date, b.entry.date) || a.index - b.index)
    .map(({ entry }) => entry);
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const sorted = sortTimeline(entries);
  if (sorted.length === 0) return <p className="text-sm text-slate-500">No activity recorded.</p>;

  return (
    <ol className="relative ml-1.5 border-l border-slate-200" aria-label="Event activity timeline">
      {sorted.map((entry) => {
        const meta = TYPE_META[entry.type];
        return (
          <li key={entry.id} className="relative pb-4 pl-5 last:pb-0">
            <span aria-hidden="true" className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${meta.dot}`} />
            <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-slate-500">
              <time dateTime={entry.date} className="font-medium text-slate-700">
                {formatDate(entry.date)}
              </time>
              <span>· {meta.label}</span>
              {entry.isDemoAction && (
                <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 ring-1 ring-inset ring-brand-200">
                  Demo action
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-slate-800">{entry.description}</p>
            <p className="text-xs text-slate-500">{entry.actor}</p>
          </li>
        );
      })}
    </ol>
  );
}
