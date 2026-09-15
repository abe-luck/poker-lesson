import { describe, expect, it } from "vitest";
import { decideCpuAction, postflopTier, preflopTier } from "@/ai/cpu";
import { parseCards, seededRng } from "@/engine/cards";
import { applyAction, rebuy, startHand } from "@/engine/game";
import { newGame } from "../helpers";

describe("手の強さ", () => {
  it.each([
    ["As Ah", 3],
    ["Ac Kd", 3],
    ["7s 7h", 2],
    ["Qs Jd", 2],
    ["Jc 4d", 1],
    ["8h 7h", 1],
    ["7c 2d", 0],
  ])("プリフロップ %s → %i", (hole, tier) => {
    expect(preflopTier(parseCards(hole))).toBe(tier);
  });

  it.each([
    ["Ks 7d", "Kh 9c 2d", 2], // トップペア
    ["9s 8d", "Kh 9c 2d", 1], // 2番目のペア
    ["Ks 9d", "Kh 9c 2d", 2], // ツーペア
    ["2s 2c", "Kh 9c 2d", 3], // スリーカード
    ["As Qd", "7h 7c 7d", 0], // 場のスリーカードに乗っただけ
    ["3s 4d", "Ah Kh Qh Jh Th", 0], // 場のロイヤルフラッシュ
  ])("%s / 場 %s → %i", (hole, board, tier) => {
    expect(postflopTier(parseCards(hole), parseCards(board))).toBe(tier);
  });
});

describe("decideCpuAction", () => {
  it.each(["easy", "normal", "hard"] as const)("%s: どんな状況でも実行できる行動を返す", (level) => {
    const rng = seededRng(7);
    let s = newGame(6);
    s = { ...s, players: s.players.map((p) => ({ ...p, cpuLevel: level })) };
    for (let hand = 0; hand < 120; hand++) {
      for (const p of s.players) if (p.stack === 0) s = rebuy(s, p.id, 1000);
      s = startHand(s, { rng });
      while (!s.isHandOver) {
        s = applyAction(s, decideCpuAction(s, { rng, iterations: 20 })); // 不正な行動なら例外になる
      }
    }
    expect(s.handNumber).toBe(120);
  });

  it("ふつう以上のCPUは、強い手でフォールドせず、弱い手で大きなベットにはコールしない", () => {
    // ヘッズアップ: P0 (ディーラー/SB) が 500 にレイズ → P1 (BB) の判断
    const decide = (hole: string) => {
      const deck = [...parseCards(`${hole.split(" ")[0]} 2c ${hole.split(" ")[1]} 3d`)];
      let s = newGame(2);
      s = { ...s, players: s.players.map((p) => ({ ...p, cpuLevel: "normal" as const })) };
      s = startHand(s, { deck: [...deck, ...parseCards("4h 5s 6d 8c 9h Th Jd")] });
      // 配る順は P1, P0。P1 の手札が hole になるよう組んである
      s = applyAction(s, { type: "raise", amount: 500 });
      return decideCpuAction(s, { rng: seededRng(1), iterations: 400 }).type;
    };
    expect(["call", "raise", "allin"]).toContain(decide("As Ah"));
    expect(decide("7c 2d")).toBe("fold");
  });
});

describe("rebuy", () => {
  it("ハンドの合間に指定額まで補充する", () => {
    const s = rebuy({ ...newGame(2), players: newGame(2).players.map((p, i) => ({ ...p, stack: i === 0 ? 0 : 1000 })) }, "P0", 1000);
    expect(s.players[0].stack).toBe(1000);
    expect(() => rebuy(startHand(s, { rng: seededRng(1) }), "P0", 1000)).toThrow();
  });
});
