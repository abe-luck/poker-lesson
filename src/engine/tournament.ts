import type { Blinds } from "./types";

/** 何ハンドごとにブラインドが上がるか */
export const HANDS_PER_LEVEL = 10;

/** 最初のブラインドに対する倍率 */
const LEVEL_MULTIPLIERS = [1, 2, 3, 5, 10, 15, 20, 30, 40, 60, 100, 150, 200];

/** handsPlayed ハンド終わった時点での次のハンドのレベル (0 始まり) */
export function blindLevel(handsPlayed: number): number {
  return Math.min(Math.floor(handsPlayed / HANDS_PER_LEVEL), LEVEL_MULTIPLIERS.length - 1);
}

export function blindsForLevel(base: Blinds, level: number): Blinds {
  const m = LEVEL_MULTIPLIERS[Math.min(level, LEVEL_MULTIPLIERS.length - 1)];
  return { small: base.small * m, big: base.big * m };
}

/** 今のハンド (handNumber 番目) のあと、ブラインドが上がるまでに残るハンド数 (今のハンドを含む) */
export function handsUntilNextLevel(handNumber: number): number | null {
  if (blindLevel(handNumber - 1) >= LEVEL_MULTIPLIERS.length - 1) return null;
  return HANDS_PER_LEVEL - ((handNumber - 1) % HANDS_PER_LEVEL);
}
