import { compareHands, evaluateBest, HAND_CATEGORY } from "@/engine/evaluator";
import { getLegalActions, getPlayerToAct, getPotTotal } from "@/engine/game";
import type { Card, GameState, HandCategory, HandRank, Player, Rank } from "@/engine/types";
import { handName, playerName, rankLabel, type Dictionary } from "@/i18n";

// ---------- 今の役と手の強さ ----------

export type CurrentHand = {
  name: string;
  /** 役を作っているカード (強調表示用。キッカーは含めない) */
  keyCards: Card[];
};

export function currentHand(t: Dictionary, player: Player, board: readonly Card[]): CurrentHand | null {
  if (player.holeCards.length < 2) return null;

  if (board.length === 0) {
    const [high, low] = [...player.holeCards].sort((a, b) => b.rank - a.rank);
    return high.rank === low.rank
      ? { name: t.hands.preflopPair(rankLabel(high.rank)), keyCards: [high, low] }
      : { name: t.hands.preflopHigh(rankLabel(high.rank)), keyCards: [high] };
  }

  const hand = evaluateBest([...player.holeCards, ...board]);
  return { name: handName(t, hand), keyCards: keyCardsOf(hand) };
}

function keyCardsOf(hand: HandRank): Card[] {
  switch (hand.category) {
    case HAND_CATEGORY.highCard:
      return hand.bestFive.slice(0, 1);
    case HAND_CATEGORY.onePair:
    case HAND_CATEGORY.twoPair:
    case HAND_CATEGORY.threeOfAKind:
    case HAND_CATEGORY.fullHouse:
    case HAND_CATEGORY.fourOfAKind: {
      const count = (rank: number) => hand.bestFive.filter((c) => c.rank === rank).length;
      return hand.bestFive.filter((c) => count(c.rank) >= 2);
    }
    default:
      return hand.bestFive;
  }
}

export type StrengthLevel = 0 | 1 | 2 | 3;

/** 勝てる見込みを、相手の人数で割った平均と比べて4段階にする */
export function strengthLevel(equity: number, opponents: number): StrengthLevel {
  const ratio = equity * (opponents + 1);
  if (ratio < 0.75) return 0;
  if (ratio < 1.15) return 1;
  if (ratio < 1.6) return 2;
  return 3;
}

export function countOpponents(state: GameState, playerId: string): number {
  return state.players.filter((p) => p.id !== playerId && (p.status === "active" || p.status === "allin")).length;
}

// ---------- おすすめ ----------

export type Recommendation = {
  action: "fold" | "check" | "call" | "bet" | "raise";
  label: string;
  reason: string;
  /** 計算の説明 (コールの判断に使った数字) */
  detail?: string;
};

const percent = (v: number) => Math.round(v * 100);

export type Decision = {
  action: Recommendation["action"];
  /** コールに必要な勝率 (チェックできる場面では null) */
  need: number | null;
  /** 「強い」とみなす勝率の基準 */
  strongLine: number;
  opponents: number;
};

/** おすすめの判断だけを出す (文章なし)。練習問題の答え合わせにも使う */
export function decideRecommendation(state: GameState, equity: number): Decision | null {
  const player = getPlayerToAct(state);
  const legal = getLegalActions(state);
  if (!player?.isHuman || !legal) return null;

  const opponents = countOpponents(state, player.id);
  // 相手が多いほど、平均的な勝率は下がるので「強い」の基準も下げる
  const strongLine = Math.min(0.65, Math.max(0.35, 1.8 / (opponents + 1)));
  const call = legal.call ?? 0;
  const need = legal.check ? null : call / (getPotTotal(state) + call);

  if (equity >= strongLine && (legal.bet || legal.raise)) {
    return { action: legal.bet ? "bet" : "raise", need, strongLine, opponents };
  }
  if (legal.check) return { action: "check", need, strongLine, opponents };
  return { action: equity >= (need ?? 0) ? "call" : "fold", need, strongLine, opponents };
}

