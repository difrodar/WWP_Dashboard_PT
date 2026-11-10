import type { ISODate } from '../../types/event';
import { formatLongDate, isValidISODate } from '../../utils/dateUtils';
import { DEMO_AS_OF_DATE } from '../../data/mockEvents';

interface AppHeaderProps {
  asOfDate: ISODate;
  onAsOfDateChange: (date: ISODate) => void;
  onResetDemo: () => void;
}

export function AppHeader({ asOfDate, onAsOfDateChange, onResetDemo }: AppHeaderProps) {
  const isDemoDate = asOfDate === DEMO_AS_OF_DATE;

  return (
    <header>
      <div className="bg-brand-900 text-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 17l5-5 4 3 7-8" />
                <circle cx="20" cy="7" r="1.5" fill="#fbbf24" stroke="none" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Community Fundraising Monitor</h1>
              <p className="text-sm text-brand-200">$0 event review &amp; follow-up · MIS 306F Team 10 prototype</p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="as-of-date" className="mb-1 block text-xs font-medium text-brand-200">
                As-of date
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="as-of-date"
                  type="date"
                  value={asOfDate}
                  onChange={(e) => isValidISODate(e.target.value) && onAsOfDateChange(e.target.value)}
                  aria-describedby="as-of-date-display"
                  className="rounded-md border-0 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-white/30 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
                {!isDemoDate && (
                  <button
                    type="button"
                    onClick={() => onAsOfDateChange(DEMO_AS_OF_DATE)}
                    className="rounded-md px-2 py-1.5 text-xs font-medium text-brand-100 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-amber-400"
                  >
                    Use demo date
                  </button>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onResetDemo}
              className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3.5 py-2 text-sm font-medium text-white ring-1 ring-inset ring-white/30 transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 10a6.5 6.5 0 1 0 1.9-4.6M3.5 3.5v3h3" />
              </svg>
              Reset Demo Data
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-amber-300 bg-amber-50">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2.5 sm:px-6 lg:px-8">
          <p className="flex items-start gap-2 text-sm text-amber-900" role="note">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span>
              <strong className="font-semibold">Academic Prototype — Synthetic Data Only.</strong> Not connected to WWP, Salesforce, or DonorDrive systems.
            </span>
          </p>
          <p id="as-of-date-display" className="text-sm text-amber-900">
            Showing results as of <strong className="font-semibold">{formatLongDate(asOfDate)}</strong>
            {isDemoDate ? ' (demo date)' : ' (custom date)'}
          </p>
        </div>
      </div>
    </header>
  );
}
