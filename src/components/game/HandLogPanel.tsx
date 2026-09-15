"use client";

import type { GameState, Street } from "@/engine/types";
import { playerName } from "@/i18n";
import { useI18n } from "@/i18n/I18nProvider";
import { PlayingCard } from "@/components/table/PlayingCard";

const BOARD_COUNT: Partial<Record<Street, number>> = { flop: 3, turn: 4, river: 5 };
const STREETS: Street[] = ["preflop", "flop", "turn", "river"];

/** このハンドの行動をストリートごとに並べる */
export function HandLog({ state }: { state: GameState }) {
  const { t } = useI18n();
  const nameOf = (id: string) => {
    const player = state.players.find((p) => p.id === id);
    return player ? playerName(t, player) : id;
  };
  const toAct = state.toActIndex === null ? null : state.players[state.toActIndex];

  return (
    <div className="flex flex-col gap-5">
      {STREETS.filter((street) => state.log.some((e) => e.street === street) || street === state.street).map((street) => {
        const count = BOARD_COUNT[street];
        const newCards = count ? state.board.slice(street === "flop" ? 0 : count - 1, count) : [];
        return (
          <section key={street} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-muted">{t.common.streetNames[street]}</h3>
              <div className="flex gap-0.5">
                {newCards.map((card) => (
                  <PlayingCard key={`${card.rank}${card.suit}`} card={card} size="sm" />
                ))}
              </div>
            </div>
            <ul className="flex flex-col gap-1 text-[13px]">
              {state.log
                .filter((e) => e.street === street)
                .map((e, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>{nameOf(e.playerId)}</span>
                    <span className="text-muted tabular-nums">{t.actions.label(e)}</span>
                  </li>
                ))}
              {toAct && street === state.street && (
                <li className="flex justify-between gap-3 font-bold">
                  <span>{playerName(t, toAct)}</span>
                  <span className="text-accent">{t.game.thinkingFlow}</span>
                </li>
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function HandLogSidePanel({ state }: { state: GameState }) {
  const { t } = useI18n();
  return (
    <aside aria-label={t.game.handLogTitle} className="hidden w-[280px] shrink-0 overflow-y-auto border-l border-border bg-surface p-5 xl:block">
      <h2 className="mb-4 text-[15px] font-bold">{t.game.handLogTitle}</h2>
      <HandLog state={state} />
    </aside>
  );
}
