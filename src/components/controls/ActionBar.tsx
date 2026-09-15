"use client";

import { useState } from "react";
import { formatChips } from "@/content/ja";
import { getPotTotal } from "@/engine/game";
import type { Action, GameState, LegalActions } from "@/engine/types";
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
        { label: "1/3 ポット", value: clamp(state.currentBet + (pot + toCall) / 3) },
        { label: "1/2 ポット", value: clamp(state.currentBet + (pot + toCall) / 2) },
        { label: "ポット", value: clamp(state.currentBet + pot + toCall) },
        { label: "オールイン", value: range.max },
      ]
    : [];

  const betLabel = kind === "bet" ? "ベット" : "レイズ";
  const isAllin = range !== null && amount === range.max;
  const requiredEquity = legal.call !== null ? Math.round((legal.call / (pot + legal.call)) * 100) : null;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-bold">あなたの番です</span>
        <span className="text-[13px] text-muted">
          {legal.call !== null ? `続けるには ${formatChips(legal.call)} 払ってコールします` : "チェックして様子を見ることができます"}
        </span>
        {timer && (
          <div className="mt-1.5 flex max-w-[260px] items-center gap-2" role="timer" aria-label={`残り ${timer.remaining} 秒`}>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
              <div
                className={`h-1 rounded-full transition-[width] duration-300 ease-linear ${timer.remaining <= 5 ? "bg-danger" : "bg-accent"}`}
                style={{ width: `${(timer.remaining / timer.total) * 100}%` }}
              />
            </div>
            <span className={`text-xs tabular-nums ${timer.remaining <= 5 ? "font-bold text-danger" : "text-muted"}`}>残り {timer.remaining}秒</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <div className="flex flex-col gap-1">
            <Button variant="danger" onClick={fold} className="sm:w-36">
              フォールド
            </Button>
            <Caption show={beginner}>このハンドを降ります</Caption>
          </div>
          <div className="flex flex-col gap-1">
            {legal.check ? (
              <Button variant="primary" onClick={() => onAct({ type: "check" })} className="sm:w-36">
                チェック
              </Button>
            ) : (
              <Button variant="primary" onClick={() => onAct({ type: "call" })} className="sm:w-36">
                {shortCall ? "オールイン" : "コール"} {formatChips(toCall)}
              </Button>
            )}
            <Caption show={beginner}>{legal.check ? "何も出さずに次へ進みます" : `${formatChips(legal.call ?? 0)} 払って続けます`}</Caption>
            <Caption show={!beginner && !!showPotOdds && requiredEquity !== null}>{`必要な勝率 ${requiredEquity}%`}</Caption>
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
                aria-label={`${betLabel}額`}
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
              <Button variant="secondary" onClick={() => onAct({ type: kind, amount })} className="w-36 shrink-0">
                {isAllin ? "オールイン" : betLabel} {formatChips(amount)}
              </Button>
            </div>
            <Caption show={beginner}>
              {kind === "bet" ? `最初に賭けます（${formatChips(range.min)} 以上）` : `${formatChips(range.min)} 以上に上げます`}
            </Caption>
          </div>
        )}
      </div>

      <Dialog
        open={confirmingFold}
        title="フォールドしますか？"
        onClose={() => setConfirmingFold(false)}
        footer={
          <>
            <Button size="lg" onClick={() => setConfirmingFold(false)}>
              やめる
            </Button>
            {legal.check && (
              <Button size="lg" onClick={() => onAct({ type: "check" })}>
                チェックする
              </Button>
            )}
            <Button variant="danger" size="lg" onClick={() => onAct({ type: "fold" })}>
              フォールドする
            </Button>
          </>
        }
      >
        <p className="text-[15px] leading-[1.8] text-pretty">{foldWarning}</p>
      </Dialog>
    </div>
  );
}