export function recommend(t: Dictionary, state: GameState, equity: number): Recommendation | null {
  const player = getPlayerToAct(state);
  const legal = getLegalActions(state);
  if (!player?.isHuman || !legal) return null;

  const opponents = countOpponents(state, player.id);
  const strongLine = Math.min(0.65, Math.max(0.35, 1.8 / (opponents + 1)));
  const hand = currentHand(t, player, state.board)?.name ?? t.explain.currentHandFallback;
  const chance = t.explain.chance(percent(equity));

  if (equity >= strongLine && (legal.bet || legal.raise)) {
    const label = legal.bet ? t.actions.bet : t.actions.raise;
    return { action: legal.bet ? "bet" : "raise", label, reason: t.explain.reasonAggressive(hand, chance, label) };
  }

  if (legal.check) {
    return {
      action: "check",
      label: t.actions.check,
      reason: equity * (opponents + 1) < 1 ? t.explain.reasonCheckWeak(hand, chance) : t.explain.reasonCheck(hand, chance),
    };
  }

  const call = legal.call ?? 0;
  const pot = getPotTotal(state);
  const need = call / (pot + call);
  const detail = t.explain.potOddsDetail(call, pot, percent(need));

  if (equity >= need) {
    return { action: "call", label: t.actions.call, reason: t.explain.reasonCall(hand, chance, percent(need)), detail };
  }
  return { action: "fold", label: t.actions.fold, reason: t.explain.reasonFold(hand, chance, percent(need)), detail };
}

// ---------- いま起きていること ----------

export function explainSituation(t: Dictionary, state: GameState, playerId: string): string[] {
  if (state.isHandOver) return [t.explain.handOver];

  const me = state.players.find((p) => p.id === playerId);
  const lines: string[] = [];

  switch (state.street) {
    case "preflop": {
      lines.push(t.explain.preflop);
      const blind = state.log.find((e) => e.playerId === playerId && (e.type === "smallBlind" || e.type === "bigBlind"));
      if (blind) lines.push(t.explain.blindRole(blind.type === "bigBlind", blind.paid));
      break;
    }
    case "flop":
      lines.push(t.explain.flop);
      break;
    case "turn":
      lines.push(t.explain.turn);
      break;
    case "river":
      lines.push(t.explain.river);
      break;
  }

  if (me?.status === "folded") lines.push(t.explain.youFolded);
  else if (me?.status === "allin") lines.push(t.explain.youAllin);

  const toAct = getPlayerToAct(state);
  if (toAct && !toAct.isHuman) {
    lines.push(t.explain.cpuThinking(playerName(t, toAct)));
  } else if (toAct?.isHuman) {
    const legal = getLegalActions(state);
    lines.push(legal?.check ? t.explain.yourTurnCheck : t.explain.yourTurnCall(legal?.call ?? 0));
  }
  return lines;
}

/** このストリートの行動の一覧 */
export function roundFlow(t: Dictionary, state: GameState): { name: string; text: string; current: boolean }[] {
  const nameOf = (id: string) => {
    const player = state.players.find((p) => p.id === id);
    return player ? playerName(t, player) : id;
  };
  const rows = state.log
    .filter((e) => e.street === state.street)
    .map((e) => ({ name: nameOf(e.playerId), text: t.actions.label(e), current: false }));
  const toAct = getPlayerToAct(state);
  if (toAct) rows.push({ name: playerName(t, toAct), text: t.game.thinkingFlow, current: true });
  return rows;
}

// ---------- ハンド後の振り返り ----------

function tiebreakMeaning(t: Dictionary, category: HandCategory, index: number): string {
  const e = t.explain;
  switch (category) {
    case HAND_CATEGORY.highCard:
    case HAND_CATEGORY.flush:
      return e.nthHighest(index);
    case HAND_CATEGORY.onePair:
      return index === 0 ? e.pair : e.kicker;
    case HAND_CATEGORY.twoPair:
      return [e.higherPair, e.lowerPair][index] ?? e.kicker;
    case HAND_CATEGORY.threeOfAKind:
      return index === 0 ? e.threeCards : e.kicker;
    case HAND_CATEGORY.fullHouse:
      return index === 0 ? e.threeCards : e.twoCards;
    case HAND_CATEGORY.fourOfAKind:
      return index === 0 ? e.fourCards : e.kicker;
    default:
      return e.topCard;
  }
}

/** 勝者と相手の役を比べた説明 */
export function compareExplanation(t: Dictionary, winnerName: string, winner: HandRank, loserName: string, loser: HandRank): string {
  const wName = t.hands.categoryPhrase(winner.category);
  const lName = t.hands.categoryPhrase(loser.category);
  if (winner.category !== loser.category) return t.explain.differentCategory(winnerName, wName, loserName, lName);

  const index = winner.tiebreak.findIndex((r, i) => r !== loser.tiebreak[i]);
  if (index < 0) return t.explain.split(winnerName, loserName, wName);

  const a = rankLabel(winner.tiebreak[index] as Rank);
  const b = rankLabel(loser.tiebreak[index] as Rank);
  const sameRanks = index > 0 && winner.category !== HAND_CATEGORY.highCard && winner.category !== HAND_CATEGORY.flush;
  return t.explain.sameCategory(wName, sameRanks, tiebreakMeaning(t, winner.category, index), a, b, winnerName);
}

