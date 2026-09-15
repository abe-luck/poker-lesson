import type { Pot } from "./types";

export type Contribution = { playerId: string; totalBet: number; folded: boolean };

function sameMembers(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

/**
 * 各プレイヤーがこのハンドで出した合計額から、メインポットとサイドポットを作る。
 * 出した額の少ない順に区切り、その額以上を出していて降りていない人がそのポットを争う。
 */
export function buildPots(contributions: readonly Contribution[]): Pot[] {
  const levels = [...new Set(contributions.map((c) => c.totalBet).filter((v) => v > 0))].sort(
    (a, b) => a - b,
  );

  const pots: Pot[] = [];
  let previous = 0;
  for (const level of levels) {
    const amount = contributions.reduce(
      (sum, c) => sum + Math.min(c.totalBet, level) - Math.min(c.totalBet, previous),
      0,
    );
    const eligiblePlayerIds = contributions
      .filter((c) => !c.folded && c.totalBet >= level)
      .map((c) => c.playerId);
    previous = level;

    const last = pots.at(-1);
    // 争う人がいない額 (降りた人だけが出した分) は直前のポットに含める
    if (last && (eligiblePlayerIds.length === 0 || sameMembers(last.eligiblePlayerIds, eligiblePlayerIds))) {
      last.amount += amount;
    } else {
      pots.push({ amount, eligiblePlayerIds });
    }
  }
  return pots;
}
