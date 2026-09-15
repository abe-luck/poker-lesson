import { actionLabel, formatChips, HAND_CATEGORY_NAMES, handName, rankLabel } from "@/content/ja";
import { compareHands, evaluateBest, HAND_CATEGORY } from "@/engine/evaluator";
import { getLegalActions, getPlayerToAct, getPotTotal } from "@/engine/game";
import type { Card, GameState, HandCategory, HandRank, Player, Rank } from "@/engine/types";

// ---------- 今の役と手の強さ ----------

export type CurrentHand = {
  name: string;
  /** 役を作っているカード (強調表示用。キッカーは含めない) */
  keyCards: Card[];
};

export function currentHand(player: Player, board: readonly Card[]): CurrentHand | null {
  if (player.holeCards.length < 2) return null;

  if (board.length === 0) {
    const [high, low] = [...player.holeCards].sort((a, b) => b.rank - a.rank);
    return high.rank === low.rank
      ? { name: `ワンペア（${rankLabel(high.rank)}のペア）`, keyCards: [high, low] }
      : { name: `ハイカード（${rankLabel(high.rank)}が一番上）`, keyCards: [high] };
  }

  const hand = evaluateBest([...player.holeCards, ...board]);
  return { name: handName(hand), keyCards: keyCardsOf(hand) };
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

export const STRENGTH_LABELS = ["弱い", "ふつう", "強い", "とても強い"] as const;
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

const percent = (v: number) => `${Math.round(v * 100)}%`;

export function recommend(state: GameState, equity: number): Recommendation | null {
  const player = getPlayerToAct(state);
  const legal = getLegalActions(state);
  if (!player?.isHuman || !legal) return null;

  const opponents = countOpponents(state, player.id);
  // 相手が多いほど、平均的な勝率は下がるので「強い」の基準も下げる
  const strongLine = Math.min(0.65, Math.max(0.35, 1.8 / (opponents + 1)));
  const hand = currentHand(player, state.board)?.name ?? "今の手";
  const chance = `勝てる見込みは約${percent(equity)}`;

  if (equity >= strongLine && (legal.bet || legal.raise)) {
    const label = legal.bet ? "ベット" : "レイズ";
    return {
      action: legal.bet ? "bet" : "raise",
      label,
      reason: `${hand}で、${chance}と高いためです。${label}してポットを大きくしましょう。`,
    };
  }

  if (legal.check) {
    return {
      action: "check",
      label: "チェック",
      reason:
        equity * (opponents + 1) < 1
          ? `チップを払わずに次へ進めます。${hand}で${chance}なので、無理に賭ける必要はありません。`
          : `チップを払わずに次へ進めます。${hand}で${chance}です。`,
    };
  }

  const call = legal.call ?? 0;
  const pot = getPotTotal(state);
  const need = call / (pot + call);
  const detail = `コールに必要な勝率 = 払う額 ${formatChips(call)} ÷（ポット ${formatChips(pot)} ＋ ${formatChips(call)}）＝ 約${percent(need)}`;

  if (equity >= need) {
    return {
      action: "call",
      label: "コール",
      reason: `${hand}で、${chance}です。コールに必要な勝率（約${percent(need)}）を上回っているためです。`,
      detail,
    };
  }
  return {
    action: "fold",
    label: "フォールド",
    reason: `${hand}で、${chance}です。コールに必要な勝率（約${percent(need)}）に届かないため、降りるのがおすすめです。`,
    detail,
  };
}

// ---------- いま起きていること ----------

export function explainSituation(state: GameState, playerId: string): string[] {
  if (state.isHandOver) return ["ハンドが終わりました。結果を確認して、次のハンドへ進みましょう。"];

  const me = state.players.find((p) => p.id === playerId);
  const lines: string[] = [];

  switch (state.street) {
    case "preflop": {
      lines.push("手札が2枚ずつ配られました。今は手札だけを見て、勝負を続けるかを決める段階です。");
      const blind = state.log.find((e) => e.playerId === playerId && (e.type === "smallBlind" || e.type === "bigBlind"));
      if (blind) {
        const role = blind.type === "smallBlind" ? "スモールブラインド" : "ビッグブラインド";
        lines.push(`あなたは${role}として ${formatChips(blind.paid)} を自動で出しています。`);
      }
      break;
    }
    case "flop":
      lines.push("場に3枚のカードが開きました。手札2枚と場のカードを合わせて、一番強い5枚で役を作ります。");
      break;
    case "turn":
      lines.push("場に4枚目のカード（ターン）が開きました。場のカードは残り1枚です。");
      break;
    case "river":
      lines.push("最後の5枚目のカード（リバー）が開きました。このベットが終わると、残った人で手札を見せ合います。");
      break;
  }

  if (me?.status === "folded") {
    lines.push("あなたはこのハンドを降りました。残りの人の勝負を見て、流れを覚えましょう。");
  } else if (me?.status === "allin") {
    lines.push("あなたはオールインしています。これ以上チップを出す必要はなく、最後まで勝負に参加します。");
  }

  const toAct = getPlayerToAct(state);
  if (toAct && !toAct.isHuman) {
    lines.push(`${toAct.name} が行動を考えています。`);
  } else if (toAct?.isHuman) {
    const legal = getLegalActions(state);
    lines.push(
      legal?.check
        ? "あなたの番です。追加で払う必要がないので、チェックできます。"
        : `あなたの番です。続けるには ${formatChips(legal?.call ?? 0)} 払ってコールします。`,
    );
  }
  return lines;
}

/** このストリートの行動の一覧 */
export function roundFlow(state: GameState): { name: string; text: string; current: boolean }[] {
  const nameOf = (id: string) => state.players.find((p) => p.id === id)?.name ?? id;
  const rows = state.log
    .filter((e) => e.street === state.street)
    .map((e) => ({ name: nameOf(e.playerId), text: actionLabel(e), current: false }));
  const toAct = getPlayerToAct(state);
  if (toAct) rows.push({ name: toAct.name, text: "考え中", current: true });
  return rows;
}

// ---------- ハンド後の振り返り ----------

function tiebreakMeaning(category: HandCategory, index: number): string {
  const kicker = "残りのカード（キッカー）";
  switch (category) {
    case HAND_CATEGORY.highCard:
    case HAND_CATEGORY.flush:
      return index === 0 ? "一番大きいカード" : `${index + 1}番目に大きいカード`;
    case HAND_CATEGORY.onePair:
      return index === 0 ? "ペア" : kicker;
    case HAND_CATEGORY.twoPair:
      return ["大きい方のペア", "小さい方のペア"][index] ?? kicker;
    case HAND_CATEGORY.threeOfAKind:
      return index === 0 ? "3枚そろったカード" : kicker;
    case HAND_CATEGORY.fullHouse:
      return index === 0 ? "3枚そろったカード" : "2枚そろったカード";
    case HAND_CATEGORY.fourOfAKind:
      return index === 0 ? "4枚そろったカード" : kicker;
    default:
      return "一番上のカード";
  }
}

/** 勝者と相手の役を比べた説明 */
export function compareExplanation(winnerName: string, winner: HandRank, loserName: string, loser: HandRank): string {
  const wName = HAND_CATEGORY_NAMES[winner.category];
  const lName = HAND_CATEGORY_NAMES[loser.category];
  if (winner.category !== loser.category) {
    return `${winnerName} は${wName}、${loserName} は${lName}でした。${wName}の方が強い役なので、${winnerName} の勝ちです。`;
  }
  const index = winner.tiebreak.findIndex((r, i) => r !== loser.tiebreak[i]);
  if (index < 0) {
    return `${winnerName} と ${loserName} はどちらも同じ強さの${wName}なので、ポットを山分けしました。`;
  }
  const a = rankLabel(winner.tiebreak[index] as Rank);
  const b = rankLabel(loser.tiebreak[index] as Rank);
  const lead = index > 0 && winner.category !== HAND_CATEGORY.highCard && winner.category !== HAND_CATEGORY.flush
    ? "役の数字も同じなので、"
    : "";
  return `どちらも${wName}でした。${lead}${tiebreakMeaning(winner.category, index)}で比べると、${a} と ${b} で ${a} の方が強いので、${winnerName} の勝ちです。`;
}

export type HandReview = {
  title: string;
  lines: string[];
  /** 見せ合った人 (勝者が先) */
  showdown: { player: Player; hand: HandRank; won: boolean }[];
  /** あなたの収支 */
  net: number;
};

export function reviewHand(state: GameState, playerId: string): HandReview | null {
  const result = state.result;
  if (!state.isHandOver || !result) return null;

  const playerOf = (id: string) => state.players.find((p) => p.id === id)!;
  const me = playerOf(playerId);
  const mainPot = result.pots[0];
  const winners = mainPot.winnerIds.map(playerOf);
  const payout = result.payouts.find((p) => p.playerId === playerId)?.amount ?? 0;
  const net = payout - me.totalBet;
  const lines: string[] = [];

  const title =
    winners.length > 1
      ? `${winners.map((w) => w.name).join(" と ")} で引き分け`
      : winners[0].id === playerId
        ? "あなたの勝ち"
        : `${winners[0].name} の勝ち`;

  if (result.showdown.length === 0) {
    const w = winners[0];
    lines.push(
      w.id === playerId
        ? `ほかの全員がフォールドしたので、あなたが手札を見せずにポット ${formatChips(mainPot.amount)} を獲得しました。`
        : `ほかの全員がフォールドしたので、${w.name} が手札を見せずにポット ${formatChips(mainPot.amount)} を獲得しました。`,
    );
    if (me.status === "folded" && me.totalBet > 0) {
      lines.push(`あなたは途中で降りたため、出したチップ（${formatChips(me.totalBet)}）は戻りません。`);
    }
    return { title, lines, showdown: [], net };
  }

  const hands = new Map(result.showdown.map((s) => [s.playerId, s.hand]));
  const mainWinner = winners[0];
  const losers = result.showdown.filter((s) => !mainPot.winnerIds.includes(s.playerId));
  // あなたが負けていればあなたと、そうでなければ一番強かった相手と比べる
  const opponent =
    losers.find((s) => s.playerId === playerId) ??
    [...losers].sort((a, b) => compareHands(b.hand, a.hand))[0];

  if (winners.length > 1) {
    const [a, b] = winners;
    lines.push(compareExplanation(a.name, hands.get(a.id)!, b.name, hands.get(b.id)!));
  } else if (opponent) {
    lines.push(compareExplanation(mainWinner.name, hands.get(mainWinner.id)!, playerOf(opponent.playerId).name, opponent.hand));
  }

  result.pots.slice(1).forEach((pot, i) => {
    const names = pot.winnerIds.map((id) => playerOf(id).name).join(" と ");
    lines.push(`サイドポット${i + 1}（${formatChips(pot.amount)}）は、オールインした人より多く賭けた人どうしで争い、${names} が獲得しました。`);
  });

  if (me.status === "folded") {
    lines.push(`あなたは途中で降りたため、出したチップ（${formatChips(me.totalBet)}）は戻りません。`);
  }

  const showdown = result.showdown
    .map((s) => ({ player: playerOf(s.playerId), hand: s.hand, won: result.payouts.some((p) => p.playerId === s.playerId) }))
    .sort((a, b) => Number(b.won) - Number(a.won) || Number(b.player.id === playerId) - Number(a.player.id === playerId));

  return { title, lines, showdown, net };
}
