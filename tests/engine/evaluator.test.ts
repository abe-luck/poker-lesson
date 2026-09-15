import { describe, expect, it } from "vitest";
import { cardToString, parseCards } from "@/engine/cards";
import { compareHands, evaluateBest, evaluateFive, HAND_CATEGORY } from "@/engine/evaluator";

const five = (text: string) => evaluateFive(parseCards(text));
const best = (text: string) => evaluateBest(parseCards(text));
/** a が b より強ければ 1、弱ければ -1、同じなら 0 */
const cmp = (a: string, b: string) => Math.sign(compareHands(best(a), best(b)));

describe("evaluateFive: 役の種類", () => {
  it.each([
    ["As Ks Qs Js Ts", HAND_CATEGORY.royalFlush],
    ["9h 8h 7h 6h 5h", HAND_CATEGORY.straightFlush],
    ["5d 4d 3d 2d Ad", HAND_CATEGORY.straightFlush],
    ["7c 7d 7h 7s 2d", HAND_CATEGORY.fourOfAKind],
    ["Kc Kd Kh 4s 4d", HAND_CATEGORY.fullHouse],
    ["Ac Jc 8c 4c 2c", HAND_CATEGORY.flush],
    ["Tc 9d 8h 7s 6d", HAND_CATEGORY.straight],
    ["Ac 2d 3h 4s 5d", HAND_CATEGORY.straight],
    ["Qc Qd Qh 9s 2d", HAND_CATEGORY.threeOfAKind],
    ["Jc Jd 4h 4s Ad", HAND_CATEGORY.twoPair],
    ["Ac Ad 9h 5s 2d", HAND_CATEGORY.onePair],
    ["Ac Qd 9h 5s 2d", HAND_CATEGORY.highCard],
  ])("%s", (cards, category) => {
    expect(five(cards).category).toBe(category);
  });

  it("K-A-2-3-4 はストレートではない", () => {
    expect(five("Kc Ad 2h 3s 4d").category).toBe(HAND_CATEGORY.highCard);
  });

  it("A始まりのストレートは 5 が一番上", () => {
    expect(five("Ac 2d 3h 4s 5d").tiebreak).toEqual([5]);
    expect(five("Ac 2d 3h 4s 5d").bestFive.map(cardToString)).toEqual(["5d", "4s", "3h", "2d", "Ac"]);
  });

  it("役に使うカードを先に並べる", () => {
    expect(five("2d Kc 9h Kd 9s").bestFive.map((c) => c.rank)).toEqual([13, 13, 9, 9, 2]);
  });
});

describe("compareHands", () => {
  it("役の種類が違えば強い役が勝つ", () => {
    expect(cmp("2c 3c 4c 5c 7c", "Ac Kd Qh Js Td")).toBe(1); // フラッシュ > ストレート
    expect(cmp("2c 2d 3h 3s 4d", "Ac Ad Kh Qs Jd")).toBe(1); // ツーペア > ワンペア
  });

  it("同じ役なら数字で比べる", () => {
    expect(cmp("6c 5d 4h 3s 2d", "Ac 2d 3h 4s 5d")).toBe(1); // 6ハイ > 5ハイのストレート
    expect(cmp("Kc Kd Kh 2s 2d", "Qc Qd Qh As Ad")).toBe(1); // フルハウスは3枚側から
    expect(cmp("Ac Ad 9h 5s 3d", "Ah As 9c 5d 2h")).toBe(1); // キッカー
    expect(cmp("Jc Jd 4h 4s Ad", "Jh Js 4c 4d Kd")).toBe(1); // ツーペアのキッカー
  });

  it("同じ強さなら 0", () => {
    expect(cmp("Ac Kd Qh Js 9d", "Ad Kc Qs Jh 9c")).toBe(0);
  });
});

describe("evaluateBest: 7枚から選ぶ", () => {
  it("一番強い5枚を選ぶ", () => {
    const hand = best("As Ks Qs Js Ts 2d 3c");
    expect(hand.category).toBe(HAND_CATEGORY.royalFlush);
    expect(hand.bestFive).toHaveLength(5);
  });

  it("手札を使わず場の5枚が役になることもある", () => {
    expect(best("2c 3d Ts Js Qs Ks As").category).toBe(HAND_CATEGORY.royalFlush);
  });

  it("フラッシュとストレートが両方あれば強い方", () => {
    expect(best("9h 8h 7c 6h 5h 2h Td").category).toBe(HAND_CATEGORY.flush);
  });

  it("枚数が合わなければエラー", () => {
    expect(() => evaluateBest(parseCards("As Ks Qs Js"))).toThrow();
  });
});
