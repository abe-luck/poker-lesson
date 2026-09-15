import type { Card, HandCategory, HandRank } from "./types";

export const HAND_CATEGORY = {
  highCard: 0,
  onePair: 1,
  twoPair: 2,
  threeOfAKind: 3,
  straight: 4,
  flush: 5,
  fullHouse: 6,
  fourOfAKind: 7,
  straightFlush: 8,
  royalFlush: 9,
} as const satisfies Record<string, HandCategory>;

/** 5種類の数字 (大きい順) がストレートならその一番上の数字。A-2-3-4-5 は 5 */
function straightHigh(ranksDesc: number[]): number | null {
  if (ranksDesc.length !== 5) return null;
  if (ranksDesc[0] - ranksDesc[4] === 4) return ranksDesc[0];
  if (ranksDesc[0] === 14 && ranksDesc[1] === 5 && ranksDesc[4] === 2) return 5;
  return null;
}

export function evaluateFive(cards: readonly Card[]): HandRank {
  if (cards.length !== 5) throw new Error("役判定には5枚のカードが必要です");

  const counts = new Map<number, number>();
  for (const card of cards) counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1);
  // 枚数の多い順 → 数字の大きい順
  const groups = [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const ranksDesc = groups.map(([rank]) => rank);
  const isFlush = cards.every((card) => card.suit === cards[0].suit);
  const high = straightHigh(ranksDesc);

  let category: HandCategory;
  let tiebreak = ranksDesc;
  if (high !== null && isFlush) {
    category = high === 14 ? HAND_CATEGORY.royalFlush : HAND_CATEGORY.straightFlush;
    tiebreak = [high];
  } else if (groups[0][1] === 4) {
    category = HAND_CATEGORY.fourOfAKind;
  } else if (groups[0][1] === 3 && groups[1][1] === 2) {
    category = HAND_CATEGORY.fullHouse;
  } else if (isFlush) {
    category = HAND_CATEGORY.flush;
  } else if (high !== null) {
    category = HAND_CATEGORY.straight;
    tiebreak = [high];
  } else if (groups[0][1] === 3) {
    category = HAND_CATEGORY.threeOfAKind;
  } else if (groups[0][1] === 2 && groups[1][1] === 2) {
    category = HAND_CATEGORY.twoPair;
  } else if (groups[0][1] === 2) {
    category = HAND_CATEGORY.onePair;
  } else {
    category = HAND_CATEGORY.highCard;
  }

  // 表示用の並び: 役を作る数字が先。A-2-3-4-5 は 5-4-3-2-A
  const isWheel = high === 5;
  const sortKey = (card: Card) =>
    isWheel ? (card.rank === 14 ? 1 : card.rank) : -ranksDesc.indexOf(card.rank);
  const bestFive = [...cards].sort((a, b) => sortKey(b) - sortKey(a));

  return { category, tiebreak, bestFive };
}

/** a が強ければ正、b が強ければ負、同じ強さなら 0 */
export function compareHands(a: HandRank, b: HandRank): number {
  if (a.category !== b.category) return a.category - b.category;
  const length = Math.max(a.tiebreak.length, b.tiebreak.length);
  for (let i = 0; i < length; i++) {
    const diff = (a.tiebreak[i] ?? 0) - (b.tiebreak[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** 5〜7枚から一番強い5枚の役を求める */
export function evaluateBest(cards: readonly Card[]): HandRank {
  const n = cards.length;
  if (n < 5 || n > 7) throw new Error("役判定には5〜7枚のカードが必要です");

  let best: HandRank | null = null;
  for (let a = 0; a < n - 4; a++)
    for (let b = a + 1; b < n - 3; b++)
      for (let c = b + 1; c < n - 2; c++)
        for (let d = c + 1; d < n - 1; d++)
          for (let e = d + 1; e < n; e++) {
            const hand = evaluateFive([cards[a], cards[b], cards[c], cards[d], cards[e]]);
            if (best === null || compareHands(hand, best) > 0) best = hand;
          }
  return best!;
}
