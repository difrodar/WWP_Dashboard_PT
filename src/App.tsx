import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FundraisingEvent } from './types/event';
import { AWAITING_PROCESSING_STATUS } from './types/event';
import { useEventData } from './hooks/useEventData';
import { useTheme } from './hooks/useTheme';
import { MOCK_SPECIALISTS, DEMO_USER } from './data/mockSpecialists';
import { formatLongDate } from './utils/dateUtils';
import { computeKpis } from './utils/dashboardMetrics';
import {
  ALL,
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  SORT_LABELS,
  applyFilters,
  countActiveFilters,
  getEventsForView,
  getFilterOptions,
  sortEvents,
  type FilterState,
  type SortKey,
  type SortState,
  type ViewMode,
} from './utils/eventFilters';
import {
  addNote,
  applyCaseUpdate,
  markAwaitingProcessing,
  markResolved,
  reopenCase,
  setClosed,
  type CaseUpdate,
} from './utils/eventActions';
import { AppHeader } from './components/layout/AppHeader';
import { KpiCards, type KpiShortcut } from './components/dashboard/KpiCards';
import { ProcessInfo } from './components/dashboard/ProcessInfo';
import { FilterPanel } from './components/filters/FilterPanel';
import { ViewTabs } from './components/events/ViewTabs';
import { EventsTable } from './components/events/EventsTable';
import { EventDrawer } from './components/events/EventDrawer';
import { EmptyState } from './components/shared/EmptyState';
import { ConfirmDialog } from './components/shared/ConfirmDialog';
import { Toast, type ToastMessage } from './components/shared/Toast';
import { btn } from './components/shared/buttonStyles';
import { pluralize } from './utils/format';

const DEFAULT_DIRECTION: Record<SortKey, SortState['direction']> = {
  eventName: 'asc',
  eventDate: 'asc',
  daysSinceEvent: 'desc',
  priority: 'desc',
};

const VIEW_INFO: Record<ViewMode, { title: string; description: string; style: string }> = {
  queue: {
    title: 'Active flagged queue',
    description: 'Events with $0 posted more than 30 days after the event date that are not resolved or closed. Each is “Needs Review” — not “Missing Funds.”',
    style: 'border-rose-400 bg-rose-50/60 text-rose-900',
  },
  'data-quality': {
    title: 'Data-quality exceptions',
    description: 'Open records with a missing or invalid event date. The 30-day rule cannot be evaluated, so they are kept out of the standard flagged queue.',
    style: 'border-violet-400 bg-violet-50/60 text-violet-900',
  },
  all: {
    title: 'All synthetic events',
    description: 'Every record, including those not flagged (within 30 days, upcoming, donations posted, resolved, closed). The Monitoring Result column explains each outcome.',
    style: 'border-slate-400 bg-slate-100/70 text-slate-800',
  },
};

