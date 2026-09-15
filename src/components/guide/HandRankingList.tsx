"use client";

import { parseCards } from "@/engine/cards";
import type { HandCategory } from "@/engine/types";
import { useI18n } from "@/i18n/I18nProvider";
import { PlayingCard } from "@/components/table/PlayingCard";

/** 強い順。example の先頭 keyCount 枚が役を作るカード */
const RANKINGS: { category: HandCategory; example: string; keyCount: number }[] = [
  { category: 9, example: "As Ks Qs Js Ts", keyCount: 5 },
  { category: 8, example: "9h 8h 7h 6h 5h", keyCount: 5 },
  { category: 7, example: "7c 7d 7h 7s Kd", keyCount: 4 },
  { category: 6, example: "Qc Qd Qh 4s 4d", keyCount: 5 },
  { category: 5, example: "Ad Jd 8d 6d 2d", keyCount: 5 },
  { category: 4, example: "Tc 9d 8h 7s 6c", keyCount: 5 },
  { category: 3, example: "8s 8h 8d Kc 3h", keyCount: 3 },
  { category: 2, example: "Jc Jd 5h 5s Ac", keyCount: 4 },
  { category: 1, example: "Ah Ad 9c 6s 3d", keyCount: 2 },
  { category: 0, example: "Kh Jc 8d 5s 2h", keyCount: 1 },
];

export function HandRankingList() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {RANKINGS.map((r, i) => (
          <li key={r.category} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-chip text-xs font-bold text-muted tabular-nums">
                {i + 1}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-bold">{t.hands.categoryNames[r.category]}</span>
                <span className="text-[13px] text-muted">{t.handRanking.descriptions[i]}</span>
              </div>
            </div>
            <div className="flex gap-1 pl-9 sm:pl-0">
              {parseCards(r.example).map((card, j) => (
                <PlayingCard key={j} card={card} size="sm" highlight={j < r.keyCount && r.keyCount < 5} />
              ))}
            </div>
          </li>
        ))}
      </ol>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[13px] leading-relaxed text-muted">
        {t.handRanking.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}
