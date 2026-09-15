"use client";

import Link from "next/link";
import { MODE_NAMES } from "@/content/ja";
import { isGameOver } from "@/engine/game";
import { useGameStore } from "@/store/gameStore";
import { useGameStoreHydrated } from "@/components/SettingsHydrator";
import { buttonClass } from "@/components/ui/Button";

/** 途中のゲームが保存されていれば「続きから」を表示する */
export function ResumeButton() {
  const hydrated = useGameStoreHydrated();
  const game = useGameStore((s) => s.game);
  if (!hydrated || !game || isGameOver(game)) return null;

  return (
    <Link href="/play/game" className={buttonClass("secondary", "lg", "px-7")}>
      続きから（{MODE_NAMES[game.mode]}・ハンド #{game.handNumber}）
    </Link>
  );
}
