import { cryptoRng, sameCard } from "@/engine/cards";
import { evaluateBest, HAND_CATEGORY } from "@/engine/evaluator";
import { getLegalActions, getPotTotal } from "@/engine/game";
import type { Action, Card, GameState, HandCategory, LegalActions, Rng } from "@/engine/types";
import { estimateEquity } from "./equity";

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

export type CpuOptions = {
  rng?: Rng;
  /** 勝率計算の試行回数 (テストでは少なくして速くする) */
  iterations?: number;
};

const CHECK: Action = { type: "check" };
const CALL: Action = { type: "call" };
const FOLD: Action = { type: "fold" };

type Context = {
  state: GameState;
  legal: LegalActions;
  pot: number;
  toCall: number;
};

/** ポットの fraction 倍を上乗せするベット / レイズ (範囲外なら丸める)。できなければ null */
function sizedBet({ state, legal, pot, toCall }: Context, fraction: number): Action | null {
  const range = legal.bet ?? legal.raise;
  if (!range) return null;
  const target = state.currentBet + Math.max(state.blinds.big, Math.round((pot + toCall) * fraction));
  const amount = Math.min(range.max, Math.max(range.min, target));
  return { type: legal.bet ? "bet" : "raise", amount };
}

/** CPUの行動を決める。強さはプレイヤーの cpuLevel による (省略時は弱い) */
export function decideCpuAction(state: GameState, options: CpuOptions | Rng = {}): Action {
  const { rng = cryptoRng, iterations } = typeof options === "function" ? { rng: options } : options;
  const legal = getLegalActions(state);
  if (!legal) throw new Error("CPUの番ではありません");
  const me = state.players[state.toActIndex!];
  const ctx: Context = { state, legal, pot: getPotTotal(state), toCall: legal.call ?? 0 };

  switch (me.cpuLevel) {
    case "normal":
      return decideByEquity(ctx, "normal", rng, iterations ?? 250);
    case "hard":
      return decideByEquity(ctx, "hard", rng, iterations ?? 400);
    default:
      return decideEasy(ctx, rng);
  }
}

/** フロップ以降で、自分より後に行動できる人がいなければ true */
function actsLast(state: GameState): boolean {
  const n = state.players.length;
  const me = state.toActIndex!;
  for (let k = 1; k < n; k++) {
    const i = (me + k) % n;
    if (state.players[i].status === "active") return false;
    if (i === state.dealerIndex) break;
  }
  return true;
}

/**
 * ふつう / 強い: 勝てる見込みとポットオッズで判断する。
 * 強いCPUはさらに、ポジション・相手のベット額を考え、ブラフやベット額にばらつきを持たせる。
 */
function decideByEquity(ctx: Context, level: "normal" | "hard", rng: Rng, iterations: number): Action {
  const { state, legal, pot, toCall } = ctx;
  const me = state.players[state.toActIndex!];
  const opponents = state.players.filter((p) => p !== me && (p.status === "active" || p.status === "allin")).length;
  const equity = estimateEquity(me.holeCards, state.board, opponents, iterations, rng);
  const fair = 1 / (opponents + 1);
  const hard = level === "hard";
  const postflop = state.board.length > 0;
  const inPosition = hard && postflop && actsLast(state);
  const roll = rng();

  // 平均の何倍の見込みがあればベットするか。強いCPUは後から行動できるとき薄めでもベットする
  const strong = equity >= Math.min(0.8, fair * (hard ? (inPosition ? 1.45 : 1.6) : 1.8));
  const monster = equity >= 0.85;
  // 強いCPUは手の強さに合わせてベット額を変える
  const size = () => (hard ? Math.min(1, 0.45 + (equity - fair) + rng() * 0.2) : 0.6);

  if (legal.check) {
    if (strong) return (roll < 0.9 ? sizedBet(ctx, size()) : null) ?? CHECK;
    const bluffRate = !postflop ? 0 : hard ? (inPosition ? 0.08 : 0.03) : 0.07;
    // 強いCPUは、役ができかけの手でも時々ベットする
    const semiBluff = hard && postflop && state.board.length < 5 && equity >= fair * 1.2 && roll < 0.15;
    if (semiBluff || roll < bluffRate) return sizedBet(ctx, 0.5) ?? CHECK;
    return CHECK;
  }

  const need = toCall / (pot + toCall);
  // 大きなベットには強い手が多いので、強いCPUはコールの基準を少し上げる
  const respect = hard && toCall > pot * 0.75 ? 0.03 : 0;
  const positionBonus = inPosition ? 0.02 : 0;

  if (strong) {
    if (monster && hard && roll < 0.1 && legal.raise) return { type: "allin" };
    if (roll < (hard ? 0.75 : 0.6)) return sizedBet(ctx, size()) ?? CALL;
    return CALL;
  }
  if (equity + positionBonus >= need + respect + (level === "normal" ? 0.03 : 0)) return CALL;
  return FOLD;
}

/** 弱いCPU (初心者モード用)。手の強さだけで決め、ブラフはほとんどしない */
function decideEasy(ctx: Context, rng: Rng): Action {
  const { state, legal, pot, toCall } = ctx;
  const me = state.players[state.toActIndex!];
  const tier = strengthTier(me.holeCards, state.board);
  const roll = rng();

  const check = CHECK;
  const call = CALL;
  const fold = FOLD;
  const passive = legal.check ? check : call;
  const aggressive = (fraction: number) => sizedBet(ctx, fraction);

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
