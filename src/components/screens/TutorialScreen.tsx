"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { applyAction, getLegalActions } from "@/engine/game";
import type { ActionType, GameState } from "@/engine/types";
import { currentHand } from "@/guide/guide";
import { playerName } from "@/i18n";
import { useI18n } from "@/i18n/I18nProvider";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { nextScriptedAction, startTutorialHand, TUTORIAL_HANDS, type TutorialHand } from "@/tutorial/script";
import { HandRankingList } from "@/components/guide/HandRankingList";
import { Table } from "@/components/table/Table";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

const CPU_DELAY = 1000;

type Phase = { kind: "intro"; page: number } | { kind: "play" } | { kind: "outro" };

/** 台本の行動だけを押せるボタン群 */
function PromptActions({ state, prompt, onAct }: { state: GameState; prompt: TutorialHand["prompts"][number]; onAct: () => void }) {
  const { t } = useI18n();
  const legal = getLegalActions(state);
  if (!legal) return null;
  const buttons: { type: ActionType; label: string }[] = [
    { type: "fold", label: t.actions.fold },
    legal.check ? { type: "check", label: t.actions.check } : { type: "call", label: `${t.actions.call} ${t.formatChips(legal.call ?? 0)}` },
  ];
  if (legal.bet) buttons.push({ type: "bet", label: `${t.actions.bet} ${t.formatChips(prompt.type === "bet" ? prompt.amount! : legal.bet.min)}` });
  if (legal.raise) buttons.push({ type: "raise", label: `${t.actions.raise} ${t.formatChips(prompt.type === "raise" ? prompt.amount! : legal.raise.min)}` });

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {buttons.map((b) => {
        const expected = b.type === prompt.type;
        return (
          <Button
            key={b.type}
            variant={expected ? "primary" : "secondary"}
            disabled={!expected}
            onClick={onAct}
            autoFocus={expected}
            className={`sm:min-w-36 ${expected ? "ring-4 ring-accent/25" : ""}`}
            title={expected ? undefined : t.tutorial.onlyPrompted}
          >
            {b.label}
          </Button>
        );
      })}
    </div>
  );
}

export function TutorialScreen() {
  const { t, href } = useI18n();
  const router = useRouter();
  const updateSettings = useSettingsStore((s) => s.update);
  const updateDraft = useGameStore((s) => s.updateDraft);

  const [handIndex, setHandIndex] = useState(0);
  const hand = TUTORIAL_HANDS[handIndex];
  const text = t.tutorial.hands[handIndex];
  const [state, setState] = useState(() => startTutorialHand(TUTORIAL_HANDS[0]));
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<Phase>({ kind: "intro", page: 0 });
  const [showHands, setShowHands] = useState(false);

  const next = phase.kind === "play" ? nextScriptedAction(hand, state, counts) : null;
  const shownPhase: Phase = phase.kind === "play" && state.isHandOver ? { kind: "outro" } : phase;
  const isLast = handIndex === TUTORIAL_HANDS.length - 1;

  const perform = () => {
    if (!next) return;
    setState(applyAction(state, next.action));
    setCounts({ ...counts, [next.player.id]: (counts[next.player.id] ?? 0) + 1 });
  };

  // CPU の番は台本どおりに自動で進める (役一覧を開いている間は待つ)
  useEffect(() => {
    if (!next || next.player.isHuman || showHands) return;
    const timer = setTimeout(perform, CPU_DELAY);
    return () => clearTimeout(timer);
  });

  const goToHand = (index: number) => {
    setHandIndex(index);
    setState(startTutorialHand(TUTORIAL_HANDS[index]));
    setCounts({});
    setPhase({ kind: "intro", page: 0 });
  };

  const finish = (goPlay: boolean) => {
    updateSettings({ tutorialDone: true });
    if (goPlay) {
      updateDraft({ mode: "beginner" });
      router.push(href("/play/setup"));
    } else {
      router.push(href("/"));
    }
  };

  const human = state.players.find((p) => p.isHuman)!;
  const handInfo = { hand: human.status === "folded" ? null : currentHand(t, human, state.board), strength: null };

  let coach = "";
  if (shownPhase.kind === "intro") coach = text.intro[shownPhase.page];
  else if (next?.promptIndex != null) coach = text.prompts[next.promptIndex];
  else if (next) coach = t.tutorial.cpuTurn(playerName(t, next.player));

  const headerButton = "rounded-lg px-2.5 py-2 text-sm text-muted hover:bg-background hover:text-foreground";

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader
        compact
        back={{ href: href("/"), label: t.common.quit }}
        right={
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => setShowHands(true)} className={headerButton}>
              {t.common.hands}
            </button>
            <button type="button" onClick={() => finish(true)} className={headerButton}>
              {t.tutorial.skip}
            </button>
          </div>
        }
      >
        <span className="hidden shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent sm:inline">{t.tutorial.badge}</span>
        <span className="truncate text-muted">
          <span className="font-medium text-foreground tabular-nums">
            {handIndex + 1} / {TUTORIAL_HANDS.length}
          </span>
          <span className="hidden sm:inline">　{text.title}</span>
        </span>
      </AppHeader>

      <main className="flex-1 px-4 py-4 sm:px-6 md:py-6">
        <Table state={state} guide={handInfo} />
      </main>

      <div className="sticky bottom-0 z-20 border-t border-border bg-surface px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-3" aria-live="polite">
          {shownPhase.kind === "outro" ? (
            <>
              {text.outro.map((line, i) => (
                <p key={line} className={i === 0 ? "text-lg font-bold text-felt" : "text-[15px] leading-[1.8] text-pretty"}>
                  {line}
                </p>
              ))}
              <div className="flex flex-wrap justify-end gap-2">
                {isLast ? (
                  <>
                    <Button size="lg" onClick={() => finish(false)}>
                      {t.common.backToTop}
                    </Button>
                    <Button variant="primary" size="lg" onClick={() => finish(true)} autoFocus>
                      {t.tutorial.playBeginner}
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" size="lg" onClick={() => goToHand(handIndex + 1)} autoFocus>
                    {t.tutorial.nextLesson(handIndex + 2, TUTORIAL_HANDS.length)}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-felt px-1.5 text-xs font-bold text-white" aria-hidden>
                  {t.tutorial.coach}
                </span>
                <p className="min-h-12 text-[15px] leading-[1.8] text-pretty">{coach}</p>
              </div>
              <div className="flex justify-end">
                {shownPhase.kind === "intro" ? (
                  <Button
                    variant="primary"
                    size="lg"
                    autoFocus
                    onClick={() => setPhase(shownPhase.page + 1 < text.intro.length ? { kind: "intro", page: shownPhase.page + 1 } : { kind: "play" })}
                  >
                    {t.common.next}
                  </Button>
                ) : next?.prompt ? (
                  <PromptActions state={state} prompt={next.prompt} onAct={perform} />
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={showHands} title={t.meta.titles.hands} wide onClose={() => setShowHands(false)}>
        <HandRankingList />
      </Dialog>
    </div>
  );
}
