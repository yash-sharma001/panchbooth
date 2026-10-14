"use client";

import { useEffect } from "react";
import type { Toast } from "@/hooks/useGame";

export function ToastView({ toast, onDismiss }: { toast: Toast | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3600);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;
  return (
    <div
      role="status"
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-lg ${
        toast.kind === "error"
          ? "border-asura/50 bg-asura/15 text-asura"
          : "border-line bg-panel-2 text-ink"
      }`}
    >
      {toast.msg}
    </div>
  );
}
