"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { parseCards } from "@/engine/cards";
import type { Mode, Street } from "@/engine/types";
import { handName, playerName } from "@/i18n";
import { useI18n } from "@/i18n/I18nProvider";
import { useStatsStore, type HistoryEntry, type ModeStats } from "@/store/statsStore";
import { PlayingCard } from "@/components/table/PlayingCard";
import { AppHeader } from "@/components/ui/AppHeader";
import { buttonClass } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Form";

const percent = (part: number, total: number) => (total === 0 ? "—" : `${Math.round((part / total) * 100)}%`);

function useStatsHydrated() {
  return useSyncExternalStore(
    (onChange) => useStatsStore.persist.onFinishHydration(onChange),
    () => useStatsStore.persist.hasHydrated(),
    () => false,
  );
}

function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface px-4 py-3.5">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-2xl font-bold tabular-nums ${tone === "good" ? "text-felt" : tone === "bad" ? "text-danger" : ""}`}>{value}</span>
      {sub && <span className="text-xs leading-relaxed text-muted">{sub}</span>}
    </div>
  );
}

function StatTiles({ stats, mode }: { stats: ModeStats; mode: Mode }) {
  const { t } = useI18n();
  const s = t.stats;
  const vpipRate = stats.hands === 0 ? 0 : stats.vpip / stats.hands;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Tile label={s.handsPlayed} value={t.formatChips(stats.hands)} />
      <Tile label={s.handsWon} value={percent(stats.won, stats.hands)} sub={s.handsCount(stats.won)} />
      <Tile label={s.net} value={t.common.signed(stats.net)} tone={stats.net > 0 ? "good" : stats.net < 0 ? "bad" : undefined} />
      <Tile label={s.biggestWin} value={stats.biggestWin > 0 ? `+${t.formatChips(stats.biggestWin)}` : "—"} />
      <Tile label={s.showdownWin} value={percent(stats.showdownsWon, stats.showdowns)} sub={s.showdownCount(stats.showdowns)} />
      <Tile label="VPIP" value={percent(stats.vpip, stats.hands)} sub={s.vpipSub} />
      <Tile label="PFR" value={percent(stats.pfr, stats.hands)} sub={s.pfrSub} />
      {mode === "pro" && (
        <Tile
          label={s.style}
          value={stats.hands < 20 ? "—" : vpipRate > 0.35 ? s.styles.loose : vpipRate < 0.2 ? s.styles.tight : s.styles.standard}
          sub={s.styleSub}
        />
      )}
    </div>
  );
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const streets = (["preflop", "flop", "turn", "river"] as Street[]).filter((s) => entry.log.some((e) => e.street === s));
  const winners = entry.winners;
  const title =
    winners.length > 1
      ? t.result.tie(t.common.list(winners.map((w) => playerName(t, w))))
      : winners[0]?.isHuman
        ? t.result.youWin
        : t.result.wins(winners[0]?.name ?? "");

  return (
    <li className="border-t border-border first:border-t-0">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full flex-col gap-2.5 px-4 py-3 text-left hover:bg-background sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-xs text-muted tabular-nums">
            {t.stats.date(new Date(entry.playedAt))} · {t.common.handNumber(entry.handNumber)}
          </span>
          <span className="truncate text-[15px] font-bold">{title}</span>
          {entry.hand && <span className="text-[13px] text-muted">{t.stats.yourHand(handName(t, entry.hand))}</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5" aria-label={t.stats.holeCards}>
            {parseCards(entry.holeCards).map((c) => (
              <PlayingCard key={`${c.rank}${c.suit}`} card={c} size="sm" />
            ))}
          </div>
          <div className="hidden gap-0.5 sm:flex" aria-label={t.stats.board}>
            {parseCards(entry.board).map((c) => (
              <PlayingCard key={`${c.rank}${c.suit}`} card={c} size="sm" />
            ))}
          </div>
          <span className={`w-16 text-right text-[15px] font-bold tabular-nums ${entry.net > 0 ? "text-felt" : entry.net < 0 ? "text-danger" : "text-muted"}`}>
            {t.common.signed(entry.net)}
          </span>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}>
            <path d="m5 7.5 5 5 5-5" />
          </svg>
        </div>
      </button>
      {open && (
        <div className="grid gap-4 bg-background px-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
          {streets.map((street) => (
            <div key={street} className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-muted">{t.common.streetNames[street]}</span>
              <ul className="flex flex-col gap-1 text-[13px]">
                {entry.log
                  .filter((e) => e.street === street)
                  .map((e, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span>{playerName(t, e.player)}</span>
                      <span className="text-muted tabular-nums">{t.actions.label(e)}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

export function StatsScreen() {
  const { t, href } = useI18n();
  const hydrated = useStatsHydrated();
  const stats = useStatsStore((s) => s.stats);
  const history = useStatsStore((s) => s.history);
  const [mode, setMode] = useState<Mode>("beginner");
  const entries = history.filter((h) => h.mode === mode);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader back={{ href: href("/"), label: t.common.back }} />
      <main className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 py-8 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[28px] font-bold">{t.stats.title}</h1>
          <Segmented label={t.stats.mode} options={["beginner", "pro"] as Mode[]} value={mode} format={(m) => t.common.modeNames[m]} onChange={setMode} />
        </div>

        {!hydrated ? (
          <p className="text-muted" aria-busy="true">
            {t.common.loading}
          </p>
        ) : stats[mode].hands === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface px-6 py-12 text-center">
            <p className="text-muted">{t.stats.empty(t.common.modeNames[mode])}</p>
            <Link href={href("/play")} className={buttonClass("primary", "lg")}>
              {t.stats.play}
            </Link>
          </div>
        ) : (
          <>
            <StatTiles stats={stats[mode]} mode={mode} />
            <section className="flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 className="text-lg font-bold">{t.stats.history}</h2>
                <span className="text-xs text-muted">{t.stats.historyNote}</span>
              </div>
              {entries.length > 0 ? (
                <ul className="overflow-hidden rounded-2xl border border-border bg-surface">
                  {entries.map((entry) => (
                    <HistoryRow key={entry.id} entry={entry} />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">{t.stats.noHistory}</p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
