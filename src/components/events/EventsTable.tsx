import type { ReactNode } from 'react';
import type { FundraisingEvent, ISODate } from '../../types/event';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency, formatWeeks } from '../../utils/format';
import {
  getDaysSinceEvent,
  getMonitoringResult,
  isFlagged,
  isNextActionOverdue,
  suggestedNextStep,
} from '../../utils/eventRules';
import type { SortKey, SortState, ViewMode } from '../../utils/eventFilters';
import { MonitoringBadge, PriorityBadge, StatusBadge } from '../shared/Badges';

interface EventsTableProps {
  events: FundraisingEvent[];
  asOfDate: ISODate;
  view: ViewMode;
  sort: SortState;
  selectedId: string | null;
  onSortChange: (key: SortKey) => void;
  onSelect: (id: string) => void;
}

function SortHeader({ label, sortKey, sort, onSortChange, className = '' }: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSortChange: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  const ariaSort = active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';
  return (
    <th scope="col" aria-sort={ariaSort} className={`px-3 py-2.5 ${className}`}>
      <button
        type="button"
        onClick={() => onSortChange(sortKey)}
        className={`group inline-flex items-center gap-1 rounded text-left font-semibold uppercase tracking-wide hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-600 ${
          active ? 'text-brand-800' : ''
        }`}
      >
        {label}
        <span aria-hidden="true" className={`text-[10px] ${active ? 'text-brand-700' : 'text-slate-300 group-hover:text-slate-400'}`}>
          {active ? (sort.direction === 'asc' ? '▲' : '▼') : '↕'}
        </span>
        <span className="sr-only">{active ? '' : ', sortable'}</span>
      </button>
    </th>
  );
}

const Plain = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <th scope="col" className={`px-3 py-2.5 font-semibold uppercase tracking-wide ${className}`}>
    {children}
  </th>
);

export function EventsTable({ events, asOfDate, view, sort, selectedId, onSortChange, onSelect }: EventsTableProps) {
  const showMonitoring = view !== 'queue';

  return (
    // `relative` keeps absolutely-positioned sr-only text inside the scroll container (prevents page overflow on mobile).
    <div className="relative overflow-x-auto">
      <table className="min-w-[1180px] w-full border-separate border-spacing-0 text-sm">
        <caption className="sr-only">
          Fundraising events. Select an event name to open its details.
        </caption>
        <thead className="bg-slate-50 text-left text-xs text-slate-600">
          <tr className="[&>th]:border-b [&>th]:border-slate-200">
            <SortHeader label="Event Name" sortKey="eventName" sort={sort} onSortChange={onSortChange} className="sticky left-0 z-10 bg-slate-50" />
            {showMonitoring && <Plain>Monitoring Result</Plain>}
            <Plain>Host Name</Plain>
            <SortHeader label="Event Date" sortKey="eventDate" sort={sort} onSortChange={onSortChange} />
            <Plain>Event Type</Plain>
            <Plain className="text-right">Amount Raised</Plain>
            <SortHeader label="Days Since Event" sortKey="daysSinceEvent" sort={sort} onSortChange={onSortChange} />
            <Plain>Review Status</Plain>
            <SortHeader label="Priority" sortKey="priority" sort={sort} onSortChange={onSortChange} />
            <Plain>Assigned Specialist</Plain>
            <Plain>Next Action</Plain>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const days = getDaysSinceEvent(event, asOfDate);
            const flagged = isFlagged(event, asOfDate);
            const overdue = isNextActionOverdue(event, asOfDate);
            const selected = event.id === selectedId;
            return (
              <tr
                key={event.id}
                onClick={() => onSelect(event.id)}
                className={`cursor-pointer align-top transition-colors [&>td]:border-b [&>td]:border-slate-100 ${
                  selected ? 'bg-brand-50' : 'bg-white hover:bg-slate-50'
                }`}
              >
                <td className={`sticky left-0 z-[1] max-w-[260px] px-3 py-3 ${selected ? 'bg-brand-50' : 'bg-inherit'}`}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(event.id);
                    }}
                    className="text-left font-medium text-brand-800 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600 rounded"
                  >
                    {event.eventName}
                  </button>
                  <div className="mt-0.5 text-xs text-slate-500">{event.id}</div>
                </td>
                {showMonitoring && (
                  <td className="px-3 py-3">
                    <MonitoringBadge result={getMonitoringResult(event, asOfDate)} />
                  </td>
                )}
                <td className="px-3 py-3 text-slate-700">{event.hostName}</td>
                <td className="whitespace-nowrap px-3 py-3 text-slate-700">
                  {event.eventDate ? formatDate(event.eventDate) : <span className="italic text-violet-700">Missing date</span>}
                </td>
                <td className="px-3 py-3 text-slate-700">{event.eventType}</td>
                <td className={`whitespace-nowrap px-3 py-3 text-right tabular-nums ${flagged ? 'font-semibold text-rose-700' : 'text-slate-700'}`}>
                  {formatCurrency(event.amountRaised)}
                </td>
                <td className="whitespace-nowrap px-3 py-3 tabular-nums text-slate-700">
                  {days === null ? (
                    <span className="text-slate-400">N/A</span>
                  ) : days < 0 ? (
                    <span className="text-slate-500">Upcoming (in {-days})</span>
                  ) : (
                    <>
                      {days}
                      <span className="text-xs text-slate-500"> · {formatWeeks(days)}</span>
                    </>
                  )}
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={event.reviewStatus} />
                </td>
                <td className="px-3 py-3">
                  <PriorityBadge priority={event.priority} />
                </td>
                <td className="px-3 py-3 text-slate-700">{event.assignedSpecialist ?? <span className="text-slate-400">Unassigned</span>}</td>
                <td className="px-3 py-3">
                  <div className={`whitespace-nowrap ${overdue ? 'font-medium text-red-700' : 'text-slate-700'}`}>
                    {event.nextActionDate ? formatDate(event.nextActionDate) : <span className="text-slate-400">Not scheduled</span>}
                    {overdue && (
                      <span className="ml-1.5 rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-red-800">Overdue</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">{suggestedNextStep(event)}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
