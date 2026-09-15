import { describe, expect, it } from "vitest";
import { buildPots } from "@/engine/pots";

const c = (playerId: string, totalBet: number, folded = false) => ({ playerId, totalBet, folded });

describe("buildPots", () => {
  it("全員同じ額ならポットは1つ", () => {
    expect(buildPots([c("A", 100), c("B", 100), c("C", 100)])).toEqual([
      { amount: 300, eligiblePlayerIds: ["A", "B", "C"] },
    ]);
  });

  it("オールインした人がいるとサイドポットができる", () => {
    expect(buildPots([c("A", 50), c("B", 200), c("C", 200)])).toEqual([
      { amount: 150, eligiblePlayerIds: ["A", "B", "C"] },
      { amount: 300, eligiblePlayerIds: ["B", "C"] },
    ]);
  });

  it("オールインが複数いると段階的に分かれる", () => {
    expect(buildPots([c("A", 30), c("B", 80), c("C", 150), c("D", 150)])).toEqual([
      { amount: 120, eligiblePlayerIds: ["A", "B", "C", "D"] },
      { amount: 150, eligiblePlayerIds: ["B", "C", "D"] },
      { amount: 140, eligiblePlayerIds: ["C", "D"] },
    ]);
  });

  it("降りた人のチップはポットに入るが、争う権利はない", () => {
    expect(buildPots([c("A", 40, true), c("B", 100), c("C", 100)])).toEqual([
      { amount: 240, eligiblePlayerIds: ["B", "C"] },
    ]);
  });

  it("降りた人だけが出した額は直前のポットに含める", () => {
    expect(buildPots([c("A", 50), c("B", 120, true), c("C", 50)])).toEqual([
      { amount: 220, eligiblePlayerIds: ["A", "C"] },
    ]);
  });
});
