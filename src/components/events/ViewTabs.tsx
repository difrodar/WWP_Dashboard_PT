import type { KeyboardEvent } from 'react';
import type { ViewMode } from '../../utils/eventFilters';

interface ViewTabsProps {
  view: ViewMode;
  counts: Record<ViewMode, number>;
  onChange: (view: ViewMode) => void;
}

const TABS: Array<{ id: ViewMode; label: string }> = [
  { id: 'queue', label: 'Active Flagged Queue' },
  { id: 'data-quality', label: 'Data-Quality Exceptions' },
  { id: 'all', label: 'All Events' },
];

export function ViewTabs({ view, counts, onChange }: ViewTabsProps) {
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = TABS[(index + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    onChange(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };

  return (
    <div role="tablist" aria-label="Event views" className="flex flex-wrap gap-1 border-b border-slate-200">
      {TABS.map((tab, i) => {
        const selected = tab.id === view;
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls="events-panel"
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-600 ${
              selected ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-800'
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                selected ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {counts[tab.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
