import { stackDeck } from "@/engine/cards";
import { applyAction, createGame, type NewGameOptions } from "@/engine/game";
import type { Action, GameState } from "@/engine/types";

/** 配る順どおりに山札を組む (engine の stackDeck と同じ) */
export const riggedDeck = stackDeck;

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
