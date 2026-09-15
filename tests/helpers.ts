import { cardToString, createDeck, parseCards } from "@/engine/cards";
import { applyAction, createGame, type NewGameOptions } from "@/engine/game";
import type { Action, Card, GameState } from "@/engine/types";

/**
 * 配る順どおりに山札を組む。
 * holes: ディーラーの左から配る順の手札 ("As Kd" 形式)
 * board: 場に開く5枚。バーンカードと残りは使っていないカードで埋める
 */
export function riggedDeck(holes: string[], board: string): Card[] {
  const holeCards = holes.map(parseCards);
  const boardCards = parseCards(board);
  const used = new Set([...holeCards.flat(), ...boardCards].map(cardToString));
  const filler = createDeck().filter((c) => !used.has(cardToString(c)));
  const burn = () => filler.shift()!;

  return [
    ...holeCards.map((h) => h[0]),
    ...holeCards.map((h) => h[1]),
    burn(),
    ...boardCards.slice(0, 3),
    burn(),
    boardCards[3],
    burn(),
    boardCards[4],
    ...filler,
  ];
}

export function newGame(count: number, overrides: Partial<NewGameOptions> = {}): GameState {
  return createGame({
    mode: "pro",
    startingStack: 1000,
    blinds: { small: 5, big: 10 },
    players: Array.from({ length: count }, (_, i) => ({
      id: `P${i}`,
      name: `P${i}`,
      isHuman: i === 0,
    })),
    ...overrides,
  });
}

/** 続けて行動する */
export function act(state: GameState, ...actions: Action[]): GameState {
  return actions.reduce(applyAction, state);
}

export const toActId = (state: GameState) =>
  state.toActIndex === null ? null : state.players[state.toActIndex].id;

export const stacks = (state: GameState) => state.players.map((p) => p.stack);
