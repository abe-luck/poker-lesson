"use client";

import type { Card, Suit } from "@/engine/types";
import { rankLabel } from "@/i18n";
import { useI18n } from "@/i18n/I18nProvider";

const SUIT_SYMBOLS: Record<Suit, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };

export type CardSize = "sm" | "md" | "lg";

const box: Record<CardSize, string> = {
  sm: "h-[48px] w-[34px] rounded-[5px] px-1 py-0.5",
  md: "h-[70px] w-[50px] rounded-[6px] px-1.5 py-1 sm:h-[84px] sm:w-[60px] sm:px-2 sm:py-1.5",
  lg: "h-[84px] w-[60px] rounded-[7px] px-2 py-1.5 sm:h-[96px] sm:w-[68px]",
};

const rankText: Record<CardSize, string> = {
  sm: "text-[13px]",
  md: "text-base sm:text-xl",
  lg: "text-xl sm:text-[22px]",
};

const suitText: Record<CardSize, string> = {
  sm: "text-[15px]",
  md: "text-[22px] sm:text-[26px]",
  lg: "text-[26px] sm:text-[30px]",
};

/** マークの色。4色デッキの設定は CSS 変数で切り替える (globals.css) */
const SUIT_COLOR: Record<Card["suit"], string> = {
  s: "text-(--suit-black)",
  h: "text-(--suit-red)",
  d: "text-(--suit-diamond)",
  c: "text-(--suit-club)",
};

/** animate: テーブルに配られたときだけ動きをつける (一覧や履歴では付けない) */
export function PlayingCard({ card, size = "md", highlight = false, animate = false }: { card: Card; size?: CardSize; highlight?: boolean; animate?: boolean }) {
  const { t } = useI18n();
  return (
    <div
      role="img"
      aria-label={t.cards.cardLabel(t.cards.suitNames[card.suit], rankLabel(card.rank))}
      className={`${animate ? "animate-deal " : ""}flex shrink-0 flex-col justify-between border border-[#d9d9d4] bg-white font-bold shadow-[0_1px_3px_rgba(0,0,0,.2)] ${box[size]} ${
        SUIT_COLOR[card.suit]
      } ${highlight ? "outline-3 outline-offset-2 outline-[#8fb3ff]" : ""}`}
    >
      <span className={`leading-none ${rankText[size]}`}>{rankLabel(card.rank)}</span>
      {/* U+FE0E: 絵文字ではなく文字として表示させる */}
      <span className={`self-end leading-none ${suitText[size]}`}>{SUIT_SYMBOLS[card.suit]}{"︎"}</span>
    </div>
  );
}

export function CardBack({ size = "sm" }: { size?: CardSize }) {
  return (
    <div
      aria-hidden
      className={`shrink-0 border-[1.5px] border-white bg-[repeating-linear-gradient(45deg,#3e4c5e_0_3px,#4a5a6e_3px_6px)] shadow-[0_0_0_1px_#d9d9d4] ${
        size === "sm" ? "h-[32px] w-[22px] rounded-[3px]" : box[size]
      }`}
    />
  );
}

export function CardSlot({ size = "md" }: { size?: CardSize }) {
  return <div aria-hidden className={`shrink-0 border-[1.5px] border-dashed border-white/35 ${box[size]}`} />;
}
