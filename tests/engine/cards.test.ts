import { describe, expect, it } from "vitest";
import { cardToString, createDeck, parseCard, parseCards, seededRng, shuffle } from "@/engine/cards";

describe("cards", () => {
  it("山札は重複のない52枚", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map(cardToString)).size).toBe(52);
  });

  it("シャッフルは並べ替えのみで、元の配列を変えない", () => {
    const deck = createDeck();
    const shuffled = shuffle(deck, seededRng(1));
    expect(shuffled).not.toEqual(deck);
    expect(shuffled.map(cardToString).sort()).toEqual(deck.map(cardToString).sort());
    expect(deck[0]).toEqual({ rank: 2, suit: "s" });
  });

  it("同じ種なら同じ並びになる", () => {
    const deck = createDeck();
    expect(shuffle(deck, seededRng(42))).toEqual(shuffle(deck, seededRng(42)));
    expect(shuffle(deck, seededRng(42))).not.toEqual(shuffle(deck, seededRng(43)));
  });

  it("表記を読み書きできる", () => {
    expect(parseCard("As")).toEqual({ rank: 14, suit: "s" });
    expect(parseCard("td")).toEqual({ rank: 10, suit: "d" });
    expect(parseCards(" Kh  2c ").map(cardToString)).toEqual(["Kh", "2c"]);
    expect(() => parseCard("1s")).toThrow();
    expect(() => parseCard("Ax")).toThrow();
  });
});
