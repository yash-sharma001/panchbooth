"use client";

export function Modal({
  title,
  onClose,
  onSubmit,
  submitLabel = "Confirm",
  submitDisabled,
  children
}: {
  title: string;
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal
        className="w-full max-w-md rounded-2xl border border-line bg-panel p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg px-2 py-0.5 text-lg leading-none text-ink-dim hover:bg-panel-2"
          >
            &times;
          </button>
        </div>
        <div className="space-y-3 text-sm">{children}</div>
        {onSubmit && (
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-accent"
              disabled={submitDisabled}
              onClick={onSubmit}
            >
              {submitLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
