import { decideCpuAction } from "@/ai/cpu";
import { estimateEquity } from "@/ai/equity";
import { pickPersonas } from "@/ai/personas";
import { applyAction, createGame, getLegalActions, getPlayerToAct, startHand } from "@/engine/game";
import type { ActionType, GameState, Rng, Street } from "@/engine/types";
import { decideRecommendation, type Decision } from "@/guide/guide";

export type PracticeQuestion = {
  /** あなたの番で止まっている場面 */
  state: GameState;
  equity: number;
  decision: Decision;
};

export type Grade = "correct" | "close" | "wrong";

/** 答え合わせ。おすすめと同じなら正解、攻めるべき場面で受けに回った場合などは「惜しい」 */
export function gradeAnswer(answer: ActionType, decision: Decision): Grade {
  if (answer === decision.action) return "correct";
  const aggressive = ["bet", "raise"];
  const passive = ["check", "call"];
  if (aggressive.includes(decision.action) && passive.includes(answer)) return "close";
  if (decision.action === "call" && aggressive.includes(answer)) return "close";
  return "wrong";
}

const STREETS: Street[] = ["preflop", "flop", "turn", "river"];
/** 判断が微妙な場面は問題にしない (答えが割れるため) */
const MARGIN = 0.05;
const EQUITY_ITERATIONS = 1200;

/** 練習問題を1つ作る。あなたの番で、答えがはっきり決まる場面を探す */
export function generateQuestion(rng: Rng, attempts = 60): PracticeQuestion {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const targetStreet = STREETS[Math.floor(rng() * STREETS.length)];
    // 半分くらいは「相手がベットしてきた場面」にする
    const wantFacingBet = rng() < 0.6;
    const cpuCount = 1 + Math.floor(rng() * 3);
    const personas = pickPersonas(cpuCount, rng);

    const game = createGame({
      mode: "beginner",
      players: [
        { id: "you", name: "you", isHuman: true },
        ...Array.from({ length: cpuCount }, (_, i) => ({
          id: `cpu${i + 1}`,
          name: `CPU${i + 1}`,
          isHuman: false,
          cpuLevel: "normal" as const,
          persona: personas[i],
        })),
      ],
      startingStack: 1000,
      blinds: { small: 5, big: 10 },
      dealerIndex: Math.floor(rng() * (cpuCount + 1)),
    });

    let state = startHand(game, { rng });
    let stopped = false;
    for (let step = 0; step < 60 && !state.isHandOver; step++) {
      const toAct = getPlayerToAct(state);
      if (!toAct) break;
      if (!toAct.isHuman) {
        state = applyAction(state, decideCpuAction(state, { rng, iterations: 80 }));
        continue;
      }
      if (state.street === targetStreet) {
        stopped = true;
        break;
      }
      // 目的のストリートまでは、無理のない範囲で参加を続ける
      const legal = getLegalActions(state)!;
      if (legal.check) state = applyAction(state, { type: "check" });
      else if ((legal.call ?? 0) <= 60) state = applyAction(state, { type: "call" });
      else break;
    }
    if (!stopped) continue;

    const legal = getLegalActions(state);
    const me = getPlayerToAct(state);
    if (!legal || !me?.isHuman) continue;
    if (wantFacingBet !== (legal.call !== null)) continue;

    const opponents = state.players.filter((p) => !p.isHuman && (p.status === "active" || p.status === "allin")).length;
    const equity = estimateEquity(me.holeCards, state.board, opponents, EQUITY_ITERATIONS, rng);
    const decision = decideRecommendation(state, equity);
    if (!decision) continue;

    // 基準ぎりぎりの場面は避ける
    if (decision.need !== null && Math.abs(equity - decision.need) < MARGIN) continue;
    if (Math.abs(equity - decision.strongLine) < MARGIN) continue;

    return { state, equity, decision };
  }
  throw new Error("練習問題を作れませんでした");
}
