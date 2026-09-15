"use client";

import { useEffect, useState } from "react";
import { getPotTotal } from "@/engine/game";
import type { Action, GameState, LegalActions } from "@/engine/types";
import { useI18n } from "@/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

type Props = {
  state: GameState;
  legal: LegalActions;
  onAct: (action: Action) => void;
  /** 指定されていれば、フォールドの前に確認する (初心者モード) */
  foldWarning?: string | null;
  /** コールに必要な勝率を表示する (プロモード) */
  showPotOdds?: boolean;
  /** 持ち時間 (秒) */
  timer?: { remaining: number; total: number } | null;
};

function Caption({ show, children }: { show: boolean; children: string }) {
  return show ? <span className="text-center text-xs text-muted">{children}</span> : null;
}

/** 親側で key を変えて、自分の番ごとに額をリセットする */
export function ActionBar({ state, legal, onAct, foldWarning, showPotOdds, timer }: Props) {
  const { t } = useI18n();
  const formatChips = t.formatChips;
  const range = legal.bet ?? legal.raise;
  const kind = legal.bet ? "bet" : "raise";
  const [amount, setAmount] = useState(range?.min ?? 0);
  const [preset, setPreset] = useState<string | null>(null);
  const [confirmingFold, setConfirmingFold] = useState(false);
  const fold = () => (foldWarning ? setConfirmingFold(true) : onAct({ type: "fold" }));
  const beginner = state.mode === "beginner";

  const pot = getPotTotal(state);
  const toCall = legal.call ?? 0;
  const me = state.players[state.toActIndex ?? 0];
  // 手持ちが足りずコール額が本来より少ない場合はオールインになる
  const shortCall = legal.call !== null && legal.call < state.currentBet - me.currentBet;
  const clamp = (v: number) => (range ? Math.min(range.max, Math.max(range.min, Math.round(v))) : 0);
  // 上乗せ額 = コール後のポットに対する割合
  const presets = range
    ? [
        { label: t.actionBar.presets.third, value: clamp(state.currentBet + (pot + toCall) / 3) },
        { label: t.actionBar.presets.half, value: clamp(state.currentBet + (pot + toCall) / 2) },
        { label: t.actionBar.presets.pot, value: clamp(state.currentBet + pot + toCall) },
        { label: t.actions.allin, value: range.max },
      ]
    : [];

  // キーボード操作: F フォールド / C チェック・コール / R ベット・レイズ
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input:not([type=range]), textarea, [role=dialog]") || document.querySelector("[role=dialog]")) return;
      const key = e.key.toLowerCase();
      if (key === "f") fold();
      else if (key === "c") onAct({ type: legal.check ? "check" : "call" });
      else if (key === "r" && range) onAct({ type: kind, amount });
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const betLabel = kind === "bet" ? t.actions.bet : t.actions.raise;
  const isAllin = range !== null && amount === range.max;
  const requiredEquity = legal.call !== null ? Math.round((legal.call / (pot + legal.call)) * 100) : null;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-bold">{t.game.yourTurn}</span>
        <span className="text-[13px] text-muted">
          {legal.call !== null ? t.actionBar.toCall(legal.call) : t.actionBar.canCheck}
        </span>
        {timer && (
          <div className="mt-1.5 flex max-w-[260px] items-center gap-2" role="timer" aria-label={t.actionBar.timerLabel(timer.remaining)}>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
              <div
                className={`h-1 rounded-full transition-[width] duration-300 ease-linear ${timer.remaining <= 5 ? "bg-danger" : "bg-accent"}`}
                style={{ width: `${(timer.remaining / timer.total) * 100}%` }}
              />
            </div>
            <span className={`text-xs tabular-nums ${timer.remaining <= 5 ? "font-bold text-danger" : "text-muted"}`}>{t.actionBar.timeLeft(timer.remaining)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <div className="flex flex-col gap-1">
            <Button variant="danger" onClick={fold} className="sm:w-36" aria-keyshortcuts="F" title={`${t.actions.fold} (F)`}>
              {t.actions.fold}
            </Button>
            <Caption show={beginner}>{t.actionBar.captionFold}</Caption>
          </div>
          <div className="flex flex-col gap-1">
            {legal.check ? (
              <Button variant="primary" onClick={() => onAct({ type: "check" })} className="sm:w-36" aria-keyshortcuts="C" title={`${t.actions.check} (C)`}>
                {t.actions.check}
              </Button>
            ) : (
              <Button variant="primary" onClick={() => onAct({ type: "call" })} className="sm:w-36" aria-keyshortcuts="C" title={`${t.actions.call} (C)`}>
                {shortCall ? t.actions.allin : t.actions.call} {formatChips(toCall)}
              </Button>
            )}
            <Caption show={beginner}>{legal.check ? t.actionBar.captionCheck : t.actionBar.captionCall(legal.call ?? 0)}</Caption>
            <Caption show={!beginner && !!showPotOdds && requiredEquity !== null}>{t.actionBar.requiredEquity(requiredEquity ?? 0)}</Caption>
          </div>
        </div>

        {range && (
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-2.5 sm:min-w-[360px]">
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <Button
                  key={p.label}
                  size="sm"
                  aria-pressed={preset === p.label}
                  onClick={() => {
                    setAmount(p.value);
                    setPreset(p.label);
                  }}
                  className={`font-medium ${preset === p.label ? "border-accent! text-accent" : ""}`}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                aria-label={t.actionBar.amountLabel(betLabel)}
                min={range.min}
                max={range.max}
                step={1}
                value={amount}
                onChange={(e) => {
                  setAmount(Number(e.target.value));
                  setPreset(null);
                }}
                className="min-w-0 flex-1 accent-(--accent)"
              />
              <Button variant="secondary" onClick={() => onAct({ type: kind, amount })} className="w-36 shrink-0" aria-keyshortcuts="R" title={`${betLabel} (R)`}>
                {isAllin ? t.actions.allin : betLabel} {formatChips(amount)}
              </Button>
            </div>
            <Caption show={beginner}>
              {kind === "bet" ? t.actionBar.captionBet(range.min) : t.actionBar.captionRaise(range.min)}
            </Caption>
          </div>
        )}
      </div>

      <Dialog
        open={confirmingFold}
        title={t.actionBar.confirmFoldTitle}
        onClose={() => setConfirmingFold(false)}
        footer={
          <>
            <Button size="lg" onClick={() => setConfirmingFold(false)}>
              {t.common.cancel}
            </Button>
            {legal.check && (
              <Button size="lg" onClick={() => onAct({ type: "check" })}>
                {t.actionBar.checkInstead}
              </Button>
            )}
            <Button variant="danger" size="lg" onClick={() => onAct({ type: "fold" })}>
              {t.actionBar.foldAnyway}
            </Button>
          </>
        }
      >
        <p className="text-[15px] leading-[1.8] text-pretty">{foldWarning}</p>
      </Dialog>
    </div>
  );
}