export type HandReview = {
  title: string;
  lines: string[];
  /** 見せ合った人 (勝者が先、次にあなた) */
  showdown: { player: Player; hand: HandRank; won: boolean }[];
  /** あなたの収支 */
  net: number;
};

/** 勝者の見出し (例: 「CPU2 の勝ち」) */
export function resultTitle(t: Dictionary, state: GameState, winnerIds: string[]): string {
  const winners = winnerIds.map((id) => state.players.find((p) => p.id === id)!);
  if (winners.length > 1) return t.result.tie(t.common.list(winners.map((w) => playerName(t, w))));
  return winners[0].isHuman ? t.result.youWin : t.result.wins(playerName(t, winners[0]));
}

/**
 * 降りたあと「最後まで残っていたらどうなっていたか」。
 * 場のカードが5枚そろい、ショーダウンがあった場合だけ調べる
 */
export function foldWhatIf(t: Dictionary, state: GameState, me: Player): string | null {
  const showdown = state.result?.showdown ?? [];
  if (me.status !== "folded" || me.holeCards.length < 2 || state.board.length < 5 || showdown.length === 0) return null;

  const mine = evaluateBest([...me.holeCards, ...state.board]);
  const best = showdown.reduce((a, b) => (compareHands(a.hand, b.hand) >= 0 ? a : b));
  const bestPlayer = state.players.find((p) => p.id === best.playerId)!;
  const diff = compareHands(mine, best.hand);
  return t.explain.whatIf(
    handName(t, mine),
    playerName(t, bestPlayer),
    handName(t, best.hand),
    diff > 0 ? "win" : diff < 0 ? "lose" : "tie",
  );
}

export function reviewHand(t: Dictionary, state: GameState, playerId: string): HandReview | null {
  const result = state.result;
  if (!state.isHandOver || !result) return null;

  const playerOf = (id: string) => state.players.find((p) => p.id === id)!;
  const nameOf = (id: string) => playerName(t, playerOf(id));
  const me = playerOf(playerId);
  const mainPot = result.pots[0];
  const winners = mainPot.winnerIds.map(playerOf);
  const payout = result.payouts.find((p) => p.playerId === playerId)?.amount ?? 0;
  const net = payout - me.totalBet;
  const lines: string[] = [];
  const title = resultTitle(t, state, mainPot.winnerIds);

  if (result.showdown.length === 0) {
    const w = winners[0];
    lines.push(w.id === playerId ? t.explain.foldWinYou(mainPot.amount) : t.explain.foldWin(nameOf(w.id), mainPot.amount));
    if (me.status === "folded" && me.totalBet > 0) lines.push(t.explain.youLostBets(me.totalBet));
    return { title, lines, showdown: [], net };
  }

  const hands = new Map(result.showdown.map((s) => [s.playerId, s.hand]));
  const mainWinner = winners[0];
  const losers = result.showdown.filter((s) => !mainPot.winnerIds.includes(s.playerId));
  // あなたが負けていればあなたと、そうでなければ一番強かった相手と比べる
  const opponent = losers.find((s) => s.playerId === playerId) ?? [...losers].sort((a, b) => compareHands(b.hand, a.hand))[0];

  if (winners.length > 1) {
    const [a, b] = winners;
    lines.push(compareExplanation(t, nameOf(a.id), hands.get(a.id)!, nameOf(b.id), hands.get(b.id)!));
  } else if (opponent) {
    lines.push(compareExplanation(t, nameOf(mainWinner.id), hands.get(mainWinner.id)!, nameOf(opponent.playerId), opponent.hand));
  }

  result.pots.slice(1).forEach((pot, i) => {
    lines.push(t.explain.sidePot(i + 1, pot.amount, t.common.list(pot.winnerIds.map(nameOf))));
  });

  if (me.status === "folded") {
    lines.push(t.explain.youLostBets(me.totalBet));
    const whatIf = foldWhatIf(t, state, me);
    if (whatIf) lines.push(whatIf);
  }

  const showdown = result.showdown
    .map((s) => ({ player: playerOf(s.playerId), hand: s.hand, won: result.payouts.some((p) => p.playerId === s.playerId) }))
    .sort((a, b) => Number(b.won) - Number(a.won) || Number(b.player.id === playerId) - Number(a.player.id === playerId));

  return { title, lines, showdown, net };
}
