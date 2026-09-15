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
import { en } from "@/i18n/en";
import { ja } from "@/i18n/ja";
import { act, newGame, riggedDeck } from "../helpers";

const t = ja;

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
    expect(currentHand(t, player("Kd Ks"), [])?.name).toBe("ワンペア（Kのペア）");
    expect(currentHand(t, player("Qh 7c"), [])?.name).toBe("ハイカード（Qが一番上）");
  });

  it("役を作っているカードだけを強調する", () => {
    const hand = currentHand(t, player("Ah Qc"), parseCards("As Kh 7d"))!;
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
    expect(recommend(t, s, 0.5)?.action).toBe("call");
    const fold = recommend(t, s, 0.1)!;
    expect(fold.action).toBe("fold");
    expect(fold.detail).toContain("約40%"); // 10 ÷ (15 + 10)
  });

  it("見込みが高ければレイズ、チェックできて弱ければチェック", () => {
    expect(recommend(t, start(), 0.9)?.action).toBe("raise");
    const s = act(start(), { type: "call" }, { type: "call" }, { type: "check" });
    // フロップ: SB (P1) から。人間の番まで進める
    const flop = act(s, { type: "check" }, { type: "check" });
    expect(flop.players[flop.toActIndex!].isHuman).toBe(true);
    expect(recommend(t, flop, 0.2)?.action).toBe("check");
    expect(recommend(t, flop, 0.9)?.action).toBe("bet");
  });

  it("人間の番でなければ出さない", () => {
    const s = act(start(), { type: "call" });
    expect(recommend(t, s, 0.9)).toBeNull();
  });
});

describe("explainSituation / roundFlow", () => {
  it("ブラインドの役割と自分の番を説明する", () => {
    // ディーラー P2 → P0 が SB, P1 が BB
    const s = startHand(newGame(3, { dealerIndex: 2 }), { rng: seededRng(1) });
    const lines = explainSituation(t, s, "P0");
    expect(lines.join("")).toContain("スモールブラインドとして 5");
    expect(lines.join("")).toContain("P2 が行動を考えています");
    expect(roundFlow(t, s).map((r) => r.text)).toEqual(["SB 5", "BB 10", "考え中"]);
  });
});

describe("compareExplanation", () => {
  const hand = (text: string) => evaluateBest(parseCards(text));

  it("役の種類が違う", () => {
    expect(compareExplanation(t, "CPU3", hand("Ks Kh 7c 7d As"), "あなた", hand("Ah Ad Kc Qc 9h"))).toBe(
      "CPU3 はツーペア、あなた はワンペアでした。ツーペアの方が強い役なので、CPU3 の勝ちです。",
    );
  });

  it("同じ役ならどこで差がついたかを説明する", () => {
    expect(compareExplanation(t, "A", hand("9h 9d As Qc 8h"), "B", hand("9s 9c Ks Qd 8c"))).toContain(
      "役の数字も同じなので、残りのカード（キッカー）で比べると、A と K で A の方が強い",
    );
    expect(compareExplanation(t, "A", hand("Jc Jd 4h 4s 2d"), "B", hand("Jh Js 3c 3d Ad"))).toContain("小さい方のペアで比べると、4 と 3");
  });

  it("同じ強さなら山分け", () => {
    expect(compareExplanation(t, "A", hand("As Ks Qs Js Ts"), "B", hand("Ah Kh Qh Jh Th"))).toContain("山分け");
  });
});

describe("reviewHand", () => {
  it("ショーダウンの勝敗と収支を説明する", () => {
    // ディーラー P0。配る順 P1, P2, P0
    const deck = riggedDeck(["2c 3d", "Ks 7c", "Ah Qc"], "As Kh 7d 2s 9h");
    let s = startHand(newGame(3), { deck });
    s = act(s, { type: "call" }, { type: "fold" }, { type: "check" });
    s = act(s, { type: "check" }, { type: "check" }, { type: "check" }, { type: "check" }, { type: "check" }, { type: "check" });

    const review = reviewHand(t, s, "P0")!;
    expect(review.title).toBe("P2 の勝ち");
    expect(review.lines[0]).toBe("P2 はツーペア、あなた はワンペアでした。ツーペアの方が強い役なので、P2 の勝ちです。");
    expect(review.net).toBe(-10);
    expect(review.showdown.map((x) => x.player.id)).toEqual(["P2", "P0"]);
  });

  it("全員が降りた場合", () => {
    const s = act(startHand(newGame(3), { rng: seededRng(1) }), { type: "fold" }, { type: "fold" });
    const review = reviewHand(t, s, "P0")!;
    expect(review.title).toBe("P2 の勝ち");
    expect(review.lines[0]).toContain("手札を見せずに");
    expect(review.net).toBe(0);
  });
});

describe("英語の文章", () => {
  const hand = (text: string) => evaluateBest(parseCards(text));

  it("役名", () => {
    expect(currentHand(en, player("Ah Qc"), parseCards("As Kh 7d"))?.name).toBe("One Pair (Aces)");
    expect(currentHand(en, player("Kd Ks"), [])?.name).toBe("One Pair (Kings)");
    expect(currentHand(en, player("Kd Kh"), parseCards("Ks 4c 4d"))?.name).toBe("Full House (Kings full of Fours)");
  });

  it("振り返りの説明", () => {
    expect(compareExplanation(en, "CPU3", hand("Ks Kh 7c 7d As"), "You", hand("Ah Ad Kc Qc 9h"))).toBe(
      "CPU3 had two pair and you had one pair. Two pair beats one pair, so CPU3 won.",
    );
    expect(compareExplanation(en, "A", hand("9h 9d As Qc 8h"), "B", hand("9s 9c Ks Qd 8c"))).toContain("compare the remaining cards (kickers): A beats K");
  });

  it("おすすめの計算", () => {
    const s = startHand(newGame(3), { rng: seededRng(5) });
    expect(recommend(en, s, 0.1)?.detail).toContain("≈ 40%");
    expect(recommend(en, s, 0.1)?.label).toBe("Fold");
  });
});

describe("英語の文章 (あなたが勝った場合)", () => {
  const hand = (text: string) => evaluateBest(parseCards(text));
  it("文の途中の You は小文字、冠詞も付く", () => {
    expect(compareExplanation(en, "You", hand("Ah Jh 8h 4h 2h"), "CPU1", hand("Kc Kd 9s 5c 3d"))).toBe(
      "You had a flush and CPU1 had one pair. A flush beats one pair, so you won.",
    );
  });
});
