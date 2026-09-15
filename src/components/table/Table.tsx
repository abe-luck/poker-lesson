import type { CSSProperties } from "react";
import { actionLabel, formatChips, handName, STREET_NAMES } from "@/content/ja";
import { sameCard } from "@/engine/cards";
import { getPotTotal } from "@/engine/game";
import type { GameState, HandRank, Player } from "@/engine/types";
import { CardBack, CardSlot, PlayingCard } from "./PlayingCard";

/** PC 表示での CPU 席の位置 (テーブル領域に対する %)。左 → 上 → 右 の時計回り */
const SEAT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 9]],
  2: [[22, 16], [78, 16]],
  3: [[9, 46], [50, 9], [91, 46]],
  4: [[9, 58], [27, 11], [73, 11], [91, 58]],
  5: [[9, 64], [13, 18], [50, 8], [87, 18], [91, 64]],
};

type SeatInfo = {
  label: string | null;
  hand: HandRank | null;
  payout: number;
  reveal: boolean;
};

function seatInfo(state: GameState, player: Player, index: number): SeatInfo {
  const result = state.result;
  const hand = result?.showdown.find((s) => s.playerId === player.id)?.hand ?? null;
  const payout = result?.payouts.find((p) => p.playerId === player.id)?.amount ?? 0;
  const lastEntry = state.log.findLast((e) => e.playerId === player.id && e.street === state.street);

  let label: string | null = null;
  if (player.status === "out") label = "脱落";
  else if (state.isHandOver && payout > 0) label = `+${formatChips(payout)}`;
  else if (state.toActIndex === index) label = "考え中…";
  else if (player.status === "folded") label = "フォールド";
  else if (lastEntry) label = actionLabel(lastEntry);
  else if (player.status === "allin") label = "オールイン";

  return { label, hand, payout, reveal: hand !== null };
}

