import { create } from "zustand";
import { decideCpuAction } from "@/ai/cpu";
import { cryptoRng } from "@/engine/cards";
import { applyAction, createGame, rebuy, startHand } from "@/engine/game";
import type { Action, Blinds, GameState, Mode } from "@/engine/types";

export const HUMAN_ID = "you";

export type GameConfig = {
  mode: Mode;
  cpuCount: number;
  startingStack: number;
  blinds: Blinds;
};

export const DEFAULT_CONFIG: GameConfig = {
  mode: "beginner",
  cpuCount: 3,
  startingStack: 1000,
  blinds: { small: 5, big: 10 },
};

type GameStore = {
  /** モード選択〜ゲーム設定で編集中の設定 */
  draft: GameConfig;
  /** 進行中のゲームの設定 */
  config: GameConfig | null;
  game: GameState | null;
  updateDraft: (patch: Partial<GameConfig>) => void;
  startGame: (config: GameConfig) => void;
  restart: () => void;
  act: (action: Action) => void;
  cpuAct: () => void;
  nextHand: () => void;
  rebuyHuman: () => void;
  quit: () => void;
};

function newGameState(config: GameConfig): GameState {
  const players = [
    { id: HUMAN_ID, name: "あなた", isHuman: true },
    ...Array.from({ length: config.cpuCount }, (_, i) => ({
      id: `cpu${i + 1}`,
      name: `CPU${i + 1}`,
      isHuman: false,
      cpuLevel: "easy" as const,
    })),
  ];
  const game = createGame({
    mode: config.mode,
    players,
    startingStack: config.startingStack,
    blinds: config.blinds,
    dealerIndex: Math.floor(cryptoRng() * players.length),
  });
  return startHand(game);
}

export const useGameStore = create<GameStore>()((set, get) => ({
  draft: DEFAULT_CONFIG,
  config: null,
  game: null,

  updateDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

  startGame: (config) => set({ config, game: newGameState(config) }),

  restart: () => {
    const { config } = get();
    if (config) set({ game: newGameState(config) });
  },

  act: (action) => {
    const { game } = get();
    if (!game || game.toActIndex === null || !game.players[game.toActIndex].isHuman) return;
    set({ game: applyAction(game, action) });
  },

  cpuAct: () => {
    const { game } = get();
    if (!game || game.toActIndex === null || game.players[game.toActIndex].isHuman) return;
    set({ game: applyAction(game, decideCpuAction(game)) });
  },

  nextHand: () => {
    const { game } = get();
    if (game?.isHandOver) set({ game: startHand(game) });
  },

  rebuyHuman: () => {
    const { game, config } = get();
    if (game?.isHandOver && config) set({ game: startHand(rebuy(game, HUMAN_ID, config.startingStack)) });
  },

  quit: () => set({ game: null, config: null }),
}));
