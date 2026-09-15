"use client";

import { useEffect, useRef } from "react";
import type { GameState } from "@/engine/types";
import { playSound } from "@/lib/sound";
import { useSettingsStore } from "@/store/settingsStore";

/** 前回の状態と比べて、配る・めくる・チップ・自分の番・勝ちの音を鳴らす */
export function useGameSounds(game: GameState | null) {
  const enabled = useSettingsStore((s) => s.soundEnabled);
  const volume = useSettingsStore((s) => s.volume);
  const previous = useRef<GameState | null>(null);

  useEffect(() => {
    const prev = previous.current;
    previous.current = game;
    if (!enabled || !game || !prev || prev === game) return;

    if (game.handNumber !== prev.handNumber) {
      playSound("deal", volume);
      return;
    }
    if (game.isHandOver && !prev.isHandOver) {
      const human = game.players.find((p) => p.isHuman);
      if (human && game.result?.payouts.some((p) => p.playerId === human.id)) playSound("win", volume);
      return;
    }
    if (game.board.length > prev.board.length) {
      playSound("flip", volume);
    } else if (game.log.length > prev.log.length && (game.log.at(-1)?.paid ?? 0) > 0) {
      playSound("chips", volume);
    }
    const toAct = game.toActIndex === null ? null : game.players[game.toActIndex];
    if (toAct?.isHuman && game.toActIndex !== prev.toActIndex) {
      setTimeout(() => playSound("turn", volume), 180);
    }
  }, [game, enabled, volume]);
}
