import { cryptoRng, sameCard } from "@/engine/cards";
import { evaluateBest, HAND_CATEGORY } from "@/engine/evaluator";
import { getLegalActions, getPotTotal } from "@/engine/game";
import type { Action, Card, GameState, HandCategory, Rng } from "@/engine/types";

/** 手の強さ 0=弱い / 1=ふつう / 2=強い / 3=とても強い */
export type StrengthTier = 0 | 1 | 2 | 3;

/** 手札2枚だけでの強さ */
export function preflopTier(hole: readonly Card[]): StrengthTier {
  const [high, low] = [...hole].sort((a, b) => b.rank - a.rank);
  const pair = high.rank === low.rank;
  const suited = high.suit === low.suit;

  if ((pair && high.rank >= 10) || (high.rank === 14 && low.rank >= 12)) return 3;
  if (pair || (high.rank >= 10 && low.rank >= 10) || (high.rank === 14 && suited)) return 2;
  if (high.rank >= 11 || (suited && high.rank - low.rank <= 2 && low.rank >= 5)) return 1;
  return 0;
}

/** 場のカードだけでできている役の種類 */
function boardCategory(board: readonly Card[]): HandCategory {
  if (board.length === 5) return evaluateBest(board).category;
  const counts = [...new Map(board.map((c) => [c.rank, board.filter((x) => x.rank === c.rank).length])).values()];
  const max = Math.max(...counts);
  if (max === 4) return HAND_CATEGORY.fourOfAKind;
  if (max === 3) return HAND_CATEGORY.threeOfAKind;
  if (counts.filter((n) => n === 2).length === 2) return HAND_CATEGORY.twoPair;
  if (max === 2) return HAND_CATEGORY.onePair;
  return HAND_CATEGORY.highCard;
}

/** 場のカードが開いたあとの強さ。手札が役に貢献していなければ弱い扱い */
export function postflopTier(hole: readonly Card[], board: readonly Card[]): StrengthTier {
  const hand = evaluateBest([...hole, ...board]);
  const usesHole = hand.bestFive.some((c) => hole.some((h) => sameCard(h, c)));
  if (!usesHole || hand.category <= boardCategory(board)) return 0;

  if (hand.category >= HAND_CATEGORY.threeOfAKind) return 3;
  if (hand.category === HAND_CATEGORY.twoPair) return 2;
  if (hand.category === HAND_CATEGORY.onePair) {
    const topBoardRank = Math.max(...board.map((c) => c.rank));
    return hand.tiebreak[0] >= topBoardRank ? 2 : 1;
  }
  return 0;
}

export function strengthTier(hole: readonly Card[], board: readonly Card[]): StrengthTier {
  return board.length === 0 ? preflopTier(hole) : postflopTier(hole, board);
}

/**
 * 弱いCPU (初心者モード用)。手の強さだけで決め、ブラフはほとんどしない。
 * ふつう / 強い は M4 で追加する。
 */
export function decideCpuAction(state: GameState, rng: Rng = cryptoRng): Action {
  const legal = getLegalActions(state);
  if (!legal) throw new Error("CPUの番ではありません");
  const me = state.players[state.toActIndex!];

  const tier = strengthTier(me.holeCards, state.board);
  const pot = getPotTotal(state);
  const toCall = legal.call ?? 0;
  const roll = rng();

  const check: Action = { type: "check" };
  const call: Action = { type: "call" };
  const fold: Action = { type: "fold" };
  const passive = legal.check ? check : call;

  /** ポットの fraction 倍を上乗せする (範囲外なら丸める) */
  const aggressive = (fraction: number): Action | null => {
    const range = legal.bet ?? legal.raise;
    if (!range) return null;
    const target = state.currentBet + Math.max(state.blinds.big, Math.round((pot + toCall) * fraction));
    const amount = Math.min(range.max, Math.max(range.min, target));
    return { type: legal.bet ? "bet" : "raise", amount };
  };

  switch (tier) {
    case 3:
      return roll < 0.7 ? (aggressive(0.6) ?? passive) : passive;
    case 2:
      if (legal.check) return roll < 0.35 ? (aggressive(0.4) ?? check) : check;
      return toCall <= pot * 0.75 || roll < 0.3 ? call : fold;
    case 1:
      if (legal.check) return roll < 0.1 ? (aggressive(0.33) ?? check) : check;
      return toCall <= state.blinds.big * 2 || toCall <= pot * 0.25 ? call : fold;
    default:
      if (legal.check) return roll < 0.05 ? (aggressive(0.5) ?? check) : check;
      return toCall <= state.blinds.big && roll < 0.6 ? call : fold;
  }
}