function DealerBadge() {
  return (
    <span
      title="ディーラー"
      className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-[#d9d9d4] bg-white text-[11px] font-bold text-[#1f2328]"
    >
      D
    </span>
  );
}

function CpuSeat({ state, player, index, style }: { state: GameState; player: Player; index: number; style?: CSSProperties }) {
  const info = seatInfo(state, player, index);
  const inactive = player.status === "folded" || player.status === "out";
  const toAct = state.toActIndex === index;

  return (
    <div
      style={style}
      className={`flex flex-col gap-1.5 rounded-xl border bg-surface px-2.5 py-2 shadow-[0_2px_8px_rgba(0,0,0,.06)] transition md:absolute md:z-10 md:left-(--x) md:top-(--y) md:w-[168px] md:-translate-x-1/2 md:-translate-y-1/2 md:px-3 md:py-2.5 ${
        toAct ? "border-accent ring-2 ring-accent/25" : info.payout > 0 ? "border-felt ring-2 ring-felt/25" : "border-border"
      } ${inactive ? "opacity-55" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-bold md:text-sm">{player.name}</span>
            {state.dealerIndex === index && <DealerBadge />}
          </div>
          <span className="text-[13px] text-muted tabular-nums md:text-sm">{formatChips(player.stack)}</span>
        </div>
        {info.reveal ? (
          <div className="flex gap-0.5">
            {player.holeCards.map((card) => (
              <PlayingCard key={`${card.rank}${card.suit}`} card={card} size="sm" />
            ))}
          </div>
        ) : (
          player.holeCards.length > 0 &&
          !inactive && (
            <div className="hidden gap-[3px] md:flex">
              <CardBack />
              <CardBack />
            </div>
          )
        )}
      </div>
      {info.hand && <span className="text-xs font-medium">{handName(info.hand)}</span>}
      {info.label && (
        <span
          className={`self-start rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
            info.payout > 0 ? "bg-felt text-white" : toAct ? "bg-accent-soft text-accent" : "bg-[#eef0f2] text-muted"
          }`}
        >
          {info.label}
        </span>
      )}
    </div>
  );
}

function HumanSeat({ state, player, index }: { state: GameState; player: Player; index: number }) {
  const info = seatInfo(state, player, index);
  const toAct = state.toActIndex === index;
  const used = (info.hand?.bestFive ?? []).filter((c) => player.holeCards.some((h) => sameCard(h, c)));

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border-2 bg-surface px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,.08)] md:absolute md:z-10 md:bottom-0 md:left-1/2 md:w-[440px] md:-translate-x-1/2 ${
        toAct ? "border-accent" : info.payout > 0 ? "border-felt" : "border-border"
      } ${player.status === "folded" || player.status === "out" ? "opacity-70" : ""}`}
    >
      <div className="flex gap-2">
        {player.holeCards.length > 0 ? (
          player.holeCards.map((card) => (
            <PlayingCard key={`${card.rank}${card.suit}`} card={card} size="lg" highlight={used.some((u) => sameCard(u, card))} />
          ))
        ) : (
          <>
            <CardSlot size="lg" />
            <CardSlot size="lg" />
          </>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-bold">{player.name}</span>
            {state.dealerIndex === index && <DealerBadge />}
          </div>
          <span className="text-[15px] text-muted tabular-nums">{formatChips(player.stack)}</span>
        </div>
        {info.hand && <span className="text-base font-bold">{handName(info.hand)}</span>}
        {info.label && (
          <span
            className={`self-start rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
              info.payout > 0 ? "bg-felt text-white" : toAct ? "bg-accent-soft text-accent" : "bg-[#eef0f2] text-muted"
            }`}
          >
            {toAct ? "あなたの番です" : info.label}
          </span>
        )}
      </div>
    </div>
  );
}

function Board({ state }: { state: GameState }) {
  const winningCards = state.isHandOver
    ? state.result?.showdown
        .filter((s) => state.result?.pots[0]?.winnerIds.includes(s.playerId))
        .flatMap((s) => s.hand.bestFive) ?? []
    : [];

  return (
    <div className="flex h-[200px] flex-col items-center justify-center gap-3 rounded-3xl bg-felt px-3 shadow-[inset_0_0_0_8px_var(--felt-rim)] sm:h-[230px] md:absolute md:inset-x-[13%] md:top-[19%] md:bottom-[27%] md:h-auto md:rounded-full md:shadow-[inset_0_0_0_12px_var(--felt-rim)]">
      <div className="rounded-full bg-black/22 px-4 py-1.5 text-sm font-bold text-white tabular-nums sm:text-[15px]">
        ポット {formatChips(getPotTotal(state))}
      </div>
      <div className="flex gap-1.5 sm:gap-2">
        {Array.from({ length: 5 }, (_, i) => {
          const card = state.board[i];
          return card ? (
            <PlayingCard
              key={i}
              card={card}
              highlight={winningCards.some((w) => sameCard(w, card))}
            />
          ) : (
            <CardSlot key={i} />
          );
        })}
      </div>
      <div className="text-[13px] text-white/70">{STREET_NAMES[state.street]}</div>
    </div>
  );
}

export function Table({ state }: { state: GameState }) {
  const humanIndex = state.players.findIndex((p) => p.isHuman);
  const cpus = state.players
    .map((player, index) => ({ player, index }))
    .filter(({ index }) => index !== humanIndex);
  // 人間の左隣から時計回りに並べる
  cpus.sort((a, b) => ((a.index - humanIndex + state.players.length) % state.players.length) - ((b.index - humanIndex + state.players.length) % state.players.length));
  const positions = SEAT_POSITIONS[cpus.length] ?? [];

  return (
    <div className="relative mx-auto flex w-full max-w-[1080px] flex-col gap-3 md:block md:h-[clamp(460px,calc(100dvh-250px),620px)]">
      <div className={`grid gap-2 md:contents ${cpus.length >= 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {cpus.map(({ player, index }, i) => (
          <CpuSeat
            key={player.id}
            state={state}
            player={player}
            index={index}
            style={{ "--x": `${positions[i]?.[0] ?? 50}%`, "--y": `${positions[i]?.[1] ?? 10}%` } as CSSProperties}
          />
        ))}
      </div>
      <Board state={state} />
      {humanIndex >= 0 && <HumanSeat state={state} player={state.players[humanIndex]} index={humanIndex} />}
    </div>
  );
}
