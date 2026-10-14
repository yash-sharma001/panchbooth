"use client";

export function PanelShell({
  title,
  onClose,
  children
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-3 z-20 flex flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg px-2 py-0.5 text-lg leading-none text-ink-dim hover:bg-panel-2"
        >
          &times;
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  );
}
