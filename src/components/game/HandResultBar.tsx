"use client";

import Link from "next/link";
import { isGameOver } from "@/engine/game";
import type { GameState } from "@/engine/types";
import { resultTitle } from "@/guide/guide";
import { handName, playerName } from "@/i18n";
import { useI18n } from "@/i18n/I18nProvider";
import { Button, buttonClass } from "@/components/ui/Button";

type Props = {
  state: GameState;
  onNext: () => void;
  onRebuy: () => void;
  onRestart: () => void;
  tournament?: boolean;
};

export function HandResultBar({ state, onNext, onRebuy, onRestart, tournament = false }: Props) {
  const { t, href } = useI18n();
  const result = state.result;
  if (!result) return null;

  const nameOf = (id: string) => {
    const player = state.players.find((p) => p.id === id);
    return player ? playerName(t, player) : id;
  };
  const handOf = (id: string) => result.showdown.find((s) => s.playerId === id)?.hand;
  const human = state.players.find((p) => p.isHuman)!;
  const humanWon = result.payouts.some((p) => p.playerId === human.id);
  const title = resultTitle(t, state, result.pots[0]?.winnerIds ?? []);

  const details = result.pots.map((pot, i) => {
    const potName = result.pots.length > 1 ? (i === 0 ? t.result.mainPot : t.result.sidePot(i)) : t.result.pot;
    const winners = pot.winnerIds
      .map((id) => {
        const hand = handOf(id);
        return hand ? t.result.withHand(nameOf(id), handName(t, hand)) : nameOf(id);
      })
      .join(t.result.separator);
    return t.result.potLine(potName, pot.amount, winners);
  });

  const over = isGameOver(state);
  const humanBusted = human.stack === 0;
  // 同じハンドで複数人が脱落した場合も、残った人数 + 1 位とする
  const place = state.players.filter((p) => p.stack > 0).length + 1;
  const gameOverMessage = humanBusted
    ? tournament
      ? t.result.place(place)
      : t.result.busted
    : tournament
      ? t.result.champion
      : t.result.beatEveryone;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
      <div className="flex flex-col gap-0.5" aria-live="polite">
        <span className={`text-lg font-bold ${humanWon ? "text-felt" : ""}`}>{title}</span>
        {details.map((d) => (
          <span key={d} className="text-[13px] text-muted">
            {d}
          </span>
        ))}
        {result.showdown.length === 0 && <span className="text-[13px] text-muted">{t.result.everyoneFolded}</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {!over && (
          <Button variant="primary" size="lg" onClick={onNext} autoFocus>
            {t.result.nextHand}
          </Button>
        )}
        {over && humanBusted && state.mode === "beginner" && (
          <Button variant="primary" size="lg" onClick={onRebuy} autoFocus>
            {t.result.rebuy}
          </Button>
        )}
        {over && (humanBusted ? state.mode === "pro" : true) && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold">{gameOverMessage}</span>
            <Button variant="primary" size="lg" onClick={onRestart} autoFocus>
              {t.result.playAgain}
            </Button>
          </div>
        )}
        {over && (
          <Link href={href("/")} className={buttonClass("secondary", "lg")}>
            {t.common.backToTop}
          </Link>
        )}
      </div>
    </div>
  );
}
