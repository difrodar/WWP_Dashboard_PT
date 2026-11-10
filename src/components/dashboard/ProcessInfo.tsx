export function ProcessInfo() {
  return (
    <details className="group rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-brand-600">
        <span className="flex items-center gap-2">
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 text-brand-600" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
          </svg>
          How monitoring works
        </span>
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </summary>
      <div className="grid gap-4 border-t border-slate-200 px-4 py-4 text-sm text-slate-700 md:grid-cols-3">
        <div>
          <h3 className="font-semibold text-slate-900">3.0 Monitor Fundraising Activity</h3>
          <p className="mt-1">
            An event is flagged <strong>Needs Review</strong> only when it has a valid date, is <strong>more than 30 days</strong> past
            the as-of date, shows exactly <strong>$0</strong> posted, and is neither resolved nor closed. Exactly 30 days is not flagged.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">4.0 Investigate and Prioritize</h3>
          <p className="mt-1">
            $0 does not mean funds are missing. Offline checks, advisory boards, post-event giving, attribution mismatches, other WWP pages,
            or third-party apps can all explain it. Staff decide — the dashboard only surfaces cases.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">5.0 Contact and Follow Up</h3>
          <p className="mt-1">
            Open an event to record notes, assign a specialist, set a next-action date, and update status. Resolved or closed events leave the
            active queue but stay visible under <em>All Events</em>.
          </p>
        </div>
      </div>
    </details>
  );
}
