"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { LogoMark } from "@/components/ui/AppHeader";
import { buttonClass } from "@/components/ui/Button";
import { ResumeButton } from "./ResumeButton";

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const MENU: { key: "rules" | "hands" | "stats" | "settings"; href: string; icon: ReactNode }[] = [
  {
    key: "rules",
    href: "/rules",
    icon: (
      <svg {...iconProps}>
        <path d="M4 4.5h4.5A1.5 1.5 0 0 1 10 6v10a1.5 1.5 0 0 0-1.5-1.5H4zM16 4.5h-4.5A1.5 1.5 0 0 0 10 6v10a1.5 1.5 0 0 1 1.5-1.5H16z" />
      </svg>
    ),
  },
  {
    key: "hands",
    href: "/hands",
    icon: (
      <svg {...iconProps}>
        <path d="M4 5h12M4 10h8M4 15h5" />
      </svg>
    ),
  },
  {
    key: "stats",
    href: "/stats",
    icon: (
      <svg {...iconProps}>
        <path d="M4 16V9M10 16V4M16 16v-5" />
      </svg>
    ),
  },
  {
    key: "settings",
    href: "/settings",
    icon: (
      <svg {...iconProps}>
        <path d="M4 6h8M15 6h1M4 14h2M9 14h7" />
        <circle cx="13.5" cy="6" r="1.5" />
        <circle cx="7.5" cy="14" r="1.5" />
      </svg>
    ),
  },
];

function DecorCard({ rank, suit, red, className = "" }: { rank: string; suit: string; red?: boolean; className?: string }) {
  return (
    <div
      className={`flex h-[112px] w-[80px] flex-col justify-between rounded-[10px] border border-line bg-white px-2.5 py-2 font-bold shadow-[0_2px_6px_rgba(0,0,0,.18)] sm:h-[136px] sm:w-[96px] ${
        red ? "text-[#b4443c]" : "text-[#1f2328]"
      } ${className}`}
    >
      <span className="text-2xl leading-none sm:text-3xl">{rank}</span>
      {/* U+FE0E: 絵文字ではなく文字として表示させる */}
      <span className="self-end text-[32px] leading-none sm:text-[40px]">
        {suit}
        {"︎"}
      </span>
    </div>
  );
}

export function TopScreen() {
  const { t, href } = useI18n();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-10">
        <div className="flex items-center gap-2.5 text-lg font-bold">
          <LogoMark />
          Poker Lesson
        </div>
        <Link
          href={t.common.languageSwitch.href}
          hrefLang={t.locale === "ja" ? "en" : "ja"}
          className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-background hover:text-foreground"
        >
          {t.common.languageSwitch.label}
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-12 px-4 py-10 sm:gap-18 sm:px-10 sm:py-18">
        <section className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div className="flex flex-col gap-5">
            <span className="text-sm font-medium text-muted">{t.top.kicker}</span>
            <h1 className="text-4xl leading-tight font-bold sm:text-[56px]">Poker Lesson</h1>
            <p className="text-base leading-[1.8] text-pretty text-muted sm:text-lg">
              {t.top.lead[0]}
              <br className="hidden sm:inline" /> {t.top.lead[1]}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href={href("/play")} className={buttonClass("primary", "lg", "px-9")}>
                {t.top.start}
              </Link>
              <Link href={href("/practice")} className={buttonClass("secondary", "lg", "px-7")}>
                {t.practice.title}
              </Link>
              <ResumeButton />
            </div>
          </div>

          <div className="flex h-[260px] items-center justify-center rounded-3xl bg-felt shadow-[inset_0_0_0_10px_var(--felt-rim)] sm:h-[340px]" aria-hidden>
            <DecorCard rank="A" suit="♠" className="translate-x-[18px] translate-y-[10px] -rotate-12" />
            <DecorCard rank="K" suit="♥" red className="z-10 -translate-y-1.5" />
            <DecorCard rank="Q" suit="♦" red className="z-20 -translate-x-[18px] translate-y-[10px] rotate-12" />
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MENU.map((item) => (
            <Link
              key={item.key}
              href={href(item.href)}
              className="flex items-start gap-3.5 rounded-xl border border-border bg-surface p-5 transition hover:border-line hover:shadow-[0_2px_8px_rgba(0,0,0,.06)]"
            >
              <span className="text-felt">{item.icon}</span>
              <div className="flex flex-col gap-1">
                <span className="text-[15px] font-bold">{t.top.menu[item.key].title}</span>
                <span className="text-[13px] text-muted">{t.top.menu[item.key].description}</span>
              </div>
            </Link>
          ))}
        </section>
      </main>

      <footer className="px-4 py-6 text-center text-[13px] text-muted">{t.common.disclaimer}</footer>
    </div>
  );
}
