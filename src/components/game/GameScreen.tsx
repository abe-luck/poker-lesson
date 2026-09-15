"use client";

import Link from "next/link";
import { useEffect } from "react";
import { actionSentence, formatChips, MODE_NAMES } from "@/content/ja";
import { getLegalActions, getPlayerToAct } from "@/engine/game";
import { useGameStore } from "@/store/gameStore";
import { ActionBar } from "@/components/controls/ActionBar";
import { Table } from "@/components/table/Table";
import { AppHeader } from "@/components/ui/AppHeader";
import { buttonClass } from "@/components/ui/Button";
import { HandResultBar } from "./HandResultBar";

/** CPU が行動するまでの間 (ms) */
const CPU_DELAY = { beginner: 1100, pro: 600 } as const;

export function GameScreen() {
  const game = useGameStore((s) => s.game);
  const { act, cpuAct, nextHand, rebuyHuman, restart, quit } = useGameStore.getState();

  const toAct = game ? getPlayerToAct(game) : null;

  useEffect(() => {
    if (!game || !toAct || toAct.isHuman) return;
    const timer = setTimeout(cpuAct, CPU_DELAY[game.mode]);
    return () => clearTimeout(timer);
  }, [game, toAct, cpuAct]);

  if (!game) {
    return (
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-muted">進行中のゲームがありません。</p>
          <Link href="/play" className={buttonClass("primary", "lg")}>
            ゲームを始める
          </Link>
        </main>
      </div>
    );
  }

  const legal = toAct?.isHuman ? getLegalActions(game) : null;
  const lastEntry = game.log.at(-1);
  const lastSentence = lastEntry
    ? actionSentence(game.players.find((p) => p.id === lastEntry.playerId)?.name ?? "", lastEntry)
    : "";

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader compact back={{ href: "/", label: "やめる", onClick: quit }}>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            game.mode === "beginner" ? "bg-accent-soft text-accent" : "bg-[#eef0f2] text-muted"
          }`}
        >
          {MODE_NAMES[game.mode]}
        </span>
        <span className="hidden text-muted sm:inline">
          ハンド <span className="font-medium text-foreground tabular-nums">#{game.handNumber}</span>
        </span>
        <span className="truncate text-muted">
          <span className="hidden sm:inline">ブラインド </span>
          <span className="font-medium text-foreground tabular-nums">
            {formatChips(game.blinds.small)} / {formatChips(game.blinds.big)}
          </span>
        </span>
      </AppHeader>

      <main className="flex-1 px-4 py-4 sm:px-6 md:py-6">
        <Table state={game} />
      </main>

      <p className="sr-only" aria-live="polite">
        {lastSentence}
      </p>

      <div className="sticky bottom-0 border-t border-border bg-surface px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-[1080px]">
          {game.isHandOver ? (
            <HandResultBar state={game} onNext={nextHand} onRebuy={rebuyHuman} onRestart={restart} />
          ) : legal ? (
            <ActionBar key={`${game.handNumber}-${game.log.length}`} state={game} legal={legal} onAct={act} />
          ) : (
            <div className="flex min-h-12 flex-col justify-center gap-0.5">
              <span className="text-base font-bold">{toAct?.name} が考えています…</span>
              <span className="text-[13px] text-muted">{lastSentence}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
