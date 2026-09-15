import Link from "next/link";
import type { ReactNode } from "react";

export function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12.5 4.5 7 10l5.5 5.5" />
    </svg>
  );
}

export function LogoMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="var(--felt)" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="5" width="9" height="12" rx="1.5" transform="rotate(-10 7.5 11)" />
      <rect x="8" y="3" width="9" height="12" rx="1.5" transform="rotate(8 12.5 9)" />
    </svg>
  );
}

type Props = {
  back?: { href: string; label: string; onClick?: () => void };
  children?: ReactNode;
  right?: ReactNode;
  compact?: boolean;
};

export function AppHeader({ back, children, right, compact }: Props) {
  return (
    <header
      className={`flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 sm:px-6 ${compact ? "h-14" : "h-16"}`}
    >
      <div className="flex min-w-0 items-center gap-3 text-sm sm:gap-4">
        {back ? (
          <Link href={back.href} onClick={back.onClick} className="-ml-1 flex items-center gap-1 rounded px-1 py-1 text-muted hover:text-foreground">
            <ChevronLeftIcon />
            <span>{back.label}</span>
          </Link>
        ) : (
          <Link href="/" className="flex items-center gap-2.5 text-lg font-bold">
            <LogoMark />
            Poker Lesson
          </Link>
        )}
        {children && (
          <>
            <div className="h-5 w-px shrink-0 bg-border" />
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">{children}</div>
          </>
        )}
      </div>
      {right}
    </header>
  );
}
