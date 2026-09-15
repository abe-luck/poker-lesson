import { create } from "zustand";
import { persist } from "zustand/middleware";
import { decideCpuAction } from "@/ai/cpu";
import { safeStorage } from "@/lib/storage";
import { useStatsStore } from "./statsStore";
import { cryptoRng } from "@/engine/cards";
import { applyAction, createGame, getLegalActions, getPlayerToAct, rebuy, setBlinds, startHand } from "@/engine/game";
import { blindLevel, blindsForLevel } from "@/engine/tournament";
import type { Action, Blinds, CpuLevel, GameState, Mode } from "@/engine/types";

export const HUMAN_ID = "you";
export const SESSION_KEY = "poker.session.v1";

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

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => {
      /** 状態を更新し、ハンドが終わった瞬間なら成績に記録する */
      const commit = (next: GameState) => {
        const prev = get().game;
        set({ game: next });
        if (next.isHandOver && (!prev || !prev.isHandOver || prev.handNumber !== next.handNumber)) {
          useStatsStore.getState().recordHand(next);
        }
      };

      return {
        draft: DEFAULT_CONFIG,
        config: null,
        game: null,

        updateDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

        startGame: (draft) => {
          const config = normalize(draft);
          set({ config, game: null });
          commit(newGameState(config));
        },

        restart: () => {
          const { config } = get();
          if (!config) return;
          set({ game: null });
          commit(newGameState(config));
        },

        act: (action) => {
          const { game } = get();
          if (!game || !getPlayerToAct(game)?.isHuman) return;
          commit(applyAction(game, action));
        },

        timeout: () => {
          const { game } = get();
          if (!game || !getPlayerToAct(game)?.isHuman) return;
          const legal = getLegalActions(game);
          commit(applyAction(game, { type: legal?.check ? "check" : "fold" }));
        },

        cpuAct: () => {
          const { game } = get();
          if (!game || game.toActIndex === null || game.players[game.toActIndex].isHuman) return;
          commit(applyAction(game, decideCpuAction(game)));
        },

        nextHand: () => {
          const { game, config } = get();
          if (!game?.isHandOver || !config) return;
          const next =
            config.format === "tournament" ? setBlinds(game, blindsForLevel(config.blinds, blindLevel(game.handNumber))) : game;
          commit(startHand(next));
        },

        rebuyHuman: () => {
          const { game, config } = get();
          if (game?.isHandOver && config) commit(startHand(rebuy(game, HUMAN_ID, config.startingStack)));
        },

        quit: () => set({ game: null, config: null }),
      };
    },
    {
      name: SESSION_KEY,
      storage: safeStorage,
      // 途中で閉じても続きから再開できるように、設定と進行中のゲームを保存する
      partialize: (s) => ({ draft: s.draft, config: s.config, game: s.game }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<GameStore> | undefined;
        return { ...current, ...saved, draft: { ...DEFAULT_CONFIG, ...saved?.draft } };
      },
      skipHydration: true,
    },
  ),
);
