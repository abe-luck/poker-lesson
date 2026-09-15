"use client";

import { formatChips, handName } from "@/content/ja";
import { sameCard } from "@/engine/cards";
import type { GameState } from "@/engine/types";
import { reviewHand } from "@/guide/guide";
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
  const human = state.players.find((p) => p.isHuman);
  const review = human ? reviewHand(state, human.id) : null;
  if (!review || !human) return null;

  return (
    <Dialog
      open={open}
      wide
      title={`ハンド #${state.handNumber} の振り返り`}
      onClose={onClose}
      footer={
        <>
          <Button size="lg" onClick={onClose}>
            テーブルを見る
          </Button>
          {canContinue && (
            <Button variant="primary" size="lg" onClick={onNext} autoFocus>
              次のハンドへ
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <p className={`text-2xl font-bold ${review.net > 0 ? "text-felt" : ""}`}>{review.title}</p>
          <p className="text-sm text-muted tabular-nums">
            このハンドの収支{" "}
            <span className={`font-bold ${review.net > 0 ? "text-felt" : review.net < 0 ? "text-danger" : "text-foreground"}`}>
              {review.net > 0 ? "+" : review.net < 0 ? "−" : "±"}
              {formatChips(Math.abs(review.net))}
            </span>
            {"　"}残りチップ <span className="font-bold text-foreground">{formatChips(human.stack)}</span>
          </p>
        </div>

        {review.showdown.length > 0 && (
          <div className="flex flex-col gap-2">
            {review.showdown.map(({ player, hand, won }) => (
              <div key={player.id} className="flex flex-col gap-3 rounded-xl bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold">{player.name}</span>
                    {won && <span className="rounded-full bg-felt px-2 py-0.5 text-xs font-bold text-white">勝ち</span>}
                  </div>
                  <span className="text-base font-bold">{handName(hand)}</span>
                </div>
                <div className="flex gap-1.5">
                  {hand.bestFive.map((card) => (
                    <PlayingCard
                      key={`${card.rank}${card.suit}`}
                      card={card}
                      size="sm"
                      highlight={player.holeCards.some((h) => sameCard(h, card))}
                    />
                  ))}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted">役に使った5枚を表示しています。青い枠は、その人の手札のカードです。</p>
          </div>
        )}

        <div className="flex flex-col gap-2 rounded-xl bg-accent-soft px-4 py-4">
          <p className="text-[15px] font-bold">なぜこの結果になったの？</p>
          {review.lines.map((line) => (
            <p key={line} className="text-sm leading-[1.8] text-pretty">
              {line}
            </p>
          ))}
          <button type="button" onClick={onOpenHands} className="self-start text-sm font-medium text-accent underline-offset-4 hover:underline">
            役一覧で強さの順番を見る
          </button>
        </div>
      </div>
    </Dialog>
  );
}
