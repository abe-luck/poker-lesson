import { describe, expect, it } from "vitest";
import { seededRng } from "@/engine/cards";
import { getLegalActions, getPlayerToAct } from "@/engine/game";
import { recommend } from "@/guide/guide";
import { ja } from "@/i18n/ja";
import { gradeAnswer, generateQuestion } from "@/practice/generate";

describe("練習問題", () => {
  it("あなたの番で、答えがはっきりしている場面を作る", () => {
    const rng = seededRng(11);
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion(rng);
      const me = getPlayerToAct(q.state)!;
      const legal = getLegalActions(q.state)!;

      expect(me.isHuman).toBe(true);
      expect(me.holeCards).toHaveLength(2);
      expect(q.state.isHandOver).toBe(false);
      // 微妙な場面 (基準ぎりぎり) は出さない
      if (q.decision.need !== null) expect(Math.abs(q.equity - q.decision.need)).toBeGreaterThanOrEqual(0.05);
      expect(Math.abs(q.equity - q.decision.strongLine)).toBeGreaterThanOrEqual(0.05);
      // 答えは、その場面で実際にできる行動
      if (q.decision.action === "check") expect(legal.check).toBe(true);
      if (q.decision.action === "call") expect(legal.call).not.toBeNull();
      if (q.decision.action === "bet") expect(legal.bet).not.toBeNull();
      if (q.decision.action === "raise") expect(legal.raise).not.toBeNull();
      // 解説はおすすめ機能と同じ判断になる
      expect(recommend(ja, q.state, q.equity)?.action).toBe(q.decision.action);
    }
  });

  it("いろいろな場面が出る", () => {
    const rng = seededRng(5);
    const questions = Array.from({ length: 24 }, () => generateQuestion(rng));
    expect(new Set(questions.map((q) => q.state.street)).size).toBeGreaterThanOrEqual(3);
    expect(new Set(questions.map((q) => q.decision.action)).size).toBeGreaterThanOrEqual(3);
    // 相手がベットしてきた場面と、チェックできる場面の両方が出る
    expect(questions.some((q) => q.decision.need !== null)).toBe(true);
    expect(questions.some((q) => q.decision.need === null)).toBe(true);
  });

  it("答え合わせ", () => {
    const decision = { action: "raise", need: 0.3, strongLine: 0.5, opponents: 2 } as const;
    expect(gradeAnswer("raise", decision)).toBe("correct");
    expect(gradeAnswer("call", decision)).toBe("close");
    expect(gradeAnswer("fold", decision)).toBe("wrong");
    expect(gradeAnswer("check", { ...decision, action: "fold" })).toBe("wrong");
    expect(gradeAnswer("bet", { ...decision, action: "call" })).toBe("close");
  });
});
