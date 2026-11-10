import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { FundraisingEvent, ISODate } from '../../types/event';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/format';
import { MONITORING_RESULT_LABELS, getDaysSinceEvent, getMonitoringResult, isNextActionOverdue } from '../../utils/eventRules';
import type { CaseUpdate } from '../../utils/eventActions';
import { MonitoringBadge, PriorityBadge, StatusBadge } from '../shared/Badges';
import { btn, inputClass } from '../shared/buttonStyles';
import { CaseManagement } from './CaseManagement';
import { Timeline } from './Timeline';

export interface DrawerActions {
  onSaveCase: (update: CaseUpdate) => void;
  onAddNote: (text: string) => void;
  onMarkAwaitingProcessing: () => void;
  onMarkResolved: () => void;
  onReopen: () => void;
  onToggleClosed: () => void;
}

interface EventDrawerProps extends DrawerActions {
  event: FundraisingEvent;
  asOfDate: ISODate;
  specialists: string[];
  onClose: () => void;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

function Section({ title, children, id }: { title: string; children: ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="border-t border-slate-200 px-5 py-5 sm:px-6">
      <h3 id={id} className="mb-3 text-sm font-semibold text-slate-900">
        {title}
      </h3>
      {children}
    </section>
  );
}

const muted = (text: string) => <span className="text-slate-400">{text}</span>;

export function EventDrawer({ event, asOfDate, specialists, onClose, ...actions }: EventDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [noteText, setNoteText] = useState('');

  // Focus management: move focus in on open, trap Tab, close on Escape, restore focus on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  const days = getDaysSinceEvent(event, asOfDate);
  const result = getMonitoringResult(event, asOfDate);
  const overdue = isNextActionOverdue(event, asOfDate);
  const notes = [...event.notes].reverse();

  const submitNote = (e: FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    actions.onAddNote(noteText);
    setNoteText('');
  };

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-slate-900/40" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">
              {event.id} · {event.sourceSystem}
            </p>
            <h2 id="drawer-title" className="mt-0.5 text-lg font-semibold text-slate-900">
              {event.eventName}
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <MonitoringBadge result={result} />
              <StatusBadge status={event.reviewStatus} />
              <PriorityBadge priority={event.priority} />
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close event details"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-brand-600"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 sm:px-6">
            <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-inset ring-slate-200">
              <strong className="font-semibold text-slate-700">{MONITORING_RESULT_LABELS[result].label}:</strong>{' '}
              {MONITORING_RESULT_LABELS[result].detail} A $0 total is not proof of missing funds — staff determine the explanation.
            </p>
          </div>

          <Section title="Event details" id="sec-details">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Field label="Host name">{event.hostName}</Field>
              <Field label="Event type">{event.eventType}</Field>
              <Field label="Event date">{event.eventDate ? formatDate(event.eventDate) : <span className="italic text-violet-700">Missing — data-quality review</span>}</Field>
              <Field label="Days since event">
                {days === null ? muted('Not available') : days < 0 ? `Upcoming (in ${-days} days)` : <span className="tabular-nums">{days}</span>}
              </Field>
              <Field label="Posted amount raised">
                <span className={`tabular-nums ${event.amountRaised === 0 ? 'font-semibold text-rose-700' : ''}`}>{formatCurrency(event.amountRaised)}</span>
              </Field>
              <Field label="Fundraising goal">{event.fundraisingGoal === null ? muted('Not set') : formatCurrency(event.fundraisingGoal)}</Field>
              <Field label="Review status">{event.reviewStatus}</Field>
              <Field label="Review reason">{event.reviewReason}</Field>
              <Field label="Priority">{event.priority} <span className="text-xs text-slate-400">(demo)</span></Field>
              <Field label="Assigned specialist">{event.assignedSpecialist ?? muted('Unassigned')}</Field>
              <Field label="Processing status">{event.processingStatus}</Field>
              <Field label="Last reviewed">{event.lastReviewed ? formatDate(event.lastReviewed) : muted('Not yet reviewed')}</Field>
              <Field label="Next action date">
                {event.nextActionDate ? (
                  <span className={overdue ? 'font-medium text-red-700' : ''}>
                    {formatDate(event.nextActionDate)}
                    {overdue && ' (overdue)'}
                  </span>
                ) : (
                  muted('Not scheduled')
                )}
              </Field>
              <Field label="Last updated">{formatDate(event.lastUpdated)}</Field>
              <Field label="Source system">{event.sourceSystem}</Field>
              <Field label="Record state">{event.isClosed ? 'Closed' : 'Open'}</Field>
            </dl>
          </Section>

          <Section title="Investigate & follow up" id="sec-actions">
            <CaseManagement
              key={`${event.id}-${event.timeline.length}`}
              event={event}
              asOfDate={asOfDate}
              specialists={specialists}
              onSave={actions.onSaveCase}
              onMarkAwaitingProcessing={actions.onMarkAwaitingProcessing}
              onMarkResolved={actions.onMarkResolved}
              onReopen={actions.onReopen}
              onToggleClosed={actions.onToggleClosed}
            />
          </Section>

          <Section title={`Follow-up notes (${event.notes.length})`} id="sec-notes">
            <form onSubmit={submitNote} className="mb-4">
              <label htmlFor="note-text" className="sr-only">
                New follow-up note
              </label>
              <textarea
                id="note-text"
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Record what you checked, who you contacted, or what you expect next…"
                className={inputClass}
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs text-slate-500">Notes are stored in this browser only. No message is sent.</p>
                <button type="submit" className={btn.primary} disabled={!noteText.trim()}>
                  Add note
                </button>
              </div>
            </form>
            {notes.length === 0 ? (
              <p className="text-sm text-slate-500">No notes yet.</p>
            ) : (
              <ul className="space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-md bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{n.author}</span>
                      <span>· {formatDate(n.date)}</span>
                      {n.isDemoAction && <span className="text-brand-700">· Added in demo</span>}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{n.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Activity timeline" id="sec-timeline">
            <Timeline entries={event.timeline} />
          </Section>
        </div>
      </div>
    </div>
  );
}
