import { create } from "zustand";
import { decideCpuAction } from "@/ai/cpu";
import { cryptoRng } from "@/engine/cards";
import { applyAction, createGame, getLegalActions, getPlayerToAct, rebuy, setBlinds, startHand } from "@/engine/game";
import { blindLevel, blindsForLevel } from "@/engine/tournament";
import type { Action, Blinds, CpuLevel, GameState, Mode } from "@/engine/types";

export const HUMAN_ID = "you";

export type GameFormat = "cash" | "tournament";
export type TimeLimit = 0 | 15 | 30;

export type GameConfig = {
  mode: Mode;
  cpuCount: number;
  startingStack: number;
  blinds: Blinds;
  /** プロモードのみ。初心者モードは常に弱い */
  cpuLevel: Exclude<CpuLevel, "easy">;
  format: GameFormat;
  /** 持ち時間 (秒)。0 はなし */
  timeLimit: TimeLimit;
  showPotOdds: boolean;
};

export const DEFAULT_CONFIG: GameConfig = {
  mode: "beginner",
  cpuCount: 3,
  startingStack: 1000,
  blinds: { small: 5, big: 10 },
  cpuLevel: "normal",
  format: "cash",
  timeLimit: 0,
  showPotOdds: true,
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
  /** 持ち時間切れ: チェックできればチェック、できなければフォールド */
  timeout: () => void;
  cpuAct: () => void;
  nextHand: () => void;
  rebuyHuman: () => void;
  quit: () => void;
};

/** 初心者モードでは使わない設定を既定値に戻す */
function normalize(config: GameConfig): GameConfig {
  return config.mode === "beginner" ? { ...config, format: "cash", timeLimit: 0 } : config;
}

function newGameState(config: GameConfig): GameState {
  const cpuLevel: CpuLevel = config.mode === "beginner" ? "easy" : config.cpuLevel;
  const players = [
    { id: HUMAN_ID, name: "あなた", isHuman: true },
    ...Array.from({ length: config.cpuCount }, (_, i) => ({
      id: `cpu${i + 1}`,
      name: `CPU${i + 1}`,
      isHuman: false,
      cpuLevel,
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

  startGame: (draft) => {
    const config = normalize(draft);
    set({ config, game: newGameState(config) });
  },

  restart: () => {
    const { config } = get();
    if (config) set({ game: newGameState(config) });
  },

  act: (action) => {
    const { game } = get();
    if (!game || !getPlayerToAct(game)?.isHuman) return;
    set({ game: applyAction(game, action) });
  },

  timeout: () => {
    const { game } = get();
    if (!game || !getPlayerToAct(game)?.isHuman) return;
    const legal = getLegalActions(game);
    set({ game: applyAction(game, { type: legal?.check ? "check" : "fold" }) });
  },

  cpuAct: () => {
    const { game } = get();
    if (!game || game.toActIndex === null || game.players[game.toActIndex].isHuman) return;
    set({ game: applyAction(game, decideCpuAction(game)) });
  },

  nextHand: () => {
    const { game, config } = get();
    if (!game?.isHandOver || !config) return;
    const next =
      config.format === "tournament" ? setBlinds(game, blindsForLevel(config.blinds, blindLevel(game.handNumber))) : game;
    set({ game: startHand(next) });
  },

  rebuyHuman: () => {
    const { game, config } = get();
    if (game?.isHandOver && config) set({ game: startHand(rebuy(game, HUMAN_ID, config.startingStack)) });
  },

  quit: () => set({ game: null, config: null }),
}));
