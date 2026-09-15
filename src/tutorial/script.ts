import { stackDeck } from "@/engine/cards";
import { createGame, startHand } from "@/engine/game";
import type { Action, ActionType, GameState } from "@/engine/types";

export const TUTORIAL_PLAYERS = [
  { id: "you", name: "あなた", isHuman: true },
  { id: "cpu1", name: "CPU1", isHuman: false },
  { id: "cpu2", name: "CPU2", isHuman: false },
] as const;

export type TutorialPrompt = { type: ActionType; amount?: number; text: string };

export type TutorialHand = {
  title: string;
  /** カードが配られたあとに、1ページずつ表示する説明 */
  intro: string[];
  dealerIndex: number;
  /** ディーラーの左から配る順の手札 */
  holes: string[];
  board: string;
  /** CPU が順番に行う行動 */
  cpu: Record<string, Action[]>;
  /** あなたが順番に行う行動と、そのときの説明 */
  prompts: TutorialPrompt[];
  outro: string[];
};

export const TUTORIAL_HANDS: TutorialHand[] = [
  {
    title: "ハンドの流れ",
    intro: [
      "ようこそ！ここでは3回のハンドで、ポーカーの基本を練習します。",
      "テーブルには、あなたと CPU が2人。「D」マークの人がディーラーで、その左の2人が「ブラインド」という決まった額を先に出します。今回は CPU1 が 5、CPU2 が 10 を出しました。",
      "あなたの手札は A と K です。手札は自分にしか見えません。",
    ],
    dealerIndex: 0,
    holes: ["7c 2s", "8h Ks", "Ah Kd"], // CPU1, CPU2, あなた
    board: "As 8d 4c Jh 3s",
    cpu: {
      cpu1: [{ type: "fold" }],
      cpu2: [{ type: "check" }, { type: "check" }, { type: "check" }, { type: "check" }],
    },
    prompts: [
      { type: "call", text: "あなたの番です。ビッグブラインドと同じ 10 を出して勝負を続ける「コール」を押してみましょう。" },
      {
        type: "check",
        text: "場に3枚のカード（フロップ）が開きました。場の A とあなたの A で「ワンペア」ができています。誰もチップを出していないので、「チェック」で様子を見ましょう。",
      },
      { type: "check", text: "4枚目のカード（ターン）が開きました。ここもチェックで進めます。" },
      { type: "check", text: "最後の5枚目（リバー）です。チェックすると、残った人で手札を見せ合います。" },
    ],
    outro: [
      "あなたの勝ちです！",
      "最後まで残った人で手札を見せ合い、一番強い役の人がポットをもらいます。同じ「ワンペア」どうしなので数字で比べ、あなたの「A のペア」が CPU2 の「8 のペア」より強かったので勝ちました。",
    ],
  },
  {
    title: "役を作る",
    intro: [
      "2回目は「役」の練習です。役の強さの順番は、上の「役一覧」でいつでも確認できます。",
      "ディーラーが左に移り、今回はあなたがビッグブラインドとして 10 を出しています。",
    ],
    dealerIndex: 1,
    holes: ["Qs Qd", "9h 8h", "Kc 3d"], // CPU2, あなた, CPU1
    board: "Ah 6h 2c Kh 5s",
    cpu: {
      cpu1: [{ type: "call" }, { type: "check" }, { type: "call" }, { type: "call" }],
      cpu2: [{ type: "call" }, { type: "check" }, { type: "bet", amount: 20 }, { type: "check" }, { type: "fold" }],
    },
    prompts: [
      {
        type: "check",
        text: "全員の額が 10 にそろいました。あなたはビッグブラインドですでに 10 を出しているので、追加で払わずに「チェック」できます。",
      },
      {
        type: "check",
        text: "ハートが4枚そろいました（手札2枚＋場2枚）。あと1枚ハートが来れば「フラッシュ」です。チェックで次のカードを待ちましょう。",
      },
      {
        type: "call",
        text: "K♥ が開いて、同じマークが5枚そろう「フラッシュ」ができました！CPU2 が 20 ベットしたので、「コール」しましょう。",
      },
      { type: "bet", amount: 40, text: "フラッシュはとても強い役です。今度はあなたから「ベット」して、ポットを大きくしましょう。" },
    ],
    outro: [
      "あなたの勝ちです！",
      "あなたの「フラッシュ」は、CPU1 の「ワンペア（K のペア）」よりずっと強い役です。役の種類が違うときは、数字に関係なく強い役を持っている方が勝ちます。",
    ],
  },
  {
    title: "賭け方",
    intro: [
      "最後は「賭け方」の練習です。",
      "ベットやレイズで額を上げると、ほかの人は「コール」して続けるか、「フォールド」して降りるかを選ばなければなりません。",
    ],
    dealerIndex: 2,
    holes: ["As Ad", "Jc Td", "8s 7s"], // あなた, CPU1, CPU2
    board: "Ac Kd 3h 9c 2d",
    cpu: {
      cpu1: [{ type: "fold" }],
      cpu2: [{ type: "call" }, { type: "call" }, { type: "fold" }],
    },
    prompts: [
      { type: "raise", amount: 40, text: "A のペアはとても強い手札です。「レイズ」して、額を 40 に上げてみましょう。" },
      { type: "bet", amount: 60, text: "場に A が開いて「スリーカード」になりました。「ベット」して、相手に続けるかどうかを決めさせましょう。" },
    ],
    outro: [
      "あなたの勝ちです！",
      "ほかの全員がフォールドしたので、手札を見せずにポットを獲得しました。強い手ではベットやレイズでチップを増やし、弱い手では無理をせず降りるのが基本です。",
      "これでチュートリアルは終わりです。初心者モードで実際に遊んでみましょう！",
    ],
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

/** 今の手番で行うべき行動。台本の進み具合 (行動した回数) から決める */
export function nextScriptedAction(hand: TutorialHand, state: GameState, counts: Record<string, number>) {
  if (state.isHandOver || state.toActIndex === null) return null;
  const player = state.players[state.toActIndex];
  const index = counts[player.id] ?? 0;
  if (player.isHuman) {
    const prompt = hand.prompts[index];
    return prompt ? { player, prompt, action: { type: prompt.type, amount: prompt.amount } as Action } : null;
  }
  const action = hand.cpu[player.id]?.[index];
  return action ? { player, prompt: null, action } : null;
}
