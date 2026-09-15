"use client";

import { sameCard } from "@/engine/cards";
import type { GameState } from "@/engine/types";
import { reviewHand } from "@/guide/guide";
import { handName, playerName } from "@/i18n";
import { useI18n } from "@/i18n/I18nProvider";
import { PlayingCard } from "@/components/table/PlayingCard";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

type Props = {
  state: GameState;
  open: boolean;
  canContinue: boolean;
  onClose: () => void;
  onNext: () => void;
  onOpenHands: () => void;
};

export function HandReviewDialog({ state, open, canContinue, onClose, onNext, onOpenHands }: Props) {
  const { t } = useI18n();
  const human = state.players.find((p) => p.isHuman);
  const review = human ? reviewHand(t, state, human.id) : null;
  if (!review || !human) return null;

  return (
    <Dialog
      open={open}
      wide
      title={t.review.title(state.handNumber)}
      onClose={onClose}
      footer={
        <>
          <Button size="lg" onClick={onClose}>
            {t.review.viewTable}
          </Button>
          {canContinue && (
            <Button variant="primary" size="lg" onClick={onNext} autoFocus>
              {t.result.nextHand}
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <p className={`text-2xl font-bold ${review.net > 0 ? "text-felt" : ""}`}>{review.title}</p>
          <p className="text-sm text-muted tabular-nums">
            {t.review.net}{" "}
            <span className={`font-bold ${review.net > 0 ? "text-felt" : review.net < 0 ? "text-danger" : "text-foreground"}`}>
              {t.common.signed(review.net)}
            </span>
            {"　"}
            {t.review.stack} <span className="font-bold text-foreground">{t.formatChips(human.stack)}</span>
          </p>
        </div>

        {review.showdown.length > 0 && (
          <div className="flex flex-col gap-2">
            {review.showdown.map(({ player, hand, won }) => (
              <div key={player.id} className="flex flex-col gap-3 rounded-xl bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold">{playerName(t, player)}</span>
                    {won && <span className="rounded-full bg-felt px-2 py-0.5 text-xs font-bold text-white">{t.review.won}</span>}
                  </div>
                  <span className="text-base font-bold">{handName(t, hand)}</span>
                </div>
                <div className="flex gap-1.5">
                  {hand.bestFive.map((card) => (
                    <PlayingCard key={`${card.rank}${card.suit}`} card={card} size="sm" highlight={player.holeCards.some((h) => sameCard(h, card))} />
                  ))}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted">{t.review.cardsNote}</p>
          </div>
        )}

        <div className="flex flex-col gap-2 rounded-xl bg-accent-soft px-4 py-4">
          <p className="text-[15px] font-bold">{t.review.why}</p>
          {review.lines.map((line) => (
            <p key={line} className="text-sm leading-[1.8] text-pretty">
              {line}
            </p>
          ))}
          <button type="button" onClick={onOpenHands} className="self-start text-sm font-medium text-accent underline-offset-4 hover:underline">
            {t.review.openHands}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
