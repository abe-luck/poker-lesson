import { describe, expect, it } from "vitest";
import { decideCpuAction } from "@/ai/cpu";
import { PERSONA_IDS, pickPersonas } from "@/ai/personas";
import { seededRng } from "@/engine/cards";
import type { GameState, Persona } from "@/engine/types";
import { generateQuestion } from "@/practice/generate";

/** 練習問題の場面 (あなたの番) を、性格つきの CPU の番として扱う */
function asCpu(state: GameState, persona: Persona): GameState {
  return {
    ...state,
    players: state.players.map((p) => (p.isHuman ? { ...p, isHuman: false, cpuLevel: "normal" as const, persona } : p)),
  };
}

describe("CPUの性格", () => {
  it("同じ場面でも、性格によって降り方とコールの多さが変わる", () => {
    // 相手がベットしてきた場面をいくつか作る
    const source = seededRng(21);
    const spots: GameState[] = [];
    while (spots.length < 24) {
      const q = generateQuestion(source);
      if (q.decision.need !== null) spots.push(q.state);
    }

    const count = (persona: Persona) => {
      const rng = seededRng(7);
      let calls = 0;
      let folds = 0;
      for (const spot of spots) {
        const action = decideCpuAction(asCpu(spot, persona), { rng, iterations: 300 });
        if (action.type === "call") calls++;
        if (action.type === "fold") folds++;
      }
      return { calls, folds };
    };

    const cautious = count("cautious");
    const stubborn = count("stubborn");
    expect(stubborn.calls).toBeGreaterThan(cautious.calls);
    expect(cautious.folds).toBeGreaterThan(stubborn.folds);
  });

  it("強気な性格はベットやレイズが多い", () => {
    const source = seededRng(33);
    const spots = Array.from({ length: 24 }, () => generateQuestion(source).state);
    const aggressiveCount = (persona: Persona) => {
      const rng = seededRng(3);
      return spots.filter((spot) => ["bet", "raise", "allin"].includes(decideCpuAction(asCpu(spot, persona), { rng, iterations: 300 }).type)).length;
    };
    expect(aggressiveCount("aggressive")).toBeGreaterThan(aggressiveCount("cautious"));
  });

  it("人数分の性格を配る (5人までは重ならない)", () => {
    const rng = seededRng(1);
    expect(new Set(pickPersonas(5, rng)).size).toBe(5);
    expect(pickPersonas(3, rng)).toHaveLength(3);
    expect(PERSONA_IDS).toContain("balanced");
  });
});
