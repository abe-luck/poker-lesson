"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { formatChips, MODE_NAMES, STREET_NAMES } from "@/content/ja";
import { parseCards } from "@/engine/cards";
import type { Mode, Street } from "@/engine/types";
import { useStatsStore, type HistoryEntry, type ModeStats } from "@/store/statsStore";
import { PlayingCard } from "@/components/table/PlayingCard";
import { AppHeader } from "@/components/ui/AppHeader";
import { buttonClass } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Form";

const percent = (part: number, total: number) => (total === 0 ? "—" : `${Math.round((part / total) * 100)}%`);
const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${formatChips(Math.abs(n))}`;

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
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Tile label="遊んだハンド" value={formatChips(stats.hands)} />
      <Tile label="勝ったハンド" value={percent(stats.won, stats.hands)} sub={`${formatChips(stats.won)} ハンド`} />
      <Tile label="収支（チップ）" value={signed(stats.net)} tone={stats.net > 0 ? "good" : stats.net < 0 ? "bad" : undefined} />
      <Tile label="1ハンドの最大の勝ち" value={stats.biggestWin > 0 ? `+${formatChips(stats.biggestWin)}` : "—"} />
      <Tile label="ショーダウンで勝った割合" value={percent(stats.showdownsWon, stats.showdowns)} sub={`${formatChips(stats.showdowns)} 回見せ合い`} />
      <Tile label="VPIP" value={percent(stats.vpip, stats.hands)} sub="プリフロップで自分からチップを出した割合" />
      <Tile label="PFR" value={percent(stats.pfr, stats.hands)} sub="プリフロップでベット・レイズした割合" />
      {mode === "pro" && (
        <Tile
          label="スタイル"
          value={stats.hands < 20 ? "—" : stats.vpip / stats.hands > 0.35 ? "積極的" : stats.vpip / stats.hands < 0.2 ? "慎重" : "標準的"}
          sub="20ハンド以上遊ぶと表示します（VPIP から判定）"
        />
      )}
    </div>
  );
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const [open, setOpen] = useState(false);
  const date = new Date(entry.playedAt);
  const time = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  const streets = (["preflop", "flop", "turn", "river"] as Street[]).filter((s) => entry.log.some((e) => e.street === s));

  return (
    <li className="border-t border-border first:border-t-0">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full flex-col gap-2.5 px-4 py-3 text-left hover:bg-background sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-xs text-muted tabular-nums">
            {time}・ハンド #{entry.handNumber}
          </span>
          <span className="truncate text-[15px] font-bold">{entry.title}</span>
          {entry.handName && <span className="text-[13px] text-muted">あなた: {entry.handName}</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5" aria-label="手札">
            {parseCards(entry.holeCards).map((c) => (
              <PlayingCard key={`${c.rank}${c.suit}`} card={c} size="sm" />
            ))}
          </div>
          <div className="hidden gap-0.5 sm:flex" aria-label="場のカード">
            {parseCards(entry.board).map((c) => (
              <PlayingCard key={`${c.rank}${c.suit}`} card={c} size="sm" />
            ))}
          </div>
          <span className={`w-16 text-right text-[15px] font-bold tabular-nums ${entry.net > 0 ? "text-felt" : entry.net < 0 ? "text-danger" : "text-muted"}`}>
            {signed(entry.net)}
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
              <span className="text-xs font-bold text-muted">{STREET_NAMES[street]}</span>
              <ul className="flex flex-col gap-1 text-[13px]">
                {entry.log
                  .filter((e) => e.street === street)
                  .map((e, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span>{e.name}</span>
                      <span className="text-muted tabular-nums">{e.text}</span>
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
  const hydrated = useStatsHydrated();
  const stats = useStatsStore((s) => s.stats);
  const history = useStatsStore((s) => s.history);
  const [mode, setMode] = useState<Mode>("beginner");
  const entries = history.filter((h) => h.mode === mode);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader back={{ href: "/", label: "戻る" }} />
      <main className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 py-8 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[28px] font-bold">成績</h1>
          <Segmented label="モード" options={["beginner", "pro"] as Mode[]} value={mode} format={(m) => MODE_NAMES[m]} onChange={setMode} />
        </div>

        {!hydrated ? (
          <p className="text-muted" aria-busy="true">
            読み込み中…
          </p>
        ) : stats[mode].hands === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface px-6 py-12 text-center">
            <p className="text-muted">{MODE_NAMES[mode]}で遊んだ記録はまだありません。</p>
            <Link href="/play" className={buttonClass("primary", "lg")}>
              遊んでみる
            </Link>
          </div>
        ) : (
          <>
            <StatTiles stats={stats[mode]} mode={mode} />
            <section className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-bold">ハンド履歴</h2>
                <span className="text-xs text-muted">両モード合わせて直近50ハンドまで保存します</span>
              </div>
              {entries.length > 0 ? (
                <ul className="overflow-hidden rounded-2xl border border-border bg-surface">
                  {entries.map((entry) => (
                    <HistoryRow key={entry.id} entry={entry} />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">このモードの履歴は残っていません。</p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
