"use client";

import { useEffect, useId, type ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
};

export function Dialog({ open, title, onClose, children, footer, wide }: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(23,25,28,.5)] sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface shadow-[0_12px_40px_rgba(0,0,0,.25)] sm:rounded-2xl ${wide ? "sm:max-w-[760px]" : "sm:max-w-[520px]"}`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5 sm:px-6">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="閉じる" className="-mr-2 flex size-10 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
              <path d="m5 5 10 10M15 5 5 15" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3.5 sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}
