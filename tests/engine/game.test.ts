import { describe, expect, it } from "vitest";
import { seededRng } from "@/engine/cards";
import { HAND_CATEGORY } from "@/engine/evaluator";
import { applyAction, getLegalActions, getPotTotal, isGameOver, startHand } from "@/engine/game";
import type { Action, GameState } from "@/engine/types";
import { act, newGame, riggedDeck, stacks, toActId } from "../helpers";

const fold: Action = { type: "fold" };
const check: Action = { type: "check" };
const call: Action = { type: "call" };
const allin: Action = { type: "allin" };
const raise = (amount: number): Action => ({ type: "raise", amount });
const bet = (amount: number): Action => ({ type: "bet", amount });

function withStacks(state: GameState, values: number[]): GameState {
  return { ...state, players: state.players.map((p, i) => ({ ...p, stack: values[i] })) };
}

describe("ハンドの開始", () => {
  it("ブラインドを集めて2枚ずつ配り、BBの左から始まる", () => {
    const s = startHand(newGame(4), { rng: seededRng(1) });
    expect(s.handNumber).toBe(1);
    expect(s.dealerIndex).toBe(0);
    expect(s.players.map((p) => p.currentBet)).toEqual([0, 5, 10, 0]);
    expect(s.players.every((p) => p.holeCards.length === 2)).toBe(true);
    expect(s.deck).toHaveLength(52 - 8);
    expect(toActId(s)).toBe("P3");
    expect(getPotTotal(s)).toBe(15);
  });

  it("ヘッズアップではディーラーがSBで、プリフロップは先に行動する", () => {
    let s = startHand(newGame(2), { rng: seededRng(1) });
    expect(s.players.map((p) => p.currentBet)).toEqual([5, 10]);
    expect(toActId(s)).toBe("P0");

    s = applyAction(s, call);
    expect(toActId(s)).toBe("P1"); // BB のオプション
    expect(getLegalActions(s)).toMatchObject({ check: true, raise: { min: 20, max: 1000 } });

    s = applyAction(s, check);
    expect(s.street).toBe("flop");
    expect(s.board).toHaveLength(3);
    expect(toActId(s)).toBe("P1"); // フロップ以降は BB から
  });

  it("ディーラーは次のハンドで移動し、チップのない人を飛ばす", () => {
    let s = startHand(withStacks(newGame(3), [1000, 0, 1000]), { rng: seededRng(1) });
    expect(s.players[1].status).toBe("out");
    expect(s.players.map((p) => p.currentBet)).toEqual([5, 0, 10]); // 2人なのでディーラーがSB
    s = applyAction(s, fold);
    expect(s.isHandOver).toBe(true);

    s = startHand(s, { rng: seededRng(2) });
    expect(s.dealerIndex).toBe(2);
  });
});

describe("ベットのルール", () => {
  it("全員が降りると、残った人がポットを得て、コールされなかった額は戻る", () => {
    const s = act(startHand(newGame(4), { rng: seededRng(1) }), fold, fold, fold);
    expect(s.isHandOver).toBe(true);
    expect(s.result?.payouts).toEqual([{ playerId: "P2", amount: 10 }]);
    expect(stacks(s)).toEqual([1000, 995, 1005, 1000]);
    expect(isGameOver(s)).toBe(false);
  });

  it("最低レイズ額は直前の上乗せ額以上", () => {
    let s = startHand(newGame(4), { rng: seededRng(1) });
    expect(getLegalActions(s)?.raise).toEqual({ min: 20, max: 1000 });
    expect(() => applyAction(s, raise(15))).toThrow();

    s = applyAction(s, raise(35)); // 25 上乗せ
    expect(getLegalActions(s)?.raise?.min).toBe(60);
  });

  it("行動済みでなければチェック、額が足りなければコールが必要", () => {
    const s = startHand(newGame(4), { rng: seededRng(1) });
    expect(getLegalActions(s)).toMatchObject({ check: false, call: 10, bet: null });
    expect(() => applyAction(s, check)).toThrow();
    expect(() => applyAction(s, bet(20))).toThrow();
  });

  it("最低レイズに届かないオールインでは、行動済みの人はレイズできない", () => {
    let s = startHand(withStacks(newGame(3), [1000, 1000, 45]), { rng: seededRng(1) });
    // P0 (ディーラー) → P1 (SB) → P2 (BB, 45)
    s = act(s, raise(30), call);
    s = applyAction(s, allin); // 45 まで: 上乗せ 15 は最低レイズ 20 未満
    expect(s.players[2].status).toBe("allin");
    expect(s.currentBet).toBe(45);

    expect(toActId(s)).toBe("P0");
    expect(getLegalActions(s)).toMatchObject({ call: 15, raise: null });
    expect(() => applyAction(s, allin)).toThrow();

    s = act(s, call, call);
    expect(s.street).toBe("flop");
  });

  it("フルレイズがあれば、行動済みの人もレイズできる", () => {
    let s = startHand(newGame(3), { rng: seededRng(1) });
    s = act(s, call, call, raise(30)); // BB がレイズ
    expect(toActId(s)).toBe("P0");
    expect(getLegalActions(s)?.raise?.min).toBe(50);
  });

  it("ハンドが終わったあとは行動できない", () => {
    const s = act(startHand(newGame(2), { rng: seededRng(1) }), fold);
    expect(getLegalActions(s)).toBeNull();
    expect(() => applyAction(s, check)).toThrow();
  });
});