export default function App() {
  const { events, asOfDate, setAsOfDate, updateEvent, resetDemo } = useEventData();
  const { theme, setTheme } = useTheme();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [view, setView] = useState<ViewMode>('queue');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string) => setToast({ id: Date.now(), text }), []);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const filterOptions = useMemo(() => getFilterOptions(events, MOCK_SPECIALISTS), [events]);
  const filtered = useMemo(() => applyFilters(events, filters, asOfDate), [events, filters, asOfDate]);
  const kpis = useMemo(() => computeKpis(filtered, asOfDate), [filtered, asOfDate]);
  const counts = useMemo<Record<ViewMode, number>>(
    () => ({
      queue: getEventsForView(filtered, 'queue', asOfDate).length,
      'data-quality': getEventsForView(filtered, 'data-quality', asOfDate).length,
      all: filtered.length,
    }),
    [filtered, asOfDate],
  );
  const totalInView = useMemo(() => getEventsForView(events, view, asOfDate).length, [events, view, asOfDate]);
  const rows = useMemo(() => sortEvents(getEventsForView(filtered, view, asOfDate), sort, asOfDate), [filtered, view, sort, asOfDate]);
  const activeFilterCount = countActiveFilters(filters);
  const selectedEvent = selectedId ? events.find((e) => e.id === selectedId) ?? null : null;

  const handleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, direction: s.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: DEFAULT_DIRECTION[key] }));

  const act = (updater: (e: FundraisingEvent) => FundraisingEvent, message: string) => {
    if (!selectedId) return;
    updateEvent(selectedId, updater);
    showToast(message);
  };

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  // KPI card shortcuts: filter the active queue (High / Awaiting toggle on and off).
  const kpiActive = {
    high: view === 'queue' && filters.priority === 'High',
    awaiting: view === 'queue' && filters.reviewStatus === AWAITING_PROCESSING_STATUS,
  };
  const handleKpiShortcut = (shortcut: KpiShortcut) => {
    let turningOn = true;
    if (shortcut === 'all') {
      setFilters((f) => ({ ...f, priority: ALL, reviewStatus: ALL }));
    } else if (shortcut === 'high') {
      turningOn = !kpiActive.high;
      setFilters((f) => ({ ...f, priority: turningOn ? 'High' : ALL }));
    } else {
      turningOn = !kpiActive.awaiting;
      setFilters((f) => ({ ...f, reviewStatus: turningOn ? AWAITING_PROCESSING_STATUS : ALL }));
    }
    setView('queue');
    // Bring the table into view only when it is mostly off-screen (e.g. on phones).
    const panel = document.getElementById('events-heading')?.parentElement;
    if (turningOn && panel && panel.getBoundingClientRect().top > window.innerHeight * 0.6) {
      panel.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }
  };

  const emptyState = (() => {
    if (activeFilterCount > 0) {
      return (
        <EmptyState
          title="No events match these filters"
          description="Try widening the date range, lowering the minimum days, or clearing filters. The 30-day monitoring rule itself is unchanged."
          action={
            <button type="button" className={btn.primary} onClick={clearFilters}>
              Clear all filters
            </button>
          }
        />
      );
    }
    if (view === 'queue') {
      return (
        <EmptyState
          title="No events currently need review"
          description={`As of ${formatLongDate(asOfDate)}, no open event has $0 posted more than 30 days after its event date.`}
        />
      );
    }
    if (view === 'data-quality') {
      return <EmptyState title="No data-quality exceptions" description="Every open record has a valid event date." />;
    }
    return <EmptyState title="No events" description="The dataset is empty. Use Reset Demo Data to restore the synthetic records." />;
  })();

  const info = VIEW_INFO[view];

  return (
    <div className="min-h-screen bg-canvas">
      <a href="#events-panel" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow">
        Skip to events table
      </a>
      <AppHeader
        asOfDate={asOfDate}
        onAsOfDateChange={setAsOfDate}
        onResetDemo={() => setConfirmReset(true)}
        theme={theme}
        onThemeChange={setTheme}
      />

      <main className="mx-auto max-w-[1440px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <KpiCards kpis={kpis} filtersActive={activeFilterCount > 0} active={kpiActive} onShortcut={handleKpiShortcut} />
        <ProcessInfo />
        <FilterPanel filters={filters} options={filterOptions} activeCount={activeFilterCount} onChange={setFilters} onReset={clearFilters} />

        <section aria-labelledby="events-heading" className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <h2 id="events-heading" className="sr-only">
            Events
          </h2>
          <div className="px-4 pt-2 sm:px-5">
            <ViewTabs view={view} counts={counts} onChange={setView} />
          </div>
          <div id="events-panel" role="tabpanel" aria-labelledby={`tab-${view}`} tabIndex={-1}>
            <div className={`mx-4 mt-4 rounded-md border-l-4 px-3 py-2 text-sm sm:mx-5 ${info.style}`}>
              <strong className="font-semibold">{info.title}.</strong> {info.description}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm text-slate-600 sm:px-5">
              <p aria-live="polite">
                Showing <strong className="text-slate-900">{rows.length}</strong> of {pluralize(totalInView, 'event')}
                {activeFilterCount > 0 && ' (filtered)'}
              </p>
              <p>
                Sorted by <strong className="text-slate-900">{SORT_LABELS[sort.key]}</strong> (
                {sort.direction === 'asc' ? 'ascending' : 'descending'})
                {(sort.key !== DEFAULT_SORT.key || sort.direction !== DEFAULT_SORT.direction) && (
                  <button type="button" className={`${btn.ghost} ml-1`} onClick={() => setSort(DEFAULT_SORT)}>
                    Reset sort
                  </button>
                )}
              </p>
            </div>
            {rows.length === 0 ? (
              <div className="border-t border-slate-200">{emptyState}</div>
            ) : (
              <div className="border-t border-slate-200">
                <EventsTable
                  events={rows}
                  asOfDate={asOfDate}
                  view={view}
                  sort={sort}
                  selectedId={selectedId}
                  onSortChange={handleSort}
                  onSelect={setSelectedId}
                />
              </div>
            )}
          </div>
        </section>

        <footer className="pb-4 text-center text-xs text-slate-500">
          MIS 306F Team 10 · San Diego State University · Academic proof-of-concept with fictional data. Not affiliated with or endorsed by
          Wounded Warrior Project. Demo edits are stored only in this browser.
        </footer>
      </main>

      {selectedEvent && (
        <EventDrawer
          key={selectedEvent.id}
          event={selectedEvent}
          asOfDate={asOfDate}
          specialists={filterOptions.specialists}
          onClose={() => setSelectedId(null)}
          onSaveCase={(update: CaseUpdate) => act((e) => applyCaseUpdate(e, update, asOfDate, DEMO_USER), 'Case updated and recorded in the timeline.')}
          onAddNote={(text) => act((e) => addNote(e, text, asOfDate, DEMO_USER), 'Follow-up note saved.')}
          onMarkAwaitingProcessing={() =>
            act((e) => markAwaitingProcessing(e, asOfDate, DEMO_USER), 'Marked Awaiting Bank or Check Processing — still in the active queue.')
          }
          onMarkResolved={() => act((e) => markResolved(e, asOfDate, DEMO_USER), 'Event marked resolved — removed from the active queue.')}
          onReopen={() => act((e) => reopenCase(e, asOfDate, DEMO_USER), 'Case reopened as Needs Review.')}
          onToggleClosed={() =>
            act(
              (e) => setClosed(e, !e.isClosed, asOfDate, DEMO_USER),
              selectedEvent.isClosed ? 'Record reopened.' : 'Record closed — removed from the active queue.',
            )
          }
        />
      )}

      <ConfirmDialog
        open={confirmReset}
        title="Reset demo data?"
        message="This discards every change made in this browser — statuses, assignments, notes, dates, and the as-of date — and restores the original synthetic dataset. This cannot be undone."
        confirmLabel="Reset demo data"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemo();
          setConfirmReset(false);
          setSelectedId(null);
          setFilters(DEFAULT_FILTERS);
          setSort(DEFAULT_SORT);
          setView('queue');
          showToast('Demo data reset to the original synthetic dataset.');
        }}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
