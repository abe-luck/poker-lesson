"use client";

import Link from "next/link";
import { isGameOver } from "@/engine/game";
import { useI18n } from "@/i18n/I18nProvider";
import { useGameStore } from "@/store/gameStore";
import { useGameStoreHydrated } from "@/components/SettingsHydrator";
import { buttonClass } from "@/components/ui/Button";

/** 途中のゲームが保存されていれば「続きから」を表示する */
export function ResumeButton() {
  const hydrated = useGameStoreHydrated();
  const game = useGameStore((s) => s.game);
  const { t, href } = useI18n();
  if (!hydrated || !game || isGameOver(game)) return null;

  return (
    <Link href={href("/play/game")} className={buttonClass("secondary", "lg", "px-7")}>
      {t.top.resume(t.common.modeNames[game.mode], game.handNumber)}
    </Link>
  );
}