describe("ショーダウン", () => {
  it("全員オールインなら残りのカードを開き、サイドポットごとに分配する", () => {
    // ディーラー P0。配る順は P1, P2, P0
    const deck = riggedDeck(["As Ad", "Ks Kd", "Qs Qd"], "2c 7h 9d 3s 5c");
    let s = startHand(withStacks(newGame(3), [1000, 100, 300]), { deck });

    s = act(s, allin, allin, allin);
    expect(s.isHandOver).toBe(true);
    expect(s.street).toBe("showdown");
    expect(s.board).toHaveLength(5);

    expect(s.result?.pots).toEqual([
      { amount: 300, eligiblePlayerIds: ["P0", "P1", "P2"], winnerIds: ["P1"] },
      { amount: 400, eligiblePlayerIds: ["P0", "P2"], winnerIds: ["P2"] },
    ]);
    expect(stacks(s)).toEqual([700, 300, 400]); // P0 はコールされなかった 700 が戻る
  });

  it("引き分けは山分けし、端数はディーラーの左に近い勝者へ", () => {
    const deck = riggedDeck(["2c 3c", "4d 5d", "6h 8h"], "Ts Js Qs Ks As");
    let s = startHand(newGame(3), { deck });

    s = act(s, call, fold, check); // P0 コール、P1 (SB) フォールド、P2 チェック
    s = act(s, check, check, check, check, check, check); // フロップ〜リバー
    expect(s.isHandOver).toBe(true);

    const pot = s.result!.pots[0];
    expect(pot.amount).toBe(25);
    expect(pot.winnerIds).toEqual(["P2", "P0"]);
    expect(stacks(s)).toEqual([1002, 995, 1003]);
    expect(s.result!.showdown.every((x) => x.hand.category === HAND_CATEGORY.royalFlush)).toBe(true);
  });

  it("オールインのブラインドだけで行動できる人がいなければ、そのまま決着する", () => {
    // ヘッズアップでは BB (P1) から配る
    const deck = riggedDeck(["Ks Kd", "As Ad"], "2c 7h 9d 3s 5c");
    const s = startHand(withStacks(newGame(2), [3, 1000]), { deck });
    // P0 (SB) は 3 でオールイン、P1 は 7 が戻る
    expect(s.isHandOver).toBe(true);
    expect(stacks(s)).toEqual([6, 997]);
  });
});

describe("ランダムに遊んでもチップの合計は変わらない", () => {
  it.each([1, 2, 3, 4, 5])("種 %i", (seed) => {
    const rng = seededRng(seed);
    const pick = <T>(items: T[]) => items[Math.floor(rng() * items.length)];
    let s = newGame(6);
    const initialTotal = s.players.reduce((sum, p) => sum + p.stack, 0);

    const playable = () => s.players.filter((p) => p.stack > 0).length >= 2;
    for (let hand = 0; hand < 200 && playable(); hand++) {
      s = startHand(s, { rng });
      let steps = 0;
      while (!s.isHandOver) {
        const legal = getLegalActions(s)!;
        const options: Action[] = [fold];
        if (legal.check) options.push(check, check);
        if (legal.call !== null) options.push(call, call);
        if (legal.bet) options.push(bet(legal.bet.min + Math.floor(rng() * (legal.bet.max - legal.bet.min + 1))));
        if (legal.raise) options.push(raise(legal.raise.min + Math.floor(rng() * (legal.raise.max - legal.raise.min + 1))));
        s = applyAction(s, pick(options));
        const inPlay = s.players.reduce((sum, p) => sum + p.stack + (s.isHandOver ? 0 : p.totalBet), 0);
        expect(inPlay).toBe(initialTotal);
        expect(s.players.every((p) => p.stack >= 0)).toBe(true);
        expect(++steps).toBeLessThan(500);
      }
    }
  });
});
