import { useState, type FormEvent } from 'react';
import type { FundraisingEvent, ISODate } from '../../types/event';
import { PRIORITIES, PROCESSING_STATUSES, REVIEW_REASONS, REVIEW_STATUSES, RESOLVED_STATUS, AWAITING_PROCESSING_STATUS } from '../../types/event';
import type { CaseUpdate } from '../../utils/eventActions';
import { formatDate } from '../../utils/dateUtils';
import { btn, inputClass, labelClass } from '../shared/buttonStyles';

interface CaseManagementProps {
  event: FundraisingEvent;
  asOfDate: ISODate;
  specialists: string[];
  onSave: (update: CaseUpdate) => void;
  onMarkAwaitingProcessing: () => void;
  onMarkResolved: () => void;
  onReopen: () => void;
  onToggleClosed: () => void;
}

const toForm = (e: FundraisingEvent): CaseUpdate => ({
  reviewStatus: e.reviewStatus,
  reviewReason: e.reviewReason,
  processingStatus: e.processingStatus,
  priority: e.priority,
  assignedSpecialist: e.assignedSpecialist,
  nextActionDate: e.nextActionDate,
});

/**
 * Process 4.0 / 5.0 controls. The parent remounts this component (via `key`)
 * whenever the event changes, so the form always starts from saved values.
 */
export function CaseManagement(props: CaseManagementProps) {
  const { event, asOfDate, specialists, onSave } = props;
  const [form, setForm] = useState<CaseUpdate>(() => toForm(event));
  const saved = toForm(event);
  const dirty = (Object.keys(saved) as Array<keyof CaseUpdate>).some((k) => (form[k] ?? null) !== (saved[k] ?? null));
  const resolved = event.reviewStatus === RESOLVED_STATUS;
  const awaiting = event.reviewStatus === AWAITING_PROCESSING_STATUS;

  const set = <K extends keyof CaseUpdate>(key: K, value: CaseUpdate[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (dirty) onSave(form);
  };

  const specialistOptions = event.assignedSpecialist && !specialists.includes(event.assignedSpecialist)
    ? [...specialists, event.assignedSpecialist]
    : specialists;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Quick actions">
        <button type="button" className={btn.secondary} onClick={props.onMarkAwaitingProcessing} disabled={dirty || awaiting || event.isClosed}>
          Mark Awaiting Processing
        </button>
        {resolved ? (
          <button type="button" className={btn.secondary} onClick={props.onReopen} disabled={dirty}>
            Reopen Case
          </button>
        ) : (
          <button type="button" className={btn.success} onClick={props.onMarkResolved} disabled={dirty}>
            Mark Resolved
          </button>
        )}
        <button type="button" className={btn.secondary} onClick={props.onToggleClosed} disabled={dirty}>
          {event.isClosed ? 'Reopen Record' : 'Close Record'}
        </button>
      </div>
      {dirty && <p className="text-xs text-amber-700">Save or discard the edits below before using quick actions.</p>}

      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Update case">
        <div>
          <label htmlFor="cm-status" className={labelClass}>
            Review status
          </label>
          <select id="cm-status" className={inputClass} value={form.reviewStatus} onChange={(e) => set('reviewStatus', e.target.value as CaseUpdate['reviewStatus'])}>
            {REVIEW_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cm-reason" className={labelClass}>
            Review reason
          </label>
          <select id="cm-reason" className={inputClass} value={form.reviewReason} onChange={(e) => set('reviewReason', e.target.value as CaseUpdate['reviewReason'])}>
            {REVIEW_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cm-specialist" className={labelClass}>
            Assigned specialist
          </label>
          <select
            id="cm-specialist"
            className={inputClass}
            value={form.assignedSpecialist ?? ''}
            onChange={(e) => set('assignedSpecialist', e.target.value || null)}
          >
            <option value="">Unassigned</option>
            {specialistOptions.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cm-priority" className={labelClass}>
            Priority
          </label>
          <select id="cm-priority" className={inputClass} value={form.priority} onChange={(e) => set('priority', e.target.value as CaseUpdate['priority'])}>
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cm-processing" className={labelClass}>
            Processing status
          </label>
          <select
            id="cm-processing"
            className={inputClass}
            value={form.processingStatus}
            onChange={(e) => set('processingStatus', e.target.value as CaseUpdate['processingStatus'])}
          >
            {PROCESSING_STATUSES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cm-next" className={labelClass}>
            Next action date
          </label>
          <input
            id="cm-next"
            type="date"
            className={inputClass}
            value={form.nextActionDate ?? ''}
            onChange={(e) => set('nextActionDate', e.target.value || null)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
          <button type="submit" className={btn.primary} disabled={!dirty}>
            Save changes
          </button>
          <button type="button" className={btn.secondary} disabled={!dirty} onClick={() => setForm(toForm(event))}>
            Discard
          </button>
          <span className="text-xs text-slate-500">Changes are recorded in the timeline as demo actions dated {formatDate(asOfDate)} (the as-of date).</span>
        </div>
      </form>
    </div>
  );
}
