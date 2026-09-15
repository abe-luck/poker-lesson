import { stackDeck } from "@/engine/cards";
import { createGame, startHand } from "@/engine/game";
import type { Action, ActionType, GameState } from "@/engine/types";

export const TUTORIAL_PLAYERS = [
  { id: "you", name: "you", isHuman: true },
  { id: "cpu1", name: "CPU1", isHuman: false },
  { id: "cpu2", name: "CPU2", isHuman: false },
] as const;

/** 台本 (カードと行動)。説明文は言語ごとの辞書 (i18n の tutorial.hands) に同じ順番で書く */
export type TutorialHand = {
  dealerIndex: number;
  /** ディーラーの左から配る順の手札 */
  holes: string[];
  board: string;
  /** CPU が順番に行う行動 */
  cpu: Record<string, Action[]>;
  /** あなたが順番に行う行動 (辞書の prompts と同じ数) */
  prompts: { type: ActionType; amount?: number }[];
};

export const TUTORIAL_HANDS: TutorialHand[] = [
  {
    // ハンドの流れ
    dealerIndex: 0,
    holes: ["7c 2s", "8h Ks", "Ah Kd"], // CPU1, CPU2, あなた
    board: "As 8d 4c Jh 3s",
    cpu: {
      cpu1: [{ type: "fold" }],
      cpu2: [{ type: "check" }, { type: "check" }, { type: "check" }, { type: "check" }],
    },
    prompts: [{ type: "call" }, { type: "check" }, { type: "check" }, { type: "check" }],
  },
  {
    // 役を作る
    dealerIndex: 1,
    holes: ["Qs Qd", "9h 8h", "Kc 3d"], // CPU2, あなた, CPU1
    board: "Ah 6h 2c Kh 5s",
    cpu: {
      cpu1: [{ type: "call" }, { type: "check" }, { type: "call" }, { type: "call" }],
      cpu2: [{ type: "call" }, { type: "check" }, { type: "bet", amount: 20 }, { type: "check" }, { type: "fold" }],
    },
    prompts: [{ type: "check" }, { type: "check" }, { type: "call" }, { type: "bet", amount: 40 }],
  },
  {
    // 賭け方
    dealerIndex: 2,
    holes: ["As Ad", "Jc Td", "8s 7s"], // あなた, CPU1, CPU2
    board: "Ac Kd 3h 9c 2d",
    cpu: {
      cpu1: [{ type: "fold" }],
      cpu2: [{ type: "call" }, { type: "call" }, { type: "fold" }],
    },
    prompts: [{ type: "raise", amount: 40 }, { type: "bet", amount: 60 }],
  },
];

/** チュートリアルのハンドを配った状態を作る */
export function startTutorialHand(hand: TutorialHand): GameState {
  const game = createGame({
    mode: "beginner",
    players: TUTORIAL_PLAYERS.map((p) => ({ ...p })),
    startingStack: 1000,
    blinds: { small: 5, big: 10 },
    dealerIndex: hand.dealerIndex,
  });
  return startHand(game, { deck: stackDeck(hand.holes, hand.board) });
}

/**
 * 今の手番で行うべき行動。台本の進み具合 (行動した回数) から決める。
 * promptIndex は人間の番のとき、辞書の prompts の何番目の説明を出すか
 */
export function nextScriptedAction(hand: TutorialHand, state: GameState, counts: Record<string, number>) {
  if (state.isHandOver || state.toActIndex === null) return null;
  const player = state.players[state.toActIndex];
  const index = counts[player.id] ?? 0;
  if (player.isHuman) {
    const prompt = hand.prompts[index];
    return prompt ? { player, promptIndex: index, prompt, action: { type: prompt.type, amount: prompt.amount } as Action } : null;
  }
  const action = hand.cpu[player.id]?.[index];
  return action ? { player, promptIndex: null, prompt: null, action } : null;
}
