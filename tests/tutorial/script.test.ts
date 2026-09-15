import { describe, expect, it } from "vitest";
import { applyAction } from "@/engine/game";
import { en } from "@/i18n/en";
import { ja } from "@/i18n/ja";
import { nextScriptedAction, startTutorialHand, TUTORIAL_HANDS } from "@/tutorial/script";

describe("チュートリアルの台本", () => {
  it.each([ja, en])("説明文 ($locale) の数が台本と合っている", (t) => {
    expect(t.tutorial.hands).toHaveLength(TUTORIAL_HANDS.length);
    TUTORIAL_HANDS.forEach((hand, i) => {
      expect(t.tutorial.hands[i].prompts).toHaveLength(hand.prompts.length);
      expect(t.tutorial.hands[i].intro.length).toBeGreaterThan(0);
      expect(t.tutorial.hands[i].outro.length).toBeGreaterThan(0);
    });
  });

  it.each(TUTORIAL_HANDS.map((hand, i) => [i + 1, hand] as const))("ハンド %i: 台本どおりに進み、あなたが勝つ", (_, hand) => {
    let state = startTutorialHand(hand);
    const counts: Record<string, number> = {};

    for (let step = 0; !state.isHandOver; step++) {
      expect(step).toBeLessThan(50);
      const next = nextScriptedAction(hand, state, counts);
      expect(next, `台本が足りない (${state.players[state.toActIndex!].id})`).not.toBeNull();
      state = applyAction(state, next!.action); // 不正な行動なら例外
      counts[next!.player.id] = (counts[next!.player.id] ?? 0) + 1;
    }

    // 台本を使い切っている
    expect(counts.you ?? 0).toBe(hand.prompts.length);
    for (const [id, actions] of Object.entries(hand.cpu)) expect(counts[id] ?? 0).toBe(actions.length);
    // あなただけがポットを獲得
    expect(state.result?.payouts.map((p) => p.playerId)).toEqual(["you"]);
  });

  it("説明の役名が実際の役と合っている", () => {
    // ハンド1: A のペア vs 8 のペア。ハンド2: フラッシュ vs K のペア
    const run = (i: number) => {
      const hand = TUTORIAL_HANDS[i];
      let state = startTutorialHand(hand);
      const counts: Record<string, number> = {};
      while (!state.isHandOver) {
        const next = nextScriptedAction(hand, state, counts)!;
        state = applyAction(state, next.action);
        counts[next.player.id] = (counts[next.player.id] ?? 0) + 1;
      }
      return Object.fromEntries(state.result!.showdown.map((s) => [s.playerId, s.hand.category]));
    };
    expect(run(0)).toEqual({ you: 1, cpu2: 1 });
    expect(run(1)).toEqual({ you: 5, cpu1: 1 });
  });
});
