"use client";

import type { ReactNode } from "react";

export function Segmented<T>({
  label,
  options,
  value,
  format,
  equals = (a, b) => a === b,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  format: (v: T) => string;
  equals?: (a: T, b: T) => boolean;
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-0.5 self-start rounded-lg bg-chip p-[3px] sm:self-auto">
      {options.map((option) => {
        const selected = equals(option, value);
        return (
          <button
            key={format(option)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option)}
            className={`h-[34px] min-w-10 rounded-md px-3.5 text-sm tabular-nums transition ${
              selected ? "bg-surface font-bold text-foreground shadow-[0_1px_2px_rgba(0,0,0,.12)]" : "text-muted hover:text-foreground"
            }`}
          >
            {format(option)}
          </button>
        );
      })}
    </div>
  );
}

export function Row({ label, sub, children }: { label: string; sub?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 py-4 first:border-t-0 sm:min-h-[68px] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-medium">{label}</span>
        {sub && <span className="text-xs text-muted">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

export function RowGroup({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border border-border bg-surface">{children}</div>;
}
