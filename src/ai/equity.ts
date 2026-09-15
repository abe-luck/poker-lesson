import { createDeck, cryptoRng, sameCard } from "@/engine/cards";
import { scoreBest } from "@/engine/evaluator";
import type { Card, Rng } from "@/engine/types";

/**
 * 勝てる見込み (0〜1) をモンテカルロ法で見積もる。
 * 相手の手札と残りの場のカードをランダムに配って勝敗を数える。引き分けは人数で割る。
 */
export function estimateEquity(
  hole: readonly Card[],
  board: readonly Card[],
  opponents: number,
  iterations = 300,
  rng: Rng = cryptoRng,
): number {
  if (opponents <= 0) return 1;

  const known = [...hole, ...board];
  const deck = createDeck().filter((c) => !known.some((k) => sameCard(k, c)));
  const missing = 5 - board.length;
  const needed = missing + opponents * 2;

  let score = 0;
  for (let it = 0; it < iterations; it++) {
    // 必要な枚数だけ部分的にシャッフル
    for (let i = 0; i < needed; i++) {
      const j = i + Math.floor(rng() * (deck.length - i));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const fullBoard = [...board, ...deck.slice(0, missing)];
    const mine = scoreBest([...hole, ...fullBoard]);

    let tied = 1;
    let lost = false;
    for (let o = 0; o < opponents; o++) {
      const theirs = scoreBest([deck[missing + o * 2], deck[missing + o * 2 + 1], ...fullBoard]);
      if (theirs > mine) {
        lost = true;
        break;
      }
      if (theirs === mine) tied++;
    }
    if (!lost) score += 1 / tied;
  }
  return score / iterations;
}
