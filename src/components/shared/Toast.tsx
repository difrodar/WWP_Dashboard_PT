export interface ToastMessage {
  id: number;
  text: string;
}

/** Polite live region so screen readers announce saved changes. */
export function Toast({ toast, onDismiss }: { toast: ToastMessage | null; onDismiss: () => void }) {
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
      {toast && (
        <div
          key={toast.id}
          className="pointer-events-auto flex max-w-lg items-center gap-3 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-emerald-400" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={onDismiss}
            className="ml-2 rounded px-1 text-slate-300 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
