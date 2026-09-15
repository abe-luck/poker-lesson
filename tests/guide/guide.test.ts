import { describe, expect, it } from "vitest";
import { estimateEquity } from "@/ai/equity";
import { cardToString, parseCards, seededRng } from "@/engine/cards";
import { evaluateBest } from "@/engine/evaluator";
import { startHand } from "@/engine/game";
import type { Player } from "@/engine/types";
import {
  compareExplanation,
  currentHand,
  explainSituation,
  recommend,
  reviewHand,
  roundFlow,
  strengthLevel,
} from "@/guide/guide";
import { act, newGame, riggedDeck } from "../helpers";

const player = (hole: string): Player => ({
  id: "P0",
  name: "あなた",
  isHuman: true,
  stack: 1000,
  holeCards: parseCards(hole),
  currentBet: 0,
  totalBet: 0,
  hasActed: false,
  status: "active",
});

describe("currentHand", () => {
  it("プリフロップはペアかどうかだけ", () => {
    expect(currentHand(player("Kd Ks"), [])?.name).toBe("ワンペア（Kのペア）");
    expect(currentHand(player("Qh 7c"), [])?.name).toBe("ハイカード（Qが一番上）");
  });

  it("役を作っているカードだけを強調する", () => {
    const hand = currentHand(player("Ah Qc"), parseCards("As Kh 7d"))!;
    expect(hand.name).toBe("ワンペア（Aのペア）");
    expect(hand.keyCards.map(cardToString).sort()).toEqual(["Ah", "As"]);
  });
});

describe("strengthLevel / estimateEquity", () => {
  it("強い手ほど段階が上がる", () => {
    const rng = seededRng(3);
    const aces = estimateEquity(parseCards("As Ah"), [], 1, 500, rng);
    const junk = estimateEquity(parseCards("7c 2d"), [], 1, 500, rng);
    expect(aces).toBeGreaterThan(0.75);
    expect(junk).toBeLessThan(0.4);
    expect(strengthLevel(aces, 1)).toBe(3);
    expect(strengthLevel(junk, 1)).toBe(0);
  });

  it("相手がいなければ見込みは 100%", () => {
    expect(estimateEquity(parseCards("7c 2d"), [], 0)).toBe(1);
  });
});

describe("recommend", () => {
  // ディーラー P0 (人間)、P1 SB、P2 BB。人間から行動
  const start = () => startHand({ ...newGame(3), players: newGame(3).players }, { rng: seededRng(5) });

  it("見込みが必要な勝率を上回ればコール、下回ればフォールド", () => {
    const s = start();
    expect(recommend(s, 0.5)?.action).toBe("call");
    const fold = recommend(s, 0.1)!;
    expect(fold.action).toBe("fold");
    expect(fold.detail).toContain("約40%"); // 10 ÷ (15 + 10)
  });

  it("見込みが高ければレイズ、チェックできて弱ければチェック", () => {
    expect(recommend(start(), 0.9)?.action).toBe("raise");
    const s = act(start(), { type: "call" }, { type: "call" }, { type: "check" });
    // フロップ: SB (P1) から。人間の番まで進める
    const flop = act(s, { type: "check" }, { type: "check" });
    expect(flop.players[flop.toActIndex!].isHuman).toBe(true);
    expect(recommend(flop, 0.2)?.action).toBe("check");
    expect(recommend(flop, 0.9)?.action).toBe("bet");
  });

  it("人間の番でなければ出さない", () => {
    const s = act(start(), { type: "call" });
    expect(recommend(s, 0.9)).toBeNull();
  });
});

describe("explainSituation / roundFlow", () => {
  it("ブラインドの役割と自分の番を説明する", () => {
    // ディーラー P2 → P0 が SB, P1 が BB
    const s = startHand(newGame(3, { dealerIndex: 2 }), { rng: seededRng(1) });
    const lines = explainSituation(s, "P0");
    expect(lines.join("")).toContain("スモールブラインドとして 5");
    expect(lines.join("")).toContain("P2 が行動を考えています");
    expect(roundFlow(s).map((r) => r.text)).toEqual(["SB 5", "BB 10", "考え中"]);
  });
});

describe("compareExplanation", () => {
  const hand = (text: string) => evaluateBest(parseCards(text));

  it("役の種類が違う", () => {
    expect(compareExplanation("CPU3", hand("Ks Kh 7c 7d As"), "あなた", hand("Ah Ad Kc Qc 9h"))).toBe(
      "CPU3 はツーペア、あなた はワンペアでした。ツーペアの方が強い役なので、CPU3 の勝ちです。",
    );
  });

  it("同じ役ならどこで差がついたかを説明する", () => {
    expect(compareExplanation("A", hand("9h 9d As Qc 8h"), "B", hand("9s 9c Ks Qd 8c"))).toContain(
      "役の数字も同じなので、残りのカード（キッカー）で比べると、A と K で A の方が強い",
    );
    expect(compareExplanation("A", hand("Jc Jd 4h 4s 2d"), "B", hand("Jh Js 3c 3d Ad"))).toContain("小さい方のペアで比べると、4 と 3");
  });

  it("同じ強さなら山分け", () => {
    expect(compareExplanation("A", hand("As Ks Qs Js Ts"), "B", hand("Ah Kh Qh Jh Th"))).toContain("山分け");
  });
});

describe("reviewHand", () => {
  it("ショーダウンの勝敗と収支を説明する", () => {
    // ディーラー P0。配る順 P1, P2, P0
    const deck = riggedDeck(["2c 3d", "Ks 7c", "Ah Qc"], "As Kh 7d 2s 9h");
    let s = startHand(newGame(3), { deck });
    s = act(s, { type: "call" }, { type: "fold" }, { type: "check" });
    s = act(s, { type: "check" }, { type: "check" }, { type: "check" }, { type: "check" }, { type: "check" }, { type: "check" });

    const review = reviewHand(s, "P0")!;
    expect(review.title).toBe("P2 の勝ち");
    expect(review.lines[0]).toBe("P2 はツーペア、P0 はワンペアでした。ツーペアの方が強い役なので、P2 の勝ちです。");
    expect(review.net).toBe(-10);
    expect(review.showdown.map((x) => x.player.id)).toEqual(["P2", "P0"]);
  });

  it("全員が降りた場合", () => {
    const s = act(startHand(newGame(3), { rng: seededRng(1) }), { type: "fold" }, { type: "fold" });
    const review = reviewHand(s, "P0")!;
    expect(review.title).toBe("P2 の勝ち");
    expect(review.lines[0]).toContain("手札を見せずに");
    expect(review.net).toBe(0);
  });
});
