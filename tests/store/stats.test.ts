import { describe, expect, it } from "vitest";
import { seededRng } from "@/engine/cards";
import { startHand } from "@/engine/game";
import { summarizeHand } from "@/store/statsStore";
import { act, newGame, riggedDeck } from "../helpers";

describe("summarizeHand", () => {
  it("ショーダウンで負けたハンド", () => {
    // ディーラー P0 (人間)。配る順 P1, P2, P0
    const deck = riggedDeck(["2c 3d", "Ks 7c", "Ah Qc"], "As Kh 7d 2s 9h");
    let s = startHand(newGame(3), { deck });
    s = act(s, { type: "call" }, { type: "fold" }, { type: "check" });
    s = act(s, ...Array.from({ length: 6 }, () => ({ type: "check" as const })));

    const summary = summarizeHand(s, 1000)!;
    expect(summary.delta).toMatchObject({ hands: 1, won: 0, net: -10, vpip: 1, pfr: 0, showdowns: 1, showdownsWon: 0 });
    // 言語を切り替えても訳せるように、文章ではなくデータで保存する
    expect(summary.entry).toMatchObject({
      holeCards: "Ah Qc",
      board: "As Kh 7d 2s 9h",
      winners: [{ id: "P2", name: "P2", isHuman: false }],
      hand: { category: 1, tiebreak: [14, 13, 12, 9] },
    });
    expect(summary.entry.log[0]).toEqual({ street: "preflop", type: "smallBlind", paid: 5, total: 5, player: { id: "P1", name: "P1", isHuman: false } });
  });

  it("レイズして全員が降りたハンド", () => {
    const s = act(startHand(newGame(3), { rng: seededRng(1) }), { type: "raise", amount: 30 }, { type: "fold" }, { type: "fold" });
    const summary = summarizeHand(s)!;
    expect(summary.delta).toMatchObject({ won: 1, net: 15, vpip: 1, pfr: 1, showdowns: 0, biggestWin: 15 });
    expect(summary.entry.hand).toBeNull();
  });

  it("ハンドの途中なら記録しない", () => {
    expect(summarizeHand(startHand(newGame(3), { rng: seededRng(1) }))).toBeNull();
  });
});
