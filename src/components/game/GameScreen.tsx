"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { actionSentence, formatChips, MODE_NAMES } from "@/content/ja";
import { getLegalActions, getPlayerToAct, isGameOver } from "@/engine/game";
import { STRENGTH_LABELS } from "@/guide/guide";
import { useGameStore } from "@/store/gameStore";
import { ActionBar } from "@/components/controls/ActionBar";
import { GuideDetails, GuideSidePanel, GuideSummaryButton } from "@/components/guide/GuidePanel";
import { HandRankingList } from "@/components/guide/HandRankingList";
import { RulesContent } from "@/components/guide/RulesContent";
import { useGuide } from "@/components/guide/useGuide";
import { Table } from "@/components/table/Table";
import { AppHeader } from "@/components/ui/AppHeader";
import { buttonClass } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { HandResultBar } from "./HandResultBar";
import { HandReviewDialog } from "./HandReviewDialog";

/** CPU が行動するまでの間 (ms) */
const CPU_DELAY = { beginner: 1100, pro: 600 } as const;

type Reference = "guide" | "hands" | "rules" | null;

export function GameScreen() {
  const game = useGameStore((s) => s.game);
  const { act, cpuAct, nextHand, rebuyHuman, restart, quit } = useGameStore.getState();
  const guide = useGuide(game);
  const [reference, setReference] = useState<Reference>(null);
  const [closedReviewHand, setClosedReviewHand] = useState(0);

  const toAct = game ? getPlayerToAct(game) : null;
  // 役一覧などを開いている間は CPU を待たせる
  const paused = reference !== null;

  useEffect(() => {
    if (!game || !toAct || toAct.isHuman || paused) return;
    const timer = setTimeout(cpuAct, CPU_DELAY[game.mode]);
    return () => clearTimeout(timer);
  }, [game, toAct, cpuAct, paused]);

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

  const beginner = game.mode === "beginner";
  const legal = toAct?.isHuman ? getLegalActions(game) : null;
  const lastEntry = game.log.at(-1);
  const lastSentence = lastEntry
    ? actionSentence(game.players.find((p) => p.id === lastEntry.playerId)?.name ?? "", lastEntry)
    : "";

  let foldWarning: string | null = null;
  if (beginner && legal) {
    if (legal.check) foldWarning = "今はチェックできるので、チップを払わずに次へ進めます。本当にフォールドしますか？";
    else if (guide?.strength != null && guide.strength >= 2) {
      foldWarning = `今の手は「${STRENGTH_LABELS[guide.strength]}」です。フォールドすると、このハンドで出したチップは戻りません。本当にフォールドしますか？`;
    }
  }

  const reviewOpen = beginner && game.isHandOver && closedReviewHand !== game.handNumber && reference === null;
  const goNext = () => {
    setClosedReviewHand(0);
    nextHand();
  };
  const openHands = () => setReference("hands");
  const openRules = () => setReference("rules");

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader
        compact
        back={{ href: "/", label: "やめる", onClick: quit }}
        right={
          <div className="flex gap-1">
            <button type="button" onClick={openHands} className="rounded-lg px-2.5 py-2 text-sm text-muted hover:bg-background hover:text-foreground">
              役一覧
            </button>
            <button type="button" onClick={openRules} className="hidden rounded-lg px-2.5 py-2 text-sm text-muted hover:bg-background hover:text-foreground sm:block">
              ルール
            </button>
          </div>
        }
      >
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${beginner ? "bg-accent-soft text-accent" : "bg-[#eef0f2] text-muted"}`}
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

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 px-4 py-4 sm:px-6 md:py-6">
            <Table state={game} guide={guide} />
          </main>

          <p className="sr-only" aria-live="polite">
            {lastSentence}
          </p>

          <div className="sticky bottom-0 z-20 border-t border-border bg-surface px-4 py-3 sm:px-6 sm:py-4">
            <div className="mx-auto flex max-w-[1080px] flex-col gap-3">
              {guide && !game.isHandOver && <GuideSummaryButton state={game} guide={guide} onOpen={() => setReference("guide")} />}
              {game.isHandOver ? (
                <HandResultBar state={game} onNext={goNext} onRebuy={rebuyHuman} onRestart={restart} />
              ) : legal ? (
                <ActionBar key={`${game.handNumber}-${game.log.length}`} state={game} legal={legal} onAct={act} foldWarning={foldWarning} />
              ) : (
                <div className="flex min-h-12 flex-col justify-center gap-0.5">
                  <span className="text-base font-bold">{toAct?.name} が考えています…</span>
                  <span className="text-[13px] text-muted">{lastSentence}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {guide && <GuideSidePanel state={game} guide={guide} onOpenHands={openHands} onOpenRules={openRules} />}
      </div>

      <HandReviewDialog
        state={game}
        open={reviewOpen}
        canContinue={!isGameOver(game)}
        onClose={() => setClosedReviewHand(game.handNumber)}
        onNext={goNext}
        onOpenHands={openHands}
      />
      {guide && (
        <Dialog open={reference === "guide"} title="ガイド" onClose={() => setReference(null)}>
          <GuideDetails state={game} guide={guide} onOpenHands={openHands} onOpenRules={openRules} />
        </Dialog>
      )}
      <Dialog open={reference === "hands"} title="役一覧" wide onClose={() => setReference(null)}>
        <HandRankingList />
      </Dialog>
      <Dialog open={reference === "rules"} title="ルール説明" wide onClose={() => setReference(null)}>
        <RulesContent />
      </Dialog>
    </div>
  );
}
