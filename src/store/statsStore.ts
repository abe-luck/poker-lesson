import { create } from "zustand";
import { persist } from "zustand/middleware";
import { actionLabel, handName } from "@/content/ja";
import { cardToString } from "@/engine/cards";
import type { GameState, Mode, Street } from "@/engine/types";
import { reviewHand } from "@/guide/guide";
import { safeStorage } from "@/lib/storage";

export const STATS_KEY = "poker.stats.v1";
export const HISTORY_LIMIT = 50;

export type ModeStats = {
  hands: number;
  /** ポットの一部でも獲得したハンド */
  won: number;
  net: number;
  /** プリフロップで自分からチップを出した (コール / ベット / レイズ) ハンド */
  vpip: number;
  /** プリフロップでベット / レイズしたハンド */
  pfr: number;
  showdowns: number;
  showdownsWon: number;
  biggestWin: number;
};

export type HistoryEntry = {
  id: string;
  playedAt: number;
  mode: Mode;
  handNumber: number;
  holeCards: string;
  board: string;
  net: number;
  title: string;
  /** ショーダウンした場合のあなたの役 */
  handName: string | null;
  log: { street: Street; name: string; text: string }[];
};

const EMPTY: ModeStats = { hands: 0, won: 0, net: 0, vpip: 0, pfr: 0, showdowns: 0, showdownsWon: 0, biggestWin: 0 };

type StatsStore = {
  stats: Record<Mode, ModeStats>;
  history: HistoryEntry[];
  recordHand: (state: GameState) => void;
  reset: () => void;
};

/** 終わったハンドから、成績に足す値と履歴を作る */
export function summarizeHand(state: GameState, now = Date.now()): { delta: ModeStats; entry: HistoryEntry } | null {
  const human = state.players.find((p) => p.isHuman);
  if (!state.isHandOver || !state.result || !human || human.holeCards.length === 0) return null;

  const payout = state.result.payouts.find((p) => p.playerId === human.id)?.amount ?? 0;
  const net = payout - human.totalBet;
  const preflop = state.log.filter((e) => e.street === "preflop" && e.playerId === human.id);
  const showdown = state.result.showdown.find((s) => s.playerId === human.id);
  const nameOf = (id: string) => state.players.find((p) => p.id === id)?.name ?? id;

  return {
    delta: {
      hands: 1,
      won: payout > 0 ? 1 : 0,
      net,
      vpip: preflop.some((e) => ["call", "bet", "raise", "allin"].includes(e.type)) ? 1 : 0,
      pfr: preflop.some((e) => ["bet", "raise"].includes(e.type) || (e.type === "allin" && e.total > state.blinds.big)) ? 1 : 0,
      showdowns: showdown ? 1 : 0,
      showdownsWon: showdown && payout > 0 ? 1 : 0,
      biggestWin: Math.max(0, net),
    },
    entry: {
      id: `${now}-${state.handNumber}`,
      playedAt: now,
      mode: state.mode,
      handNumber: state.handNumber,
      holeCards: human.holeCards.map(cardToString).join(" "),
      board: state.board.map(cardToString).join(" "),
      net,
      title: reviewHand(state, human.id)?.title ?? "",
      handName: showdown ? handName(showdown.hand) : null,
      log: state.log.map((e) => ({ street: e.street, name: nameOf(e.playerId), text: actionLabel(e) })),
    },
  };
}

export const useStatsStore = create<StatsStore>()(
  persist(
    (set) => ({
      stats: { beginner: EMPTY, pro: EMPTY },
      history: [],
      recordHand: (state) => {
        const summary = summarizeHand(state);
        if (!summary) return;
        const { delta, entry } = summary;
        set((s) => {
          const current = s.stats[state.mode];
          return {
            stats: {
              ...s.stats,
              [state.mode]: {
                hands: current.hands + delta.hands,
                won: current.won + delta.won,
                net: current.net + delta.net,
                vpip: current.vpip + delta.vpip,
                pfr: current.pfr + delta.pfr,
                showdowns: current.showdowns + delta.showdowns,
                showdownsWon: current.showdownsWon + delta.showdownsWon,
                biggestWin: Math.max(current.biggestWin, delta.biggestWin),
              },
            },
            history: [entry, ...s.history].slice(0, HISTORY_LIMIT),
          };
        });
      },
      reset: () => set({ stats: { beginner: EMPTY, pro: EMPTY }, history: [] }),
    }),
    { name: STATS_KEY, storage: safeStorage, skipHydration: true },
  ),
);
