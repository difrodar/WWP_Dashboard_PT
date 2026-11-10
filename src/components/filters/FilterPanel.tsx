import type { ChangeEvent } from 'react';
import { ALL, DEFAULT_FILTERS, UNASSIGNED, type FilterOptions, type FilterState } from '../../utils/eventFilters';
import { formatDate } from '../../utils/dateUtils';
import { btn, inputClass, labelClass } from '../shared/buttonStyles';

interface FilterPanelProps {
  filters: FilterState;
  options: FilterOptions;
  activeCount: number;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

const FILTER_LABELS: Record<keyof FilterState, string> = {
  search: 'Search',
  minDays: 'Min. days',
  eventType: 'Type',
  reviewStatus: 'Status',
  reviewReason: 'Reason',
  specialist: 'Specialist',
  priority: 'Priority',
  dateFrom: 'From',
  dateTo: 'To',
};

function chipValue(key: keyof FilterState, value: string): string {
  if (key === 'specialist' && value === UNASSIGNED) return 'Unassigned';
  if (key === 'dateFrom' || key === 'dateTo') return formatDate(value);
  if (key === 'minDays') return `≥ ${value}`;
  if (key === 'search') return `“${value}”`;
  return value;
}

export function FilterPanel({ filters, options, activeCount, onChange, onReset }: FilterPanelProps) {
  const set =
    (key: keyof FilterState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...filters, [key]: e.target.value } as FilterState);

  const activeKeys = (Object.keys(DEFAULT_FILTERS) as Array<keyof FilterState>).filter(
    (k) => filters[k].trim() !== DEFAULT_FILTERS[k],
  );

  return (
    <section aria-labelledby="filters-heading" className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="filters-heading" className="text-sm font-semibold text-slate-900">
          Filters
          {activeCount > 0 && (
            <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800">{activeCount} active</span>
          )}
        </h2>
        <button type="button" className={btn.ghost} onClick={onReset} disabled={activeCount === 0}>
          Reset filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <div className="sm:col-span-2 lg:col-span-2 2xl:col-span-2">
          <label htmlFor="f-search" className={labelClass}>
            Search event or host
          </label>
          <input id="f-search" type="search" className={inputClass} placeholder="e.g. Golf, Pruitt, CFM-1004" value={filters.search} onChange={set('search')} />
        </div>
        <div>
          <label htmlFor="f-min-days" className={labelClass}>
            Min. days since event
          </label>
          <input
            id="f-min-days"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            className={inputClass}
            placeholder="Any"
            value={filters.minDays}
            onChange={set('minDays')}
            aria-describedby="f-min-days-help"
          />
          <p id="f-min-days-help" className="sr-only">
            Narrows the list only. It does not change the 30-day flagging rule.
          </p>
        </div>
        <div>
          <label htmlFor="f-type" className={labelClass}>
            Event type
          </label>
          <select id="f-type" className={inputClass} value={filters.eventType} onChange={set('eventType')}>
            <option value={ALL}>All types</option>
            {options.eventTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-status" className={labelClass}>
            Review status
          </label>
          <select id="f-status" className={inputClass} value={filters.reviewStatus} onChange={set('reviewStatus')}>
            <option value={ALL}>All statuses</option>
            {options.reviewStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-reason" className={labelClass}>
            Review reason
          </label>
          <select id="f-reason" className={inputClass} value={filters.reviewReason} onChange={set('reviewReason')}>
            <option value={ALL}>All reasons</option>
            {options.reviewReasons.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-specialist" className={labelClass}>
            Assigned specialist
          </label>
          <select id="f-specialist" className={inputClass} value={filters.specialist} onChange={set('specialist')}>
            <option value={ALL}>All specialists</option>
            <option value={UNASSIGNED}>Unassigned</option>
            {options.specialists.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-priority" className={labelClass}>
            Priority
          </label>
          <select id="f-priority" className={inputClass} value={filters.priority} onChange={set('priority')}>
            <option value={ALL}>All priorities</option>
            {options.priorities.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <fieldset className="min-w-0 sm:col-span-2 lg:col-span-2 2xl:col-span-2">
          <legend className={labelClass}>Event date range</legend>
          <div className="flex items-center gap-2">
            <label htmlFor="f-from" className="sr-only">
              Event date from
            </label>
            <input id="f-from" type="date" className={`${inputClass} min-w-0`} value={filters.dateFrom} max={filters.dateTo || undefined} onChange={set('dateFrom')} />
            <span className="text-xs text-slate-500" aria-hidden="true">
              to
            </span>
            <label htmlFor="f-to" className="sr-only">
              Event date to
            </label>
            <input id="f-to" type="date" className={`${inputClass} min-w-0`} value={filters.dateTo} min={filters.dateFrom || undefined} onChange={set('dateTo')} />
          </div>
        </fieldset>
      </div>

      {activeKeys.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Active filters">
          {activeKeys.map((key) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => onChange({ ...filters, [key]: DEFAULT_FILTERS[key] })}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-800 ring-1 ring-inset ring-brand-200 hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-brand-600"
                aria-label={`Remove filter ${FILTER_LABELS[key]}: ${chipValue(key, filters[key])}`}
              >
                <span className="font-medium">{FILTER_LABELS[key]}:</span> {chipValue(key, filters[key])}
                <span aria-hidden="true" className="ml-0.5 text-brand-500">
                  ×
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
