import type { Card, Rank, Rng, Suit } from "./types";

export const SUITS: readonly Suit[] = ["s", "h", "d", "c"];
export const RANKS: readonly Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

const RANK_CHARS = "23456789TJQKA";

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit })));
}

export const cryptoRng: Rng = () => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 0x1_0000_0000;
};

/** 種を固定した乱数 (mulberry32)。テストとチュートリアル用 */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x1_0000_0000;
  };
}

/** Fisher–Yates シャッフル (元の配列は変更しない) */
export function shuffle<T>(items: readonly T[], rng: Rng = cryptoRng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function sameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

/** 例: { rank: 14, suit: "s" } → "As" */
export function cardToString(card: Card): string {
  return RANK_CHARS[card.rank - 2] + card.suit;
}

/** 例: "As" → { rank: 14, suit: "s" } */
export function parseCard(text: string): Card {
  const index = RANK_CHARS.indexOf(text.charAt(0).toUpperCase());
  const suit = text.charAt(1).toLowerCase();
  if (text.length !== 2 || index < 0 || !(SUITS as readonly string[]).includes(suit)) {
    throw new Error(`カードの表記が正しくありません: ${text}`);
  }
  return { rank: (index + 2) as Rank, suit: suit as Suit };
}

/** 例: "As Kd 7h" → 3枚 */
export function parseCards(text: string): Card[] {
  return text.split(/\s+/).filter(Boolean).map(parseCard);
}
