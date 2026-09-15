import type { Persona, Rng } from "@/engine/types";

export type PersonaParams = {
  /** コールの判断で勝率に足す値 (プラスほど粘る、マイナスほど降りやすい) */
  callBias: number;
  /** ベット・レイズする確率の倍率 */
  aggression: number;
  /** ブラフする確率の倍率 */
  bluff: number;
  /** 「強い手」とみなす基準の倍率 (大きいほど強い手でしか攻めない) */
  strongShift: number;
};

export const PERSONAS: Record<Persona, PersonaParams> = {
  balanced: { callBias: 0, aggression: 1, bluff: 1, strongShift: 1 },
  cautious: { callBias: -0.06, aggression: 0.7, bluff: 0.3, strongShift: 1.1 },
  aggressive: { callBias: 0, aggression: 1.5, bluff: 1.8, strongShift: 0.85 },
  stubborn: { callBias: 0.1, aggression: 0.6, bluff: 0.5, strongShift: 1.05 },
  tricky: { callBias: -0.02, aggression: 1.1, bluff: 3, strongShift: 1 },
};

export const PERSONA_IDS = Object.keys(PERSONAS) as Persona[];

export function personaParams(persona: Persona | undefined): PersonaParams {
  return PERSONAS[persona ?? "balanced"];
}

/** CPU の人数分、重ならないように性格を選ぶ (6人以上は繰り返す) */
export function pickPersonas(count: number, rng: Rng): Persona[] {
  const pool = [...PERSONA_IDS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return Array.from({ length: count }, (_, i) => pool[i % pool.length]);
}
