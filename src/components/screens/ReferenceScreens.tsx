"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { HandRankingList } from "@/components/guide/HandRankingList";
import { RulesContent } from "@/components/guide/RulesContent";
import { AppHeader } from "@/components/ui/AppHeader";
import { buttonClass } from "@/components/ui/Button";

export function HandsScreen() {
  const { t, href } = useI18n();
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader back={{ href: href("/"), label: t.common.back }} />
      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-8 sm:py-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] font-bold">{t.meta.titles.hands}</h1>
          <p className="text-[15px] text-muted">{t.handRanking.pageLead}</p>
        </div>
        <HandRankingList />
      </main>
    </div>
  );
}

export function RulesScreen() {
  const { t, href } = useI18n();
  const buttons = t.rules.pageButtons;
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader back={{ href: href("/"), label: t.common.back }} />
      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-8 sm:py-12">
        <h1 className="text-[28px] font-bold">{t.meta.titles.rules}</h1>
        <RulesContent />
        <div className="flex flex-wrap gap-3 border-t border-border pt-6">
          <Link href={href("/hands")} className={buttonClass("secondary", "lg")}>
            {buttons.hands}
          </Link>
          <Link href={href("/tutorial")} className={buttonClass("secondary", "lg")}>
            {buttons.tutorial}
          </Link>
          <Link href={href("/play")} className={buttonClass("primary", "lg")}>
            {buttons.play}
          </Link>
        </div>
      </main>
    </div>
  );
}
