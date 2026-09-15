import { describe, expect, it } from "vitest";
import { seededRng } from "@/engine/cards";
import { applyAction, setBlinds, startHand } from "@/engine/game";
import { blindLevel, blindsForLevel, handsUntilNextLevel, HANDS_PER_LEVEL } from "@/engine/tournament";
import { newGame } from "../helpers";

describe("トーナメントのブラインド", () => {
  it("10ハンドごとにレベルが上がる", () => {
    expect(HANDS_PER_LEVEL).toBe(10);
    expect(blindLevel(0)).toBe(0);
    expect(blindLevel(9)).toBe(0);
    expect(blindLevel(10)).toBe(1);
    expect(blindLevel(1000)).toBe(12); // 最大レベルで止まる
  });

  it("最初のブラインドの倍率で上がる", () => {
    const base = { small: 5, big: 10 };
    expect(blindsForLevel(base, 0)).toEqual({ small: 5, big: 10 });
    expect(blindsForLevel(base, 1)).toEqual({ small: 10, big: 20 });
    expect(blindsForLevel(base, 3)).toEqual({ small: 25, big: 50 });
  });

  it("次のレベルまでの残りハンド数 (今のハンドを含む)", () => {
    expect(handsUntilNextLevel(1)).toBe(10);
    expect(handsUntilNextLevel(10)).toBe(1);
    expect(handsUntilNextLevel(11)).toBe(10);
  });

  it("ハンドの合間だけブラインドを変えられる", () => {
    let s = startHand(newGame(2), { rng: seededRng(1) });
    expect(() => setBlinds(s, { small: 10, big: 20 })).toThrow();
    s = applyAction(s, { type: "fold" });
    s = startHand(setBlinds(s, { small: 10, big: 20 }), { rng: seededRng(2) });
    expect(s.players.map((p) => p.currentBet).sort((a, b) => a - b)).toEqual([10, 20]);
  });
});
