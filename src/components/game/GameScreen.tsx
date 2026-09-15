"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { actionSentence, formatChips, MODE_NAMES } from "@/content/ja";
import { getLegalActions, getPlayerToAct, isGameOver } from "@/engine/game";
import { currentHand, STRENGTH_LABELS } from "@/guide/guide";
import { useSettingsStore } from "@/store/settingsStore";
import { useGameStoreHydrated } from "@/components/SettingsHydrator";
import { useGameSounds } from "./useGameSounds";
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
import { blindLevel, handsUntilNextLevel } from "@/engine/tournament";
import { HandLog, HandLogSidePanel } from "./HandLogPanel";
import { HandResultBar } from "./HandResultBar";
import { HandReviewDialog } from "./HandReviewDialog";
import { useTurnTimer } from "./useTurnTimer";

/** CPU が行動するまでの間 (ms) */
const CPU_DELAY = { beginner: 1100, pro: 600 } as const;

type Reference = "guide" | "hands" | "rules" | "log" | null;

export function GameScreen() {
  const hydrated = useGameStoreHydrated();
  const storedGame = useGameStore((s) => s.game);
  const game = hydrated ? storedGame : null;
  const config = useGameStore((s) => s.config);
  const { act, cpuAct, nextHand, rebuyHuman, restart, quit, timeout } = useGameStore.getState();
  const guide = useGuide(game);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const proShowHand = useSettingsStore((s) => s.proShowHand);
  const updateSettings = useSettingsStore((s) => s.update);
  const [reference, setReference] = useState<Reference>(null);
  const [closedReviewHand, setClosedReviewHand] = useState(0);
  useGameSounds(game);

  const toAct = game ? getPlayerToAct(game) : null;
  // 役一覧などを開いている間は CPU と持ち時間を止める
  const paused = reference !== null;

  useEffect(() => {
    if (!game || !toAct || toAct.isHuman || paused) return;
    const timer = setTimeout(cpuAct, CPU_DELAY[game.mode]);
    return () => clearTimeout(timer);
  }, [game, toAct, cpuAct, paused]);

  const remaining = useTurnTimer({
    seconds: game?.mode === "pro" ? (config?.timeLimit ?? 0) : 0,
    turnKey: game && toAct?.isHuman ? `${game.handNumber}-${game.log.length}` : null,
    paused,
    onExpire: timeout,
  });

  if (!hydrated) {
    return (
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center text-muted" aria-busy="true">
          読み込み中…
        </main>
      </div>
    );
  }

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
  const tournament = config?.format === "tournament";
  const levelLeft = tournament ? handsUntilNextLevel(game.handNumber) : null;
  const headerButton = "rounded-lg px-2.5 py-2 text-sm text-muted hover:bg-background hover:text-foreground";

  // プロモードでも設定で「今の役を表示」をオンにしていれば、役だけ表示する (強さは出さない)
  const human = game.players.find((p) => p.isHuman);
  const handInfo =
    guide ??
    (proShowHand && human && (human.status === "active" || human.status === "allin")
      ? { hand: currentHand(human, game.board), strength: null }
      : null);

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader
        compact
        back={{ href: "/", label: "やめる", onClick: quit }}
        right={
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? "効果音をオフにする" : "効果音をオンにする"}
              title={soundEnabled ? "効果音: オン" : "効果音: オフ"}
              onClick={() => updateSettings({ soundEnabled: !soundEnabled })}
              className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 8h3l4-3.5v11L6 12H3z" />
                {soundEnabled ? <path d="M13.5 7.5a3.5 3.5 0 0 1 0 5M15.5 5a7 7 0 0 1 0 10" /> : <path d="m13.5 8 4 4m0-4-4 4" />}
              </svg>
            </button>
            {!beginner && (
              <button type="button" onClick={() => setReference("log")} className={`${headerButton} xl:hidden`}>
                流れ
              </button>
            )}
            <button type="button" onClick={openHands} className={headerButton}>
              役一覧
            </button>
            <button type="button" onClick={openRules} className={`${headerButton} hidden sm:block`}>
              ルール
            </button>
          </div>
        }
      >
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${beginner ? "bg-accent-soft text-accent" : "bg-chip text-muted"}`}
        >
          {MODE_NAMES[game.mode]}
        </span>
        {tournament && (
          <span className="hidden shrink-0 text-muted md:inline">
            トーナメント{" "}
            <span className="font-medium text-foreground tabular-nums">レベル {blindLevel(game.handNumber - 1) + 1}</span>
            {levelLeft !== null && (
              <span className="ml-3">
                次のレベルまで <span className="font-medium text-foreground tabular-nums">{levelLeft}</span> ハンド
              </span>
            )}
          </span>
        )}
        <span className="hidden shrink-0 text-muted sm:inline">
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
            <Table state={game} guide={handInfo} />
          </main>

          <p className="sr-only" aria-live="polite">
            {lastSentence}
          </p>

          <div className="sticky bottom-0 z-20 border-t border-border bg-surface px-4 py-3 sm:px-6 sm:py-4">
            <div className="mx-auto flex max-w-[1080px] flex-col gap-3">
              {guide && !game.isHandOver && <GuideSummaryButton state={game} guide={guide} onOpen={() => setReference("guide")} />}
              {game.isHandOver ? (
                <HandResultBar state={game} onNext={goNext} onRebuy={rebuyHuman} onRestart={restart} tournament={tournament} />
              ) : legal ? (
                <ActionBar
                  key={`${game.handNumber}-${game.log.length}`}
                  state={game}
                  legal={legal}
                  onAct={act}
                  foldWarning={foldWarning}
                  showPotOdds={config?.showPotOdds}
                  timer={remaining !== null && config ? { remaining, total: config.timeLimit } : null}
                />
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
        {!beginner && <HandLogSidePanel state={game} />}
      </div>

      <Dialog open={reference === "log"} title="このハンドの流れ" onClose={() => setReference(null)}>
        <HandLog state={game} />
      </Dialog>

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
