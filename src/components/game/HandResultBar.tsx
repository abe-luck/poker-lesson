"use client";

import Link from "next/link";
import { formatChips, handName } from "@/content/ja";
import { isGameOver } from "@/engine/game";
import type { GameState } from "@/engine/types";
import { Button, buttonClass } from "@/components/ui/Button";

type Props = {
  state: GameState;
  onNext: () => void;
  onRebuy: () => void;
  onRestart: () => void;
  tournament?: boolean;
};

export function HandResultBar({ state, onNext, onRebuy, onRestart, tournament = false }: Props) {
  const result = state.result;
  if (!result) return null;

  const nameOf = (id: string) => state.players.find((p) => p.id === id)?.name ?? id;
  const handOf = (id: string) => result.showdown.find((s) => s.playerId === id)?.hand;
  const human = state.players.find((p) => p.isHuman)!;
  const mainWinners = result.pots[0]?.winnerIds ?? [];
  const humanWon = result.payouts.some((p) => p.playerId === human.id);

  const title =
    mainWinners.length > 1
      ? `${mainWinners.map(nameOf).join(" と ")} で引き分け`
      : mainWinners[0] === human.id
        ? "あなたの勝ち"
        : `${nameOf(mainWinners[0])} の勝ち`;

  const details = result.pots.map((pot, i) => {
    const potName = result.pots.length > 1 ? (i === 0 ? "メインポット" : `サイドポット${i}`) : "ポット";
    const winners = pot.winnerIds
      .map((id) => {
        const hand = handOf(id);
        return hand ? `${nameOf(id)}（${handName(hand)}）` : nameOf(id);
      })
      .join("・");
    return `${potName} ${formatChips(pot.amount)} → ${winners}`;
  });

  const over = isGameOver(state);
  const humanBusted = human.stack === 0;
  // 同じハンドで複数人が脱落した場合も、残った人数 + 1 位とする
  const place = state.players.filter((p) => p.stack > 0).length + 1;
  const gameOverMessage = humanBusted
    ? tournament
      ? `${place}位で終了しました`
      : "チップがなくなりました"
    : tournament
      ? "優勝しました！"
      : "全員に勝ちました！";

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
      <div className="flex flex-col gap-0.5" aria-live="polite">
        <span className={`text-lg font-bold ${humanWon ? "text-felt" : ""}`}>{title}</span>
        {details.map((d) => (
          <span key={d} className="text-[13px] text-muted">
            {d}
          </span>
        ))}
        {result.showdown.length === 0 && <span className="text-[13px] text-muted">ほかの全員がフォールドしました</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {!over && (
          <Button variant="primary" size="lg" onClick={onNext} autoFocus>
            次のハンドへ
          </Button>
        )}
        {over && humanBusted && state.mode === "beginner" && (
          <Button variant="primary" size="lg" onClick={onRebuy} autoFocus>
            チップを補充して続ける
          </Button>
        )}
        {over && (humanBusted ? state.mode === "pro" : true) && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold">{gameOverMessage}</span>
            <Button variant="primary" size="lg" onClick={onRestart} autoFocus>
              もう一度遊ぶ
            </Button>
          </div>
        )}
        {over && (
          <Link href="/" className={buttonClass("secondary", "lg")}>
            トップに戻る
          </Link>
        )}
      </div>
    </div>
  );
}
