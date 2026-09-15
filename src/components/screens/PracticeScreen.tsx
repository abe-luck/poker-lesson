"use client";

import Link from "next/link";
import { useState } from "react";
import { cryptoRng } from "@/engine/cards";
import { getLegalActions } from "@/engine/game";
import type { ActionType } from "@/engine/types";
import { currentHand, recommend } from "@/guide/guide";
import { useI18n } from "@/i18n/I18nProvider";
import { gradeAnswer, generateQuestion, type Grade, type PracticeQuestion } from "@/practice/generate";
import { Table } from "@/components/table/Table";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button, buttonClass } from "@/components/ui/Button";

const TOTAL = 8;

type Answered = { answer: ActionType; grade: Grade };

const GRADE_STYLE: Record<Grade, string> = {
  correct: "bg-felt text-white",
  close: "bg-accent text-on-accent",
  wrong: "bg-chip text-muted",
};

export function PracticeScreen() {
  const { t, href } = useI18n();
  const [question, setQuestion] = useState<PracticeQuestion | null>(null);
  const [answered, setAnswered] = useState<Answered | null>(null);
  const [results, setResults] = useState<Grade[]>([]);
  const [finished, setFinished] = useState(false);

  const nextQuestion = () => {
    setAnswered(null);
    setQuestion(generateQuestion(cryptoRng));
  };

  const start = () => {
    setResults([]);
    setFinished(false);
    nextQuestion();
  };

  const answer = (type: ActionType) => {
    if (!question || answered) return;
    const grade = gradeAnswer(type, question.decision);
    setAnswered({ answer: type, grade });
    setResults([...results, grade]);
  };

  const advance = () => {
    if (results.length >= TOTAL) {
      setFinished(true);
      setQuestion(null);
    } else {
      nextQuestion();
    }
  };

  const header = <AppHeader back={{ href: href("/"), label: t.common.back }} />;

  // 開始前
  if (!question && !finished) {
    return (
      <div className="flex flex-1 flex-col">
        {header}
        <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center">
          <h1 className="text-[28px] font-bold">{t.practice.title}</h1>
          <p className="text-[15px] leading-[1.8] text-pretty text-muted">{t.practice.lead}</p>
          <Button variant="primary" size="lg" onClick={start} autoFocus>
            {t.practice.start}
          </Button>
        </main>
      </div>
    );
  }

  // 結果
  if (finished) {
    const correct = results.filter((g) => g === "correct").length;
    const close = results.filter((g) => g === "close").length;
    return (
      <div className="flex flex-1 flex-col">
        {header}
        <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center justify-center gap-5 px-4 py-12 text-center">
          <h1 className="text-[28px] font-bold">{t.practice.resultTitle}</h1>
          <p className="text-4xl font-bold tabular-nums">{t.practice.score(correct, results.length)}</p>
          <p className="text-[15px] text-muted">{t.practice.closeCount(close)}</p>
          <p className="text-[15px] leading-[1.8] text-pretty">{t.practice.comment((correct + close * 0.5) / results.length)}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Button variant="primary" size="lg" onClick={start} autoFocus>
              {t.practice.again}
            </Button>
            <Link href={href("/play")} className={buttonClass("secondary", "lg")}>
              {t.practice.toGame}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const legal = getLegalActions(question!.state)!;
  const me = question!.state.players.find((p) => p.isHuman)!;
  const suggestion = recommend(t, question!.state, question!.equity);
  const labels: Record<string, string> = {
    fold: t.actions.fold,
    check: t.actions.check,
    call: `${t.actions.call} ${t.formatChips(legal.call ?? 0)}`,
    bet: t.actions.bet,
    raise: t.actions.raise,
  };
  const choices: ActionType[] = ["fold", ...(legal.check ? ["check"] : ["call"]), ...(legal.bet ? ["bet"] : legal.raise ? ["raise"] : [])] as ActionType[];

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader back={{ href: href("/"), label: t.common.quit }}>
        <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">{t.practice.title}</span>
        <span className="truncate text-muted tabular-nums">{t.practice.counter(results.length + (answered ? 0 : 1), TOTAL)}</span>
      </AppHeader>

      <main className="flex-1 px-4 py-4 sm:px-6 md:py-6">
        <Table state={question!.state} guide={{ hand: currentHand(t, me, question!.state.board), strength: null }} />
      </main>

      <div className="sticky bottom-0 z-20 border-t border-border bg-surface px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-3">
          {answered ? (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-sm font-bold ${GRADE_STYLE[answered.grade]}`}>{t.practice.grades[answered.grade]}</span>
                  <span className="text-[15px] font-bold">{t.practice.answerWas(suggestion?.label ?? "")}</span>
                  <span className="text-[13px] text-muted">{t.practice.yourAnswer(labels[answered.answer] ?? answered.answer)}</span>
                </div>
                <p className="text-sm leading-[1.8] text-pretty">{suggestion?.reason}</p>
                {suggestion?.detail && <p className="text-xs leading-relaxed text-muted">{suggestion.detail}</p>}
              </div>
              <Button variant="primary" size="lg" onClick={advance} autoFocus className="shrink-0">
                {results.length >= TOTAL ? t.practice.finish : t.practice.next}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
              <div className="flex flex-col gap-0.5">
                <span className="text-base font-bold">{t.practice.prompt}</span>
                <span className="text-[13px] text-muted">{legal.call !== null ? t.actionBar.toCall(legal.call) : t.actionBar.canCheck}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                {choices.map((type) => (
                  <Button key={type} variant={type === "fold" ? "danger" : "secondary"} size="lg" onClick={() => answer(type)} className="sm:min-w-36">
                    {labels[type]}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
