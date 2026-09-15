"use client";

import { estimateEquity } from "@/ai/equity";
import { cardToString, parseCards, seededRng } from "@/engine/cards";
import type { GameState } from "@/engine/types";
import {
  countOpponents,
  currentHand,
  explainSituation,
  recommend,
  roundFlow,
  strengthLevel,
  type CurrentHand,
  type Recommendation,
  type StrengthLevel,
} from "@/guide/guide";

export type Guide = {
  hand: CurrentHand | null;
  equity: number | null;
  strength: StrengthLevel | null;
  recommendation: Recommendation | null;
  situation: string[];
  flow: ReturnType<typeof roundFlow>;
};

const EQUITY_ITERATIONS = 600;

function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

// 場のカードか相手の人数が変わったときだけ計算し直す (同じ状況なら同じ値)
const equityCache = { key: "", value: 0 };

function cachedEquity(key: string, opponents: number): number {
  if (equityCache.key !== key) {
    const [, hole, board] = key.split("|");
    equityCache.value = estimateEquity(parseCards(hole), parseCards(board), opponents, EQUITY_ITERATIONS, seededRng(hashString(key)));
    equityCache.key = key;
  }
  return equityCache.value;
}

/** 初心者モードのガイド情報。プロモードや観戦中は null を返す部分がある */
export function useGuide(game: GameState | null): Guide | null {
  const human = game?.players.find((p) => p.isHuman) ?? null;
  const contending = human !== null && (human.status === "active" || human.status === "allin");
  const holeKey = human?.holeCards.map(cardToString).join(" ") ?? "";
  const boardKey = game?.board.map(cardToString).join(" ") ?? "";
  const opponents = game && human ? countOpponents(game, human.id) : 0;
  const handNumber = game?.handNumber ?? 0;
  const enabled = game?.mode === "beginner" && contending && holeKey !== "" && !game.isHandOver;

  const equity = enabled ? cachedEquity(`${handNumber}|${holeKey}|${boardKey}|${opponents}`, opponents) : null;

  if (!game || !human || game.mode !== "beginner") return null;

  return {
    hand: contending ? currentHand(human, game.board) : null,
    equity,
    strength: equity === null ? null : strengthLevel(equity, opponents),
    recommendation: equity === null ? null : recommend(game, equity),
    situation: explainSituation(game, human.id),
    flow: roundFlow(game),
  };
}
