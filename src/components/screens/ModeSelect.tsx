"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Mode } from "@/engine/types";
import { useI18n } from "@/i18n/I18nProvider";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";

const MODES: Mode[] = ["beginner", "pro"];

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="var(--felt)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      <path d="m5 10.5 3 3 7-7" />
    </svg>
  );
}

export function ModeSelect() {
  const { t, href } = useI18n();
  const router = useRouter();
  const updateDraft = useGameStore((s) => s.updateDraft);
  const tutorialDone = useSettingsStore((s) => s.tutorialDone);

  const choose = (mode: Mode) => {
    updateDraft({ mode });
    // 初心者モードを初めて選んだときは、3ハンドの練習から
    router.push(href(mode === "beginner" && !tutorialDone ? "/tutorial" : "/play/setup"));
  };

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader back={{ href: href("/"), label: t.common.back }} />
      <main className="mx-auto flex w-full max-w-[960px] flex-col gap-8 px-4 py-10 sm:gap-10 sm:py-18">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <h1 className="text-[28px] font-bold sm:text-[32px]">{t.modeSelect.title}</h1>
          <p className="text-[15px] text-muted">{t.modeSelect.subtitle}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {MODES.map((mode) => {
            const primary = mode === "beginner";
            const info = t.modeSelect.modes[mode];
            const title = t.common.modeNames[mode];
            return (
              <section
                key={mode}
                className={`flex flex-col gap-5 rounded-2xl bg-surface p-6 sm:p-8 ${primary ? "border-2 border-accent" : "border border-border"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold">{title}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${primary ? "bg-accent-soft text-accent" : "bg-chip text-muted"}`}>
                    {info.tag}
                  </span>
                </div>
                <p className="text-[15px] leading-relaxed text-muted">{info.description}</p>
                <ul className="flex flex-col gap-3">
                  {info.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-[15px]">
                      <CheckIcon />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant={primary ? "primary" : "secondary"} size="lg" className="mt-2 w-full" onClick={() => choose(mode)}>
                  {t.modeSelect.playWith(title)}
                </Button>
              </section>
            );
          })}
        </div>
        <p className="text-center text-[13px] text-muted">
          {tutorialDone ? (
            <Link href={href("/tutorial")} className="text-accent underline-offset-4 hover:underline">
              {t.modeSelect.tutorialAgain}
            </Link>
          ) : (
            t.modeSelect.tutorialFirst
          )}
        </p>
      </main>
    </div>
  );
}
